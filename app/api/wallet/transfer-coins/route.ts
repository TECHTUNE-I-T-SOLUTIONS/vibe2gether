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

    const { recipientId, coins, message } = await request.json()

    // Validate inputs
    if (!recipientId || !coins) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (typeof coins !== "number" || coins <= 0) {
      return NextResponse.json(
        { error: "Coins must be a positive number" },
        { status: 400 }
      )
    }

    if (coins < 1) {
      return NextResponse.json(
        { error: "Minimum transfer is 1 coin" },
        { status: 400 }
      )
    }

    const senderId = session.user.id

    // Prevent self-transfer
    if (senderId === recipientId) {
      return NextResponse.json(
        { error: "You cannot transfer coins to yourself" },
        { status: 400 }
      )
    }

    // Get sender's current balance
    const { data: senderData, error: senderError } = await supabase
      .from("users")
      .select("coins_balance")
      .eq("id", senderId)
      .single()

    if (senderError || !senderData) {
      return NextResponse.json(
        { error: "Failed to fetch sender balance" },
        { status: 500 }
      )
    }

    const senderBalance = senderData.coins_balance || 0

    // Check if sender has enough coins
    if (senderBalance < coins) {
      return NextResponse.json(
        { error: `Insufficient balance. You have ${senderBalance} coins.` },
        { status: 400 }
      )
    }

    // Verify recipient exists
    const { data: recipientData, error: recipientError } = await supabase
      .from("users")
      .select("id, display_name, coins_balance")
      .eq("id", recipientId)
      .single()

    if (recipientError || !recipientData) {
      return NextResponse.json(
        { error: "Recipient not found" },
        { status: 404 }
      )
    }

    const recipientBalance = recipientData.coins_balance || 0

    // Calculate new balances
    const newSenderBalance = senderBalance - coins
    const newRecipientBalance = recipientBalance + coins

    // Start transaction: Update sender balance
    const { error: updateSenderError } = await supabase
      .from("users")
      .update({ coins_balance: newSenderBalance })
      .eq("id", senderId)

    if (updateSenderError) {
      console.error("Error updating sender balance:", updateSenderError)
      return NextResponse.json(
        { error: "Failed to process transfer" },
        { status: 500 }
      )
    }

    // Update recipient balance
    const { error: updateRecipientError } = await supabase
      .from("users")
      .update({ coins_balance: newRecipientBalance })
      .eq("id", recipientId)

    if (updateRecipientError) {
      console.error("Error updating recipient balance:", updateRecipientError)
      // Rollback sender update
      await supabase
        .from("users")
        .update({ coins_balance: senderBalance })
        .eq("id", senderId)
      
      return NextResponse.json(
        { error: "Failed to process transfer" },
        { status: 500 }
      )
    }

    // Record sender transaction
    const { error: senderTransError } = await supabase
      .from("coin_transactions")
      .insert({
        user_id: senderId,
        amount: -coins,
        transaction_type: "transfer_sent",
        description: `Transferred ${coins} coins to ${recipientData.display_name}${message ? ` - ${message}` : ""}`,
        reference_id: recipientId,
        reference_type: "user_transfer",
        balance_after: newSenderBalance,
        created_at: new Date().toISOString(),
      })

    if (senderTransError) {
      console.error("Error recording sender transaction:", senderTransError)
      // Rollback both user updates
      await supabase
        .from("users")
        .update({ coins_balance: senderBalance })
        .eq("id", senderId)
      await supabase
        .from("users")
        .update({ coins_balance: recipientBalance })
        .eq("id", recipientId)
      
      return NextResponse.json(
        { error: "Failed to record transaction" },
        { status: 500 }
      )
    }

    // Record recipient transaction
    const { error: recipientTransError } = await supabase
      .from("coin_transactions")
      .insert({
        user_id: recipientId,
        amount: coins,
        transaction_type: "transfer_received",
        description: `Received ${coins} coins from ${session.user.name || session.user.email}${message ? ` - ${message}` : ""}`,
        reference_id: senderId,
        reference_type: "user_transfer",
        balance_after: newRecipientBalance,
        created_at: new Date().toISOString(),
      })

    if (recipientTransError) {
      console.error("Error recording recipient transaction:", recipientTransError)
      // Note: We can't fully rollback here since coins were already transferred
      // Log this as a critical issue
      console.error("[CRITICAL] Recipient transaction failed but transfer was completed")
    }

    // Get sender info for notification
    const { data: senderInfo } = await supabase
      .from("users")
      .select("display_name")
      .eq("id", senderId)
      .single()

    // Create notification for recipient
    await supabase.from("notifications").insert({
      user_id: recipientId,
      type: "coin_transfer",
      title: "Coins Received",
      message: `You received ${coins} coins from ${senderInfo?.display_name || "a user"}!${message ? ` Message: ${message}` : ""}`,
      actor_id: senderId,
      reference_id: recipientId,
      reference_type: "coin_transfer",
      is_read: false,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: "Transfer completed successfully",
      transfer: {
        id: `${senderId}-${recipientId}-${Date.now()}`,
        sender_id: senderId,
        recipient_id: recipientId,
        coins: coins,
        sender_new_balance: newSenderBalance,
        recipient_new_balance: newRecipientBalance,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Coin transfer error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
