import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { amount, currency, itemType, itemData, receiptUrl, metadata } = await request.json()

    if (!amount || !receiptUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    // Create a pending transaction
    const { data, error } = await supabase
      .from("transactions")
      .insert({
        user_id: session.user.id,
        amount: amount * 100, // stored in kobo/cents equivalent
        currency: currency || "NGN",
        type: itemType === "event_registration" ? "event_registration" : "manual_payment",
        status: "pending",
        payment_method: "mobile_money_manual",
        metadata: {
          ...metadata,
          receiptUrl,
        }
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      throw error
    }

    // For event registration, we also need to create a pending event_registration record if it's an event
    if (itemType === "event_registration" && metadata?.eventId) {
      // Get user details for registration
      const { data: userData } = await supabase
        .from("users")
        .select("email, full_name, display_name")
        .eq("id", session.user.id)
        .single()

      // Generate barcode
      const barcode = `V2G-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

      const { data: registration, error: regError } = await supabase
        .from("event_registrations")
        .insert({
          event_id: metadata.eventId,
          user_id: session.user.id,
          status: "pending",
          payment_status: "pending",
          payment_reference: data.id,
          amount_paid: amount,
          currency: currency || "NGN",
          payment_method: "mobile_money_manual",
          attendee_name: userData?.full_name || userData?.display_name || "Unknown",
          attendee_email: userData?.email || "",
          barcode: barcode
        })
        .select()
        .single()
      
      if (regError) {
        console.error("Registration error:", regError)
        // non-fatal
      } else if (registration) {
        // Update transaction metadata with registration ID
        await supabase
          .from("transactions")
          .update({
            metadata: {
              ...metadata,
              receiptUrl,
              registration_id: registration.id
            }
          })
          .eq("id", data.id)
      }
    }

    return NextResponse.json({ success: true, transactionId: data.id })
  } catch (error) {
    console.error("[POST /api/payments/manual] Error:", error)
    return NextResponse.json({ error: "Failed to submit manual payment" }, { status: 500 })
  }
}
