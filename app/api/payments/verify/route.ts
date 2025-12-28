import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { verifyPayment } from "@/lib/paystack"

async function handlePaymentVerification(reference: string) {
  try {
    console.log(`[Verify Payment] Processing verification for reference: ${reference}`)

    // Verify payment with Paystack
    const paystackResponse = await verifyPayment(reference)

    if (!paystackResponse.status) {
      console.error("[Verify Payment] Payment verification failed from Paystack")
      return {
        success: false,
        status: "failed",
        error: "Payment verification failed",
        code: "PAYSTACK_FAILED",
      }
    }

    const paymentData = paystackResponse.data
    if (!paymentData) {
      throw new Error("No payment data returned from Paystack")
    }

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

    // Update transaction status based on payment status
    const transactionStatus = paymentData.status === "success" ? "completed" : "failed"

    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        status: transactionStatus,
        metadata: {
          ...transaction.metadata,
          paystack_payment_id: paymentData.id,
          paid_at: paymentData.paid_at,
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
      } else if (metadata.type === "event_registration" || transaction.type === "event_registration") {
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
