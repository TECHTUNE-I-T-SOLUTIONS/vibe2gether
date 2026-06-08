import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { verifyPayment } from "@/lib/paystack"
import { verifyFlutterwavePayment } from "@/lib/flutterwave"
import { generateTicketPDF } from "@/lib/ticket-generator"
import { sendTicketEmail } from "@/lib/email-service"

async function handlePaymentVerification(reference: string) {
  try {
    console.log(`[Verify Payment] Processing verification for reference: ${reference}`)

    const supabase = await createClient()

    // Find transaction by payment_reference column (primary lookup)
    let transaction: any = null
    let txError: any = null

    const { data: primaryMatch, error: primaryError } = await supabase
      .from("transactions")
      .select("*")
      .eq("payment_reference", reference)

    if (!primaryError && primaryMatch && primaryMatch.length > 0) {
      transaction = primaryMatch[0]
      console.log("[Verify Payment] Found transaction in payment_reference column")
    } else {
      // Fallback: search in metadata.reference using JSON operator
      console.log("[Verify Payment] Not found in payment_reference column, checking metadata...")
      const { data: metadataMatches, error: metaError } = await supabase
        .from("transactions")
        .select("*")
        .filter("metadata->>'reference'", "eq", reference)

      if (!metaError && metadataMatches && metadataMatches.length > 0) {
        transaction = metadataMatches[0]
        console.log("[Verify Payment] Found transaction in metadata")
      } else {
        txError = metaError
      }
    }

    if (txError || !transaction) {
      console.error("[Verify Payment] Transaction not found for reference:", reference, "Error:", txError)
      return {
        success: false,
        status: "pending",
        error: "Transaction not yet found in database",
        code: "TX_NOT_FOUND",
        reference,
      }
    }

    const provider = transaction.payment_method === "flutterwave" || transaction.metadata?.payment_provider === "flutterwave"
      ? "flutterwave"
      : "paystack"

    const verification = provider === "flutterwave"
      ? await verifyFlutterwavePayment(reference, transaction.metadata?.flutterwave_charge_id)
      : await verifyPayment(reference)

    const paymentData = verification.data as any
    const paymentSucceeded = provider === "flutterwave"
      ? verification.status === "success" && ["successful", "succeeded"].includes(paymentData?.status)
      : verification.status && paymentData?.status === "success"

    if (!paymentSucceeded || !paymentData) {
      console.error("[Verify Payment] Payment verification failed from provider:", provider)
      return {
        success: false,
        status: "failed",
        error: "Payment verification failed",
        code: "PAYMENT_FAILED",
      }
    }

    // Update transaction status based on payment status
    const transactionStatus = "completed"

    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        status: transactionStatus,
        metadata: {
          ...transaction.metadata,
          provider_payment_id: paymentData.id,
          paystack_payment_id: provider === "paystack" ? paymentData.id : transaction.metadata?.paystack_payment_id,
          flutterwave_charge_id: provider === "flutterwave" ? paymentData.id : transaction.metadata?.flutterwave_charge_id,
          paid_at: paymentData.paid_at || paymentData.created_at || paymentData.created_datetime || new Date().toISOString(),
        },
      })
      .eq("id", transaction.id)

    if (updateError) {
      console.error("[Verify Payment] Error updating transaction:", updateError)
      throw updateError
    }

    console.log("[Verify Payment] Transaction status updated to:", transactionStatus)

    // If payment successful, perform post-payment actions
    if (transactionStatus === "completed") {
      const metadata = transaction.metadata as any

      // Handle different transaction types
      if (metadata.type === "marketplace_purchase" || transaction.type === "marketplace_purchase") {
        // Create notifications for buyer and seller
        await supabase.from("notifications").insert([
          {
            user_id: transaction.user_id,
            type: "purchase_complete",
            title: "Purchase Complete",
            message: `Your payment for "${metadata.productTitle}" was successful`,
            actor_id: metadata.sellerId,
            reference_id: metadata.productId,
            reference_type: "marketplace_product",
            action_url: `/marketplace/products/${metadata.productId}/ticket`,
          },
          {
            user_id: metadata.sellerId,
            type: "product_sold",
            title: "Product Sold!",
            message: `Your product "${metadata.productTitle}" has been sold`,
            actor_id: transaction.user_id,
            reference_id: metadata.productId,
            reference_type: "marketplace_product",
            action_url: `/marketplace/products/${metadata.productId}`,
          },
        ])
      } else if (metadata.type === "coin_purchase" || transaction.type === "coin_purchase" || metadata.coinsAmount) {
        if (!metadata.coins_added) {
          const coinsAmount = metadata.coinsAmount || Math.round((transaction.amount / 1450) * 500)
          const { data: user } = await supabase
            .from("users")
            .select("coins_balance")
            .eq("id", transaction.user_id)
            .single()

          const newBalance = (user?.coins_balance || 0) + coinsAmount

          await supabase
            .from("users")
            .update({
              coins_balance: newBalance,
              updated_at: new Date().toISOString(),
            })
            .eq("id", transaction.user_id)

          await supabase
            .from("transactions")
            .update({
              metadata: {
                ...metadata,
                coins_added: true,
                coins_added_at: new Date().toISOString(),
              },
            })
            .eq("id", transaction.id)

          await supabase.from("coin_transactions").insert({
            user_id: transaction.user_id,
            amount: coinsAmount,
            transaction_type: "purchase",
            description: `Purchased ${coinsAmount} coins via ${provider === "flutterwave" ? "Method II" : "Method I"}`,
            reference_id: transaction.id,
            reference_type: "payment_transaction",
            balance_after: newBalance,
            created_at: new Date().toISOString(),
          })
        }
      } else if (metadata.type === "event_registration" || transaction.type === "event_registration") {
        if (metadata.registration_id) {
          await supabase
            .from("event_registrations")
            .update({
              status: "confirmed",
              payment_status: "completed",
              payment_reference: reference,
              transaction_id: transaction.id,
              paid_at: new Date().toISOString(),
              amount_paid: paymentData.amount / 100,
              currency: "NGN",
              payment_method: "paystack",
            })
            .eq("id", metadata.registration_id)
        } else if (transaction.user_id && metadata.eventId) {
          await supabase
            .from("event_registrations")
            .upsert(
              {
                event_id: metadata.eventId,
                user_id: transaction.user_id,
                status: "confirmed",
                payment_status: "completed",
                payment_reference: reference,
                transaction_id: transaction.id,
                paid_at: new Date().toISOString(),
                amount_paid: paymentData.amount / 100,
                currency: "NGN",
                payment_method: "paystack",
              },
              { onConflict: "event_id,user_id" }
            )
        } else if (transaction.user_id) {
          const { data: ticketByRef } = await supabase
            .from("event_tickets")
            .select("event_id")
            .eq("payment_reference", reference)
            .single()

          if (ticketByRef?.event_id) {
            await supabase
              .from("event_registrations")
              .upsert(
                {
                  event_id: ticketByRef.event_id,
                  user_id: transaction.user_id,
                  status: "confirmed",
                  payment_status: "completed",
                  payment_reference: reference,
                  transaction_id: transaction.id,
                  paid_at: new Date().toISOString(),
                  amount_paid: paymentData.amount / 100,
                  currency: "NGN",
                  payment_method: "paystack",
                },
                { onConflict: "event_id,user_id" }
              )
          }
        }

        if (metadata.isTicketPurchase) {
          const { data: ticket } = await supabase
            .from("event_tickets")
            .select("*")
            .eq("payment_reference", reference)
            .single()

          if (ticket && ticket.status !== "paid") {
            const { data: updatedTicket } = await supabase
              .from("event_tickets")
              .update({ status: "paid" })
              .eq("payment_reference", reference)
              .select()
              .single()

            if (updatedTicket) {
              const { data: event } = await supabase
                .from("events")
                .select("*")
                .eq("id", updatedTicket.event_id)
                .single()

              if (event) {
                await supabase
                  .from("events")
                  .update({ registered_count: (event.registered_count || 0) + 1 })
                  .eq("id", event.id)

                const pdfBuffer = await generateTicketPDF({
                  eventName: event.title,
                  eventDate: new Date(event.event_date).toLocaleDateString(),
                  eventTime: new Date(event.event_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  venue: event.location_name || "Online / TBD",
                  address: event.location_name || "Not specified",
                  ticketType: event.is_free ? "Free Pass" : "General Access",
                  attendeeName: updatedTicket.attendee_name,
                  barcode: updatedTicket.barcode,
                })

                const emailHtml = `
                  <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
                    <div style="text-align: center; margin-bottom: 16px;">
                      <img src="https://vibe2gether.com/v2g-logo.png" alt="Vibe2Gether Logo" style="max-width: 100px; margin: 0 auto 12px; display: block;" />
                      <h1 style="color: #FF5874; margin: 0;">Vibe2Gether Event Ticket</h1>
                    </div>
                    <p>Hi ${updatedTicket.attendee_name},</p>
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
                  to: updatedTicket.attendee_email,
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
        }

        // Create notification for event registration
        await supabase.from("notifications").insert({
          user_id: transaction.user_id,
          type: "event_registered",
          title: "Registration Confirmed",
          message: `You have successfully registered for the event`,
          actor_id: metadata.eventCreatorId,
          reference_id: metadata.eventId,
          reference_type: "event",
          action_url: `/events/${metadata.eventId}`,
        })
      } else if (
        metadata.type === "premium_subscription" ||
        transaction.type === "premium_subscription"
      ) {
        console.log("[Verify Payment] Activating premium subscription for user:", transaction.user_id)

        // Update subscription status to active - only update status and reference_id to avoid trigger issues
        const { error: subError } = await supabase
          .from("premium_subscriptions")
          .update({
            status: "active",
            reference_id: reference,
          })
          .eq("id", metadata.subscriptionId)
          .select()

        if (subError) {
          console.error("[Verify Payment] Error updating subscription:", subError)
          throw subError
        }

        console.log("[Verify Payment] Subscription activated:", metadata.subscriptionId)

        // Update user profile to mark as premium (only the is_premium field exists in users table)
        const { error: userError } = await supabase
          .from("users")
          .update({
            is_premium: true,
          })
          .eq("id", transaction.user_id)

        if (userError) {
          console.error("[Verify Payment] Error updating user profile:", userError)
          throw userError
        }

        console.log("[Verify Payment] User profile marked as premium")

        // Create notification
        await supabase.from("notifications").insert({
          user_id: transaction.user_id,
          type: "premium_activated",
          title: "Premium Activated",
          message: `Your ${metadata.planName} premium subscription is now active! Enjoy all premium features.`,
          reference_id: metadata.subscriptionId,
          reference_type: "premium_subscription",
          action_url: `/dashboard/premium`,
        })

        console.log("[Verify Payment] Premium subscription activated successfully")
      }
    }

    console.log(
      `[Verify Payment] Payment verified - status: ${transactionStatus}, reference: ${reference}`
    )

    return {
      success: true,
      status: transactionStatus,
      reference,
      data: {
        status: transactionStatus,
        transactionId: transaction.id,
        subscriptionId: transaction.metadata?.subscriptionId,
        message:
          transactionStatus === "completed"
            ? "Payment successful and subscription activated"
            : "Payment failed. Please try again.",
      },
    }
  } catch (error) {
    console.error("[Verify Payment] Unexpected error:", error)
    const errorMsg = error instanceof Error ? error.message : "Internal server error"
    return {
      success: false,
      error: errorMsg,
      code: "UNKNOWN_ERROR",
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get("reference")

    if (!reference) {
      console.error("[GET /api/payments/verify] Reference required")
      return NextResponse.json({ error: "Reference required" }, { status: 400 })
    }

    const result = await handlePaymentVerification(reference)
    const statusCode = result.success ? 200 : 400

    return NextResponse.json(result, { status: statusCode })
  } catch (error) {
    console.error("[GET /api/payments/verify] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { reference } = await request.json()

    if (!reference) {
      console.error("[POST /api/payments/verify] Reference required")
      return NextResponse.json({ error: "Reference required" }, { status: 400 })
    }

    const result = await handlePaymentVerification(reference)
    const statusCode = result.success ? 200 : 400

    return NextResponse.json(result, { status: statusCode })
  } catch (error) {
    console.error("[POST /api/payments/verify] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 }
    )
  }
}
