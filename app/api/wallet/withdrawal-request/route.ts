import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { amount, bankCode, bankName, accountNumber, accountName, requestedCoins } = body

    // Validation
    if (!amount || !bankCode || !bankName || !accountNumber || !accountName || !requestedCoins) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const usdAmount = parseFloat(amount)
    const minWithdrawal = 0.71 // $0.71 minimum

    if (usdAmount < minWithdrawal) {
      return NextResponse.json(
        { error: `Minimum withdrawal is $${minWithdrawal}` },
        { status: 400 }
      )
    }

    // Get user's current balance
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("coins_balance")
      .eq("id", session.user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: "Failed to fetch user data" },
        { status: 500 }
      )
    }

    const currentBalance = userData.coins_balance

    // Check if user has enough balance
    if (requestedCoins > currentBalance) {
      return NextResponse.json(
        { error: "Insufficient balance for withdrawal" },
        { status: 400 }
      )
    }

    // Convert to Naira
    const amountInNaira = usdAmount * 1450

    // Create withdrawal request
    const { data: withdrawalRequest, error: withdrawalError } = await supabase
      .from("withdraw_requests")
      .insert({
        user_id: session.user.id,
        amount: usdAmount,
        currency: "USD",
        amount_in_naira: amountInNaira,
        requested_coins: requestedCoins,
        bank_code: bankCode,
        bank_name: bankName,
        account_number: accountNumber,
        account_name: accountName,
        account_type: "individual",
        status: "pending",
        current_coin_balance: currentBalance,
        user_coin_balance_at_request: currentBalance,
      })
      .select()
      .single()

    if (withdrawalError) {
      console.error("Withdrawal request error:", withdrawalError)
      return NextResponse.json(
        { error: "Failed to create withdrawal request" },
        { status: 500 }
      )
    }

    // Create notification for user
    await supabase.from("notifications").insert({
      user_id: session.user.id,
      type: "withdrawal",
      title: "Withdrawal Request Submitted",
      message: `Your withdrawal request of $${usdAmount} (₦${amountInNaira.toLocaleString()}) has been submitted. Our team will review it shortly.`,
      action_url: "/dashboard/wallet",
    })

    return NextResponse.json({
      success: true,
      withdrawalRequest,
      message: "Withdrawal request submitted successfully",
    })
  } catch (error) {
    console.error("Withdrawal request error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
