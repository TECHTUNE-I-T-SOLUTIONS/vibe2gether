import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/client"
import { createClient as createServerClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get("reference")

    if (!reference) {
      return NextResponse.json(
        { error: "Payment reference is required" },
        { status: 400 }
      )
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
    if (!paystackSecretKey) {
      return NextResponse.json(
        { error: "Paystack secret key not configured" },
        { status: 500 }
      )
    }

    // Verify payment with Paystack
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Failed to verify payment" },
        { status: response.status }
      )
    }

    // Get transaction details from our database
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    )

    const { data: transaction } = await supabase
      .from("transactions")
      .select("*")
      .eq("payment_reference", reference)
      .single()

    return NextResponse.json({
      verified: data.data.status === "success",
      status: data.data.status,
      amount: data.data.amount / 100, // Convert from kobo to Naira
      reference: data.data.reference,
      transaction: transaction || null,
      message: data.message,
    })
  } catch (error) {
    console.error("Payment verification error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
