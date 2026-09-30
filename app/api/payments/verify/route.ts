import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { verifyPayment } from "@/lib/paystack"
import { verifyFlutterwavePayment } from "@/lib/flutterwave"
import { getMobileMoneyFailureMessage } from "@/lib/mobile-money"

export async function handlePaymentVerification(reference: string) {
  try {
    console.log(`[Verify Payment] Processing verification for reference: ${reference}`)

    const supabase = createServiceRoleClient()

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
      const providerStatus = String(paymentData?.status || verification.message || "").toLowerCase()
      const isPending =
        provider === "flutterwave" &&
        [
          "pending",
          "processing",
          "requires_action",
          "requires_confirmation",
          "requires_payment_method",
          "action_required",
          "authorization_required",
          "initiated",
          "created",
          "queued",
        ].includes(providerStatus)
      console.error("[Verify Payment] Payment verification failed from provider:", provider, {
        providerStatus,
        verificationStatus: verification.status,
        providerMessage: verification.message,
        paymentData,
      })
      const failureMessage =
        provider === "flutterwave"
          ? getMobileMoneyFailureMessage(paymentData?.processor_response, "Payment verification failed")
          : "Payment verification failed"
      if (!isPending) {
        await supabase
          .from("transactions")
          .update({
            status: "failed",
            metadata: {
              ...transaction.metadata,
              provider_status: providerStatus,
              processor_response: paymentData?.processor_response || null,
              failed_at: new Date().toISOString(),
            },
          })
          .eq("id", transaction.id)

        if (transaction.metadata?.registration_id) {
          await supabase
            .from("event_registrations")
            .update({ payment_status: "failed", status: "cancelled" })
            .eq("id", transaction.metadata.registration_id)
        }

        if (transaction.metadata?.isTicketPurchase) {
          await supabase
            .from("event_tickets")
            .update({ status: "cancelled" })
            .eq("payment_reference", reference)
        }
      }
      return {
        success: false,
        status: isPending ? "pending" : "failed",
        error: isPending ? "Payment is still awaiting mobile money approval" : failureMessage,
        code: isPending ? "PAYMENT_PENDING" : "PAYMENT_FAILED",
        providerStatus,
        processorResponse: paymentData?.processor_response,
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
        const eventAmountPaid = provider === "flutterwave" ? Number(paymentData.amount || transaction.amount || 0) : Number(paymentData.amount || 0) / 100
        const eventCurrency = provider === "flutterwave" ? paymentData.currency || transaction.currency || "XAF" : "NGN"
        let resolvedEventId = metadata.eventId
        let registrationId = metadata.registration_id

        // Get user details for attendee info
        const { data: userData } = await supabase
          .from("users")
          .select("email, full_name, display_name")
          .eq("id", transaction.user_id)
          .single()

        // Use barcode from metadata, or from registration, or generate new one
        let barcode = metadata.barcode
        if (!barcode && registrationId) {
          const { data: existingReg } = await supabase
            .from("event_registrations")
            .select("barcode")
            .eq("id", registrationId)
            .single()
          barcode = existingReg?.barcode
        }
        if (!barcode) {
          barcode = `V2G-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
        }

        if (metadata.registration_id) {
          const { data: updatedReg } = await supabase
            .from("event_registrations")
            .update({
              status: "confirmed",
              payment_status: "completed",
              payment_reference: reference,
              transaction_id: transaction.id,
              paid_at: new Date().toISOString(),
              amount_paid: eventAmountPaid,
              currency: eventCurrency,
              payment_method: provider,
              barcode: barcode,
              attendee_name: userData?.full_name || userData?.display_name || "Unknown",
              attendee_email: userData?.email || "",
            })
            .eq("id", metadata.registration_id)
            .select()
            .single()

          if (updatedReg && !updatedReg.barcode) {
            // If update didn't include barcode, try to update it separately
            await supabase
              .from("event_registrations")
              .update({ barcode: barcode })
              .eq("id", metadata.registration_id)
          }
        } else if (transaction.user_id && metadata.eventId) {
          const { data: newReg } = await supabase
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
                amount_paid: eventAmountPaid,
                currency: eventCurrency,
                payment_method: provider,
                barcode: barcode,
                attendee_name: userData?.full_name || userData?.display_name || "Unknown",
                attendee_email: userData?.email || "",
              },
              { onConflict: "event_id,user_id" }
            )
            .select()
            .single()

          if (newReg) {
            registrationId = newReg.id
          }
        } else if (transaction.user_id) {
          const { data: ticketByRef } = await supabase
            .from("event_tickets")
            .select("event_id")
            .eq("payment_reference", reference)
            .single()

          if (ticketByRef?.event_id) {
            resolvedEventId = ticketByRef.event_id
            const { data: newReg } = await supabase
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
                  amount_paid: eventAmountPaid,
                  currency: eventCurrency,
                  payment_method: provider,
                  barcode: barcode,
                  attendee_name: userData?.full_name || userData?.display_name || "Unknown",
                  attendee_email: userData?.email || "",
                },
                { onConflict: "event_id,user_id" }
              )
              .select()
              .single()

            if (newReg) {
              registrationId = newReg.id
            }
          }
        }

        // Generate and send ticket email for event_registration
        if (resolvedEventId && transaction.user_id) {
          // If we don't have a registrationId, try to find the registration
          if (!registrationId) {
            const { data: foundReg } = await supabase
              .from("event_registrations")
              .select("id")
              .eq("event_id", resolvedEventId)
              .eq("user_id", transaction.user_id)
              .single()

            if (foundReg) {
              registrationId = foundReg.id
              console.log("[Verify Payment] Found registration for ticket generation:", registrationId)
            }
          }

          if (registrationId) {
            try {
              await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/generate-ticket`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  registrationId: registrationId,
                  eventId: resolvedEventId,
                  userId: transaction.user_id
                })
              })
              console.log("[Verify Payment] Ticket email sent for registration:", registrationId)
            } catch (ticketEmailError) {
              console.error("[Verify Payment] Ticket email failed after payment confirmation:", ticketEmailError)
            }
          } else {
            console.error("[Verify Payment] Could not find registration for ticket generation:", {
              resolvedEventId,
              userId: transaction.user_id
            })
          }
        }

        if (metadata.isTicketPurchase) {
          const { data: ticket } = await supabase
            .from("event_tickets")
            .select("*")
            .eq("payment_reference", reference)
            .single()

          if (ticket && ticket.status !== "paid") {
            resolvedEventId = ticket.event_id || resolvedEventId
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

                try {
                  // Use new generate-ticket endpoint to avoid jsPDF issues
                  await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/generate-ticket`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      registrationId: updatedTicket.registration_id,
                      eventId: event.id,
                      userId: updatedTicket.user_id
                    })
                  })
                } catch (ticketEmailError) {
                  console.error("[Verify Payment] Ticket email failed after payment confirmation:", ticketEmailError)
                }
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
          reference_id: resolvedEventId,
          reference_type: "event",
          action_url: resolvedEventId ? `/events/${resolvedEventId}` : "/dashboard/events/manage",
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
    const statusCode = result.success ? 200 : result.status === "pending" ? 202 : 400

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
    const statusCode = result.success ? 200 : result.status === "pending" ? 202 : 400

    return NextResponse.json(result, { status: statusCode })
  } catch (error) {
    console.error("[POST /api/payments/verify] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 }
    )
  }
}
