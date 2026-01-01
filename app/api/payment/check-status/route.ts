import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

// Check if user has paid for a marketplace product
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()
    const { productId, checkType } = body // checkType: "product" | "message" | "event"

    if (!productId || !checkType) {
      return NextResponse.json(
        { error: "Product ID and check type are required" },
        { status: 400 }
      )
    }

    if (checkType === "product") {
      // Check if user has purchased this product
      const { data: purchase, error } = await supabase
        .from("marketplace_purchases")
        .select("id, status")
        .eq("product_id", productId)
        .eq("buyer_id", userId)
        .eq("status", "completed")
        .single()

      if (error && error.code !== "PGRST116") {
        console.error("[PAYMENT_CHECK] Error checking product purchase:", error)
        return NextResponse.json(
          { error: "Failed to check payment status" },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        hasPaid: !!purchase,
        purchaseId: purchase?.id,
      })
    } else if (checkType === "message") {
      // Check if user has paid to message seller
      const { data: messagePayment, error } = await supabase
        .from("marketplace_message_payments")
        .select("id, status, message_unlocked_at")
        .eq("product_id", productId)
        .eq("buyer_id", userId)
        .eq("status", "completed")
        .single()

      if (error && error.code !== "PGRST116") {
        console.error("[PAYMENT_CHECK] Error checking message payment:", error)
        return NextResponse.json(
          { error: "Failed to check payment status" },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        hasPaid: !!messagePayment,
        messagePaymentId: messagePayment?.id,
        unlockedAt: messagePayment?.message_unlocked_at,
      })
    } else if (checkType === "event") {
      // Check if user has registered/paid for this event
      const { data: registration, error } = await supabase
        .from("event_registrations")
        .select("id, payment_status, status")
        .eq("event_id", productId) // Using productId as eventId
        .eq("user_id", userId)
        .single()

      if (error && error.code !== "PGRST116") {
        console.error("[PAYMENT_CHECK] Error checking event registration:", error)
        return NextResponse.json(
          { error: "Failed to check registration status" },
          { status: 500 }
        )
      }

      const isPaid = registration?.payment_status === "completed" || registration?.payment_status === "free"

      return NextResponse.json({
        success: true,
        hasRegistered: !!registration,
        isPaid,
        registrationId: registration?.id,
        paymentStatus: registration?.payment_status,
      })
    }

    return NextResponse.json(
      { error: "Invalid check type" },
      { status: 400 }
    )
  } catch (error) {
    console.error("[PAYMENT_CHECK] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
