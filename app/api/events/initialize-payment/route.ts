import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
const USD_TO_NGN_RATE = 1450

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

if (!PAYSTACK_SECRET_KEY) {
  console.warn("[PAYSTACK] Missing PAYSTACK_SECRET_KEY environment variable")
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, fullName, eventId, itemData } = body

    console.log("[PAYSTACK_EVENT] Initialize request received:", { email, fullName, eventId })

    // Validate required fields
    if (!email || !fullName || !eventId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json(
        { error: "Payment service not configured" },
        { status: 500 }
      )
    }

    // Get current session for user ID
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      )
    }

    // Determine the amount in NGN
    let amountInNGN = 0
    let amountInUSD = 0
    const currency = event.currency || "NGN"

    if (event.is_free || !event.ticket_price || event.ticket_price === 0) {
      // Free event - just register
      return NextResponse.json({
        success: true,
        isFree: true,
        message: "This is a free event. Proceed with registration.",
      })
    }

    // Calculate amount correctly
    if (currency === "NGN") {
      amountInNGN = Math.round(event.ticket_price)
      amountInUSD = event.ticket_price / USD_TO_NGN_RATE
    } else if (currency === "USD") {
      amountInUSD = event.ticket_price
      amountInNGN = Math.round(event.ticket_price * USD_TO_NGN_RATE)
    }

    // Convert to Kobo for Paystack
    const amountInKobo = amountInNGN * 100

    console.log("[PAYSTACK_EVENT] Payment details:", {
      currency,
      ticketPrice: event.ticket_price,
      amountInNGN,
      amountInUSD,
      amountInKobo,
    })

    // Initialize Paystack transaction
    const redirectUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/dashboard/events`

    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
      body: JSON.stringify({
        email,
        amount: amountInKobo,
        currency: "NGN",
        callback_url: redirectUrl,
        metadata: {
          fullName,
          eventId,
          eventTitle: event.title,
          currency,
          amountInNGN,
          amountInUSD,
          userId,
        },
        channels: ["card", "bank", "ussd", "qr", "mobile_money", "bank_transfer"],
      }),
    })

    if (!paystackResponse.ok) {
      const error = await paystackResponse.json()
      console.error("[PAYSTACK_EVENT] Initialization error:", error)
      return NextResponse.json(
        { error: error.message || "Failed to initialize payment" },
        { status: paystackResponse.status }
      )
    }

    const paystackData = await paystackResponse.json()

    if (!paystackData.status) {
      return NextResponse.json(
        { error: paystackData.message || "Payment initialization failed" },
        { status: 400 }
      )
    }

    const reference = paystackData.data.reference

    // Create transaction record
    if (userId) {
      try {
        await supabase.from("transactions").insert({
          user_id: userId,
          type: "event_registration",
          amount: Math.round(amountInNGN),
          currency: "NGN",
          payment_method: "paystack",
          payment_reference: reference,
          status: "pending",
          metadata: {
            fullName,
            eventId,
            eventTitle: event.title,
            currency,
            amountInNGN,
            amountInUSD,
          },
        })
        console.log("[PAYSTACK_EVENT] Transaction record created for reference:", reference)
      } catch (txError) {
        console.error("[PAYSTACK_EVENT] Failed to create transaction record:", txError)
      }
    }

    console.log("[PAYSTACK_EVENT] Transaction initialized:", {
      reference,
      email,
      amountInKobo,
      eventId,
    })

    return NextResponse.json({
      success: true,
      authorizationUrl: paystackData.data.authorization_url,
      accessCode: paystackData.data.access_code,
      reference,
      amountInNGN,
      amountInUSD,
    })
  } catch (error) {
    console.error("[PAYSTACK_EVENT] Initialization error:", error)
    const errorMsg = error instanceof Error ? error.message : "Failed to initialize payment"
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    )
  }
}
