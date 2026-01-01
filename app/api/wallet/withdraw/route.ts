import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { amount, bankName, accountNumber, accountName } = await request.json()

    // Validate inputs
    if (!amount || !bankName || !accountNumber || !accountName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (amount < 15) {
      return NextResponse.json(
        { error: "Minimum withdrawal is $15" },
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
        { error: "Failed to fetch user balance" },
        { status: 500 }
      )
    }

    const coinsToDeduct = Math.round(amount * 1450)
    const currentBalance = userData.coins_balance || 0

    // Check eligibility
    if (currentBalance < coinsToDeduct) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      )
    }

    // Create withdrawal request
    const { data: withdrawalRequest, error: createError } = await supabase
      .from("withdrawal_requests")
      .insert({
        user_id: session.user.id,
        amount_usd: amount,
        amount_ngn: amount * 1450,
        amount_coins: coinsToDeduct,
        bank_name: bankName,
        account_number: accountNumber,
        account_name: accountName,
        status: "pending",
        requested_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (createError) {
      console.error("Error creating withdrawal request:", createError)
      return NextResponse.json(
        { error: "Failed to create withdrawal request" },
        { status: 500 }
      )
    }

    // Deduct coins from user balance
    const { error: updateError } = await supabase
      .from("users")
      .update({
        coins_balance: currentBalance - coinsToDeduct,
      })
      .eq("id", session.user.id)

    if (updateError) {
      console.error("Error updating user balance:", updateError)
      // Rollback the withdrawal request if balance update fails
      await supabase
        .from("withdrawal_requests")
        .delete()
        .eq("id", withdrawalRequest.id)
      
      return NextResponse.json(
        { error: "Failed to process withdrawal" },
        { status: 500 }
      )
    }

    // Create a transaction record
    await supabase.from("transactions").insert({
      user_id: session.user.id,
      type: "withdrawal",
      description: `Withdrawal request to ${bankName} - ${accountName}`,
      amount: -coinsToDeduct,
      balance_after: currentBalance - coinsToDeduct,
      reference_id: withdrawalRequest.id,
      metadata: {
        amount_usd: amount,
        amount_ngn: amount * 1450,
        bank_name: bankName,
      },
    })

    // Create notification
    await supabase.from("notifications").insert({
      user_id: session.user.id,
      title: "Withdrawal Request Submitted",
      message: `Your withdrawal request for $${amount} has been submitted and is pending review.`,
      type: "wallet",
      metadata: {
        withdrawal_id: withdrawalRequest.id,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: "Withdrawal request submitted successfully",
        withdrawalRequest: {
          id: withdrawalRequest.id,
          amount: amount,
          status: "pending",
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Withdrawal error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
