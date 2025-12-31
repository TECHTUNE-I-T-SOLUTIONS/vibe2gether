import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { createClient } from "@/lib/supabase/server"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature
    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET_KEY || "")
      .update(JSON.stringify(await request.json()))
      .digest("hex")

    if (hash !== request.headers.get("x-paystack-signature")) {
      console.warn("[PAYSTACK WEBHOOK] Invalid signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    const body = await request.json()
    const event = body.event
    const data = body.data

    console.log("[PAYSTACK WEBHOOK] Event received:", {
      event,
      reference: data?.reference,
      amount: data?.amount,
    })

    // Handle only successful charge events
    if (event === "charge.success") {
      const reference = data.reference
      const metadata = data.metadata || {}
      const itemType = metadata.itemType
      const itemId = metadata.itemId
      const userId = metadata.userId

      // Store payment record
      const supabase = await createClient()

      const { error: insertError } = await supabase
        .from("transactions")
        .insert({
          user_id: userId,
          amount: data.amount, // Keep in Kobo
          currency: data.currency,
          type: itemType,
          status: "completed",
          payment_method: data.channel,
          payment_reference: reference,
          metadata: {
            ...metadata,
            authorization: data.authorization,
            customer_email: data.customer?.email,
            customer_code: data.customer?.customer_code,
          },
        })

      if (insertError) {
        console.error("[PAYSTACK WEBHOOK] Error storing payment:", insertError)
      }

      // Update item payment status
      if (itemId && itemType) {
        if (itemType === "product") {
          const { error: updateError } = await supabase
            .from("marketplace_products")
            .update({ 
              payment_status: "completed",
              payment_reference: reference,
            })
            .eq("id", itemId)

          if (updateError) {
            console.error("[PAYSTACK WEBHOOK] Error updating product:", updateError)
          }
        } else if (itemType === "event") {
          const { error: updateError } = await supabase
            .from("events")
            .update({
              payment_status: "completed",
              payment_reference: reference,
            })
            .eq("id", itemId)

          if (updateError) {
            console.error("[PAYSTACK WEBHOOK] Error updating event:", updateError)
          }
        }
      }

      // Create notification for user
      if (userId) {
        try {
          await supabase
            .from("notifications")
            .insert({
              user_id: userId,
              type: "payment_success",
              title: "Payment Successful",
              message: `Your ${itemType} has been created successfully after payment of ₦${(data.amount / 100).toLocaleString()}`,
              reference_id: itemId,
              reference_type: itemType,
              is_read: false,
            })
        } catch (notificationError) {
          console.error("[PAYSTACK WEBHOOK] Error creating notification:", notificationError)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[PAYSTACK WEBHOOK] Error:", error)
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    )
  }
}
