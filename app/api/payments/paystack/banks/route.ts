import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
    if (!paystackSecretKey) {
      return NextResponse.json(
        { error: "Paystack secret key not configured" },
        { status: 500 }
      )
    }

    // Fetch list of banks from Paystack
    const response = await fetch("https://api.paystack.co/bank", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Failed to fetch banks" },
        { status: response.status }
      )
    }

    // Transform the data to be more useful
    const banks = data.data.map((bank: any) => ({
      id: bank.id,
      code: bank.code,
      name: bank.name,
    }))

    return NextResponse.json({
      success: true,
      banks: banks.sort((a: any, b: any) => a.name.localeCompare(b.name)),
    })
  } catch (error) {
    console.error("Banks fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
