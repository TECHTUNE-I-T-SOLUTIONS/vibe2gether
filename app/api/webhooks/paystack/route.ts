import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { generateTicketPDF } from "@/lib/ticket-generator"
import { sendTicketEmail } from "@/lib/email-service"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || ""

/**
 * Verify Paystack webhook signature
 */
function verifyPaystackSignature(request: any, signature: string): boolean {
  try {
    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET)
      .update(JSON.stringify(request))
      .digest("hex")
    return hash === signature
  } catch (error) {
    console.error("[Paystack] Signature verification error:", error)
    return false
  }
}

/**
 * Handle Paystack webhook events
 * Paystack sends events like charge.success, charge.failed, etc.
 */
export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-paystack-signature") || ""
    const body = await request.json()

    // Verify signature
    if (!verifyPaystackSignature(body, signature)) {
      console.error("[Paystack] Invalid webhook signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const { event, data } = body

    if (!event) {
      return NextResponse.json({ error: "No event provided" }, { status: 400 })
    }

    console.log(`[Paystack] Received webhook event: ${event}`)

    // Handle charge.success event
    if (event === "charge.success") {
      const reference = data.reference
      const amount = data.amount / 100 // Paystack returns amount in kobo (1/100 of Naira)
      const authorization = data.authorization
      const customer = data.customer

      console.log(`[Paystack] Processing successful payment: ${reference}`)

      // Update transaction status
      const { data: transaction, error: txError } = await supabase
        .from("transactions")
        .select("*")
        .eq("payment_reference", reference)
        .single()

      if (txError || !transaction) {
        console.error(`[Paystack] Transaction not found for reference: ${reference}`)
        return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
      }

      // Update transaction to completed
      const { error: updateError } = await supabase
        .from("transactions")
        .update({
          status: "completed",
          metadata: {
            ...transaction.metadata,
            paystack_payment_id: data.id,
            paystack_authorization: authorization,
            paystack_customer: customer,
            completed_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", transaction.id)

      if (updateError) {
        console.error("[Paystack] Failed to update transaction:", updateError)
        return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 })
      }

      // Create notification for user
      if (transaction.user_id) {
        await supabase.from("notifications").insert({
          user_id: transaction.user_id,
          title: "Payment Successful",
          message: `Your payment of ₦${amount.toFixed(2)} has been received and confirmed.`,
          type: "payment",
          related_type: transaction.type,
          related_id: transaction.id,
          is_read: false,
          created_at: new Date().toISOString(),
        })
      }

      // Handle different transaction types
      if (transaction.type === "marketplace_purchase") {
        // For marketplace purchases, the transaction itself serves as the order record
        // Seller can see transactions to know they have a purchase
        console.log(`[Paystack] Marketplace purchase confirmed for transaction: ${transaction.id}`)
      } else if (transaction.type === "event_registration") {
        const metadata = transaction.metadata || {}

        if (metadata.registration_id) {
          const { error: regError } = await supabase
            .from("event_registrations")
            .update({
              status: "confirmed",
              payment_status: "completed",
              payment_reference: reference,
              transaction_id: transaction.id,
              paid_at: new Date().toISOString(),
              amount_paid: amount,
              currency: "NGN",
              payment_method: "paystack",
            })
            .eq("id", metadata.registration_id)

          if (regError) {
            console.error("[Paystack] Failed to update event registration:", regError)
          }
        } else if (transaction.user_id && metadata.eventId) {
          const { data: existingReg } = await supabase
            .from("event_registrations")
            .select("id")
            .eq("event_id", metadata.eventId)
            .eq("user_id", transaction.user_id)
            .single()

          if (!existingReg) {
            const { error: regError } = await supabase
              .from("event_registrations")
              .insert({
                event_id: metadata.eventId,
                user_id: transaction.user_id,
                status: "confirmed",
                payment_status: "completed",
                payment_reference: reference,
                transaction_id: transaction.id,
                paid_at: new Date().toISOString(),
                amount_paid: amount,
                currency: "NGN",
                payment_method: "paystack",
              })

            if (regError) {
              console.error("[Paystack] Failed to create event registration:", regError)
            }
          }
        }

        if (metadata.isTicketPurchase) {
          const { data: ticket, error: ticketError } = await supabase
            .from("event_tickets")
            .update({ status: "paid" })
            .eq("payment_reference", reference)
            .select()
            .single()

          if (ticketError || !ticket) {
            console.error("[Paystack] Failed to update ticket status:", ticketError)
          } else {
            const { data: event } = await supabase
              .from("events")
              .select("*")
              .eq("id", ticket.event_id)
              .single()

            if (event) {
              const pdfBuffer = await generateTicketPDF({
                eventName: event.title,
                eventDate: new Date(event.event_date).toLocaleDateString(),
                eventTime: new Date(event.event_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                venue: event.location_name || "Online / TBD",
                address: event.location_name || "Not specified",
                ticketType: event.is_free ? "Free Pass" : "General Access",
                attendeeName: ticket.attendee_name,
                barcode: ticket.barcode,
              })

              const emailHtml = `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
                  <h1 style="color: #6366f1;">Vibe2Gether Event Ticket</h1>
                  <p>Hi ${ticket.attendee_name},</p>
                  <p>Thank you for purchasing a ticket for <strong>${event.title}</strong>!</p>
                  <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Event:</strong> ${event.title}</p>
                    <p><strong>Date:</strong> ${new Date(event.event_date).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> ${new Date(event.event_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                    <p><strong>Venue:</strong> ${event.location_name || "Not specified"}</p>
                  </div>
                  <p>Your official ticket PDF is attached to this email. Please present it at the venue for scanning.</p>
                  <p>Best regards,<br/>The Vibe2Gether Team</p>
                </div>
              `

              await sendTicketEmail({
                to: ticket.attendee_email,
                subject: `Your Ticket for ${event.title} - Vibe2Gether`,
                html: emailHtml,
                attachments: [
                  {
                    filename: `ticket-${event.title.replace(/\s+/g, "-").toLowerCase()}.pdf`,
                    content: pdfBuffer,
                    contentType: "application/pdf",
                  },
                ],
              })
            }
          }
        }
      } else if (transaction.type === "premium_subscription") {
        // Update premium subscription
        const { error: subError } = await supabase
          .from("premium_subscriptions")
          .update({
            status: "active",
            payment_status: "completed",
            payment_id: transaction.id,
            started_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", transaction.metadata?.subscription_id)

        if (subError) {
          console.error("[Paystack] Failed to update premium subscription:", subError)
        } else {
          console.log(`[Paystack] Premium subscription activated: ${transaction.metadata?.subscription_id}`)
        }
      } else if (transaction.type === "coin_purchase") {
        // Check if coins were already added (prevent duplicate additions)
        if (transaction.metadata?.coins_added) {
          console.log(`[Paystack] Coins already added for transaction ${transaction.id}, skipping`)
          return NextResponse.json({ status: "ok" })
        }

        // Update user's coin balance
        const coinsAmount = transaction.metadata?.coinsAmount || Math.round((amount / 1450) * 500)

        console.log(`[Paystack] Processing coin purchase - Adding ${coinsAmount} coins to user ${transaction.user_id}`)

        // Fetch current balance and add coins
        const { data: user, error: fetchError } = await supabase
          .from("users")
          .select("coins_balance")
          .eq("id", transaction.user_id)
          .single()

        if (fetchError || !user) {
          console.error("[Paystack] Failed to fetch user for coin update:", fetchError)
        } else {
          const newBalance = (user.coins_balance || 0) + coinsAmount
          const { error: addCoinsError } = await supabase
            .from("users")
            .update({
              coins_balance: newBalance,
              updated_at: new Date().toISOString(),
            })
            .eq("id", transaction.user_id)

          if (addCoinsError) {
            console.error("[Paystack] Failed to add coins to user:", addCoinsError)
          } else {
            console.log(`[Paystack] Successfully added ${coinsAmount} coins to user ${transaction.user_id}, new balance: ${newBalance}`)

            // Mark coins as added in transaction metadata
            await supabase
              .from("transactions")
              .update({
                metadata: {
                  ...transaction.metadata,
                  coins_added: true,
                  coins_added_at: new Date().toISOString(),
                },
              })
              .eq("id", transaction.id)

            // Check if coin transaction already exists for this payment
            const { data: existingCoinTx, error: checkError } = await supabase
              .from("coin_transactions")
              .select("id")
              .eq("reference_id", transaction.id)
              .eq("reference_type", "paystack_transaction")
              .single()

            // Only insert if it doesn't already exist
            if (!existingCoinTx && !checkError) {
              const { error: coinTxError } = await supabase
                .from("coin_transactions")
                .insert({
                  user_id: transaction.user_id,
                  amount: coinsAmount,
                  transaction_type: "purchase",
                  description: `Purchased ${coinsAmount} coins via Paystack (₦${amount.toFixed(2)})`,
                  reference_id: transaction.id,
                  reference_type: "paystack_transaction",
                  balance_after: newBalance,
                  created_at: new Date().toISOString(),
                })

              if (coinTxError) {
                console.error("[Paystack] Failed to save coin transaction:", coinTxError)
              } else {
                console.log(`[Paystack] Saved coin transaction for user ${transaction.user_id}`)
              }
            } else {
              console.log(`[Paystack] Coin transaction already exists for reference ${transaction.id}`)
            }
          }
        }
      }

      return NextResponse.json({ status: "ok" })
    }

    // Handle charge.failed event
    if (event === "charge.failed") {
      const reference = data.reference
      const failureMessage = data.failure_message || "Payment failed"

      console.log(`[Paystack] Processing failed payment: ${reference}`)

      // Update transaction status to failed
      const { data: transaction, error: txError } = await supabase
        .from("transactions")
        .select("*")
        .eq("payment_reference", reference)
        .single()

      if (txError || !transaction) {
        console.error(`[Paystack] Transaction not found for reference: ${reference}`)
        return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
      }

      const { error: updateError } = await supabase
        .from("transactions")
        .update({
          status: "failed",
          metadata: {
            ...transaction.metadata,
            failure_reason: failureMessage,
            failed_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", transaction.id)

      if (updateError) {
        console.error("[Paystack] Failed to update transaction:", updateError)
        return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 })
      }

      // Create notification for user
      if (transaction.user_id) {
        await supabase.from("notifications").insert({
          user_id: transaction.user_id,
          title: "Payment Failed",
          message: `Your payment could not be processed. ${failureMessage}`,
          type: "error",
          related_type: transaction.type,
          related_id: transaction.id,
          is_read: false,
          created_at: new Date().toISOString(),
        })
      }

      if (transaction.metadata?.isTicketPurchase) {
        await supabase
          .from("event_tickets")
          .update({ status: "failed" })
          .eq("payment_reference", reference)
      }

      if (transaction.type === "event_registration" && transaction.metadata?.registration_id) {
        await supabase
          .from("event_registrations")
          .update({
            payment_status: "failed",
            payment_reference: reference,
            transaction_id: transaction.id,
          })
          .eq("id", transaction.metadata.registration_id)
      }

      return NextResponse.json({ status: "ok" })
    }

    // Handle other events (log and acknowledge)
    console.log(`[Paystack] Unhandled webhook event: ${event}`)
    return NextResponse.json({ status: "ok" })
  } catch (error) {
    console.error("[Paystack] Webhook processing error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * GET endpoint for webhook health check
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Paystack webhook endpoint is active",
    url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/webhooks/paystack`,
  })
}
