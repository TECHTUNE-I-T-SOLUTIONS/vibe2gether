import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import jwt from "jsonwebtoken"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin auth using JWT token
    const token = request.cookies.get("admin_token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
      jwt.verify(token, JWT_SECRET)
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { status, notes, processed_by } = await request.json()

    if (!["approved", "rejected", "settled", "pending"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      )
    }

    const { id } = await params

    // Get the withdrawal request first to check current status and coins
    const { data: withdrawalData, error: fetchError } = await supabase
      .from("withdraw_requests")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError || !withdrawalData) {
      return NextResponse.json(
        { error: "Withdrawal request not found" },
        { status: 404 }
      )
    }

    // Prepare update object
    const updateData: any = {
      status,
      notes,
      updated_at: new Date().toISOString(),
    }

    if (processed_by) {
      updateData.processed_by = processed_by
      updateData.processed_at = new Date().toISOString()
    }

    // If status is "settled", deduct coins from user's wallet
    if (status === "settled") {
      const coinsToDeduct = withdrawalData.requested_coins

      // Get current user balance
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("coins_balance")
        .eq("id", withdrawalData.user_id)
        .single()

      if (userError || !userData) {
        return NextResponse.json(
          { error: "Failed to fetch user balance" },
          { status: 500 }
        )
      }

      const currentBalance = userData.coins_balance || 0
      const newBalance = currentBalance - coinsToDeduct

      // Deduct coins from user wallet
      const { error: updateUserError } = await supabase
        .from("users")
        .update({ coins_balance: newBalance })
        .eq("id", withdrawalData.user_id)

      if (updateUserError) {
        console.error("Error deducting coins:", updateUserError)
        return NextResponse.json(
          { error: "Failed to deduct coins from wallet" },
          { status: 500 }
        )
      }

      // Record coin transaction
      const { error: transactionError } = await supabase
        .from("coin_transactions")
        .insert({
          user_id: withdrawalData.user_id,
          amount: -coinsToDeduct,
          transaction_type: "withdrawal_settled",
          description: `Withdrawal settlement - $${withdrawalData.amount} USD`,
          reference_id: id,
          reference_type: "withdrawal_request",
          balance_after: newBalance,
          created_at: new Date().toISOString(),
        })

      if (transactionError) {
        console.error("Error recording transaction:", transactionError)
        return NextResponse.json(
          { error: "Failed to record transaction" },
          { status: 500 }
        )
      }
    }

    // Update withdrawal request
    const { data, error } = await supabase
      .from("withdraw_requests")
      .update(updateData)
      .eq("id", id)
      .select("*, user:user_id(id, display_name, email)")
      .single()

    if (error) {
      console.error("Failed to update withdrawal request:", error)
      return NextResponse.json(
        { error: "Failed to update withdrawal request" },
        { status: 500 }
      )
    }

    // Create notification for user
    if (data?.user_id) {
      let notificationTitle = ""
      let notificationMessage = ""

      switch (status) {
        case "approved":
          notificationTitle = "Withdrawal Approved"
          notificationMessage = `Your withdrawal request of $${data.amount} has been approved and will be processed soon.`
          break
        case "rejected":
          notificationTitle = "Withdrawal Rejected"
          notificationMessage = `Your withdrawal request of $${data.amount} has been rejected.${notes ? ` Reason: ${notes}` : ""}`
          break
        case "settled":
          notificationTitle = "Withdrawal Completed"
          notificationMessage = `Your withdrawal of $${data.amount} has been processed and sent to your bank account. ${data.requested_coins} coins have been deducted from your wallet.`
          break
      }

      if (notificationTitle) {
        await supabase.from("notifications").insert({
          user_id: data.user_id,
          type: "withdrawal",
          title: notificationTitle,
          message: notificationMessage,
          read: false,
          created_at: new Date().toISOString(),
        })
      }
    }

    return NextResponse.json({
      success: true,
      withdrawal: data,
    })
  } catch (error) {
    console.error("Admin withdrawal update error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
