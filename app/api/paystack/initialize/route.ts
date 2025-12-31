import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY

if (!PAYSTACK_SECRET_KEY) {
  console.warn("[PAYSTACK] Missing PAYSTACK_SECRET_KEY environment variable")
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, fullName, amount, currency, itemType, itemData, metadata } = body

    // Validate required fields
    if (!email || !fullName || !amount || !itemType) {
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

    // Convert to Kobo if currency is NGN
    let amountInKobo = amount
    if (currency === "NGN") {
      amountInKobo = Math.round(amount * 100)
    } else if (currency === "USD") {
      // Convert USD to NGN (~1670 NGN per USD)
      const amountInNGN = amount * 1670
      amountInKobo = Math.round(amountInNGN * 100)
    }

    // Initialize Paystack transaction
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
        metadata: {
          fullName,
          itemType,
          itemId: itemData?.id,
          itemTitle: itemData?.title,
          userId,
          ...metadata,
        },
        channels: ["card", "bank", "ussd", "qr", "mobile_money", "bank_transfer"],
      }),
    })

    if (!paystackResponse.ok) {
      const error = await paystackResponse.json()
      console.error("[PAYSTACK] Initialization error:", error)
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

    console.log("[PAYSTACK] Transaction initialized:", {
      reference: paystackData.data.reference,
      email,
      amount: amountInKobo,
      itemType,
    })

    return NextResponse.json({
      success: true,
      authorizationUrl: paystackData.data.authorization_url,
      accessCode: paystackData.data.access_code,
      reference: paystackData.data.reference,
    })
  } catch (error) {
    console.error("[PAYSTACK] Initialization error:", error)
    const errorMsg = error instanceof Error ? error.message : "Failed to initialize payment"
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    )
  }
}
