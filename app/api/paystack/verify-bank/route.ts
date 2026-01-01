import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bankCode, accountNumber } = body

    if (!bankCode || !accountNumber) {
      return NextResponse.json(
        { error: "Bank code and account number are required" },
        { status: 400 }
      )
    }

    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json(
        { error: "Payment service not configured" },
        { status: 500 }
      )
    }

    // Verify account with Paystack
    const response = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    )

    if (!response.ok) {
      const error = await response.json()
      console.error("[PAYSTACK] Account verification failed:", error)
      return NextResponse.json(
        { 
          error: error.message || "Failed to verify account",
          success: false 
        },
        { status: response.status }
      )
    }

    const data = await response.json()

    if (!data.status) {
      return NextResponse.json(
        { 
          error: data.message || "Account verification failed",
          success: false 
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      accountName: data.data.account_name,
      accountNumber: data.data.account_number,
      bankCode: bankCode,
    })
  } catch (error) {
    console.error("[PAYSTACK] Bank verification error:", error)
    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 }
    )
  }
}
