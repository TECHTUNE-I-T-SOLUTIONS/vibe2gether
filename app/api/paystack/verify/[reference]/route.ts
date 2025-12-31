import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

export async function GET(
  request: NextRequest,
  { params }: { params: { reference: string } }
) {
  try {
    const reference = params.reference

    if (!reference) {
      return NextResponse.json(
        { error: "Payment reference is required" },
        { status: 400 }
      )
    }

    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json(
        { error: "Payment service not configured" },
        { status: 500 }
      )
    }

    // Get current session
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Verify payment with Paystack
    const verificationResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    )

    if (!verificationResponse.ok) {
      const error = await verificationResponse.json()
      console.error("[PAYSTACK] Verification error:", error)
      return NextResponse.json(
        { error: error.message || "Payment verification failed" },
        { status: verificationResponse.status }
      )
    }

    const verificationData = await verificationResponse.json()

    if (!verificationData.status || !verificationData.data) {
      return NextResponse.json(
        { error: "Invalid payment response" },
        { status: 400 }
      )
    }

    const payment = verificationData.data

    // Check if payment was successful
    if (payment.status !== "success") {
      return NextResponse.json(
        {
          success: false,
          status: payment.status,
          message: `Payment ${payment.status}`,
        },
        { status: 400 }
      )
    }

    // Extract metadata
    const metadata = payment.metadata || {}
    const itemType = metadata.itemType
    const itemId = metadata.itemId
    const itemTitle = metadata.itemTitle

    console.log("[PAYSTACK] Payment successful:", {
      reference,
      email: payment.customer?.email,
      amount: payment.amount,
      itemType,
      itemId,
    })

    // Store payment record
    const supabase = await createClient()

    const { error: insertError } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        amount: payment.amount, // Keep in Kobo for consistency
        currency: payment.currency,
        type: itemType,
        status: "completed",
        payment_method: payment.channel,
        payment_reference: reference,
        metadata: {
          ...metadata,
          authorization: payment.authorization,
          customer_email: payment.customer?.email,
          customer_code: payment.customer?.customer_code,
        },
      })

    if (insertError) {
      console.error("[PAYSTACK] Error storing payment:", insertError)
      // Continue - payment was successful even if we couldn't store it
    }

    // If item is a product or event, mark it as paid
    if (itemId && itemType) {
      if (itemType === "product") {
        await supabase
          .from("marketplace_products")
          .update({ payment_status: "completed", payment_reference: reference })
          .eq("id", itemId)
          .eq("seller_id", userId)
      } else if (itemType === "event") {
        await supabase
          .from("events")
          .update({ payment_status: "completed", payment_reference: reference })
          .eq("id", itemId)
          .eq("creator_id", userId)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      payment: {
        reference,
        amount: payment.amount / 100,
        currency: payment.currency,
        status: payment.status,
        itemType,
        itemId,
        itemTitle,
      },
    })
  } catch (error) {
    console.error("[PAYSTACK] Verification error:", error)
    const errorMsg = error instanceof Error ? error.message : "Failed to verify payment"
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    )
  }
}
