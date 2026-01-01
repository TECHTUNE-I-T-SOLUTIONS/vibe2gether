import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

const MINIMUM_WITHDRAWAL_USD = 15
const USD_TO_NGN_RATE = 1450

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()
    const { 
      amount, 
      currency, 
      bankCode, 
      bankName,
      accountNumber, 
      accountName, 
      accountType 
    } = body

    // Validate required fields
    if (!amount || !currency || !bankCode || !bankName || !accountNumber || !accountName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate amount
    const amountInUSD = currency === "USD" ? amount : amount / USD_TO_NGN_RATE
    
    if (amountInUSD < MINIMUM_WITHDRAWAL_USD) {
      return NextResponse.json(
        { 
          error: `Minimum withdrawal amount is $${MINIMUM_WITHDRAWAL_USD}`,
          minimumAmount: MINIMUM_WITHDRAWAL_USD 
        },
        { status: 400 }
      )
    }

    // Get user's current coin balance
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("coins_balance")
      .eq("id", userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const coinsToWithdraw = Math.round(amountInUSD * 500)

    // Check if user has enough coins
    if (user.coins_balance < coinsToWithdraw) {
      return NextResponse.json(
        { 
          error: "Insufficient coins for withdrawal",
          currentBalance: user.coins_balance,
          requiredCoins: coinsToWithdraw 
        },
        { status: 400 }
      )
    }

    // Calculate amount in Naira
    const amountInNaira = currency === "NGN" ? amount : amount * USD_TO_NGN_RATE

    // Create withdraw request
    const { data: withdrawRequest, error: createError } = await supabase
      .from("withdraw_requests")
      .insert({
        user_id: userId,
        amount: amountInUSD,
        currency: "USD",
        amount_in_naira: amountInNaira,
        requested_coins: coinsToWithdraw,
        bank_code: bankCode,
        bank_name: bankName,
        account_number: accountNumber,
        account_name: accountName,
        account_type: accountType || "individual",
        status: "pending",
        current_coin_balance: user.coins_balance,
        user_coin_balance_at_request: user.coins_balance,
      })
      .select()
      .single()

    if (createError) {
      console.error("[WITHDRAW] Failed to create withdraw request:", createError)
      return NextResponse.json(
        { error: "Failed to create withdrawal request" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Withdrawal request submitted successfully",
      withdrawalRequest: {
        id: withdrawRequest.id,
        amount: withdrawRequest.amount,
        currency: withdrawRequest.currency,
        status: withdrawRequest.status,
        requestedCoins: withdrawRequest.requested_coins,
      },
    })
  } catch (error) {
    console.error("[WITHDRAW] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch user's withdrawal requests
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    const { data: withdrawRequests, error } = await supabase
      .from("withdraw_requests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[WITHDRAW] Failed to fetch requests:", error)
      return NextResponse.json(
        { error: "Failed to fetch withdrawal requests" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      withdrawRequests,
    })
  } catch (error) {
    console.error("[WITHDRAW] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
