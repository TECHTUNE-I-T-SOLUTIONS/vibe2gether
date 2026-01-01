import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

// GET all withdrawal requests (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: admin, error: adminError } = await supabase
      .from("admins")
      .select("id, role")
      .eq("email", session.user.email)
      .single()

    if (adminError || !admin || (admin.role !== "admin" && admin.role !== "moderator")) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "pending"

    // Fetch withdrawal requests
    let query = supabase
      .from("withdraw_requests")
      .select(`
        *,
        user:user_id (
          id,
          email,
          display_name,
          full_name,
          profile_picture,
          country,
          city
        )
      `)

    if (status) {
      query = query.eq("status", status)
    }

    const { data: withdrawRequests, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("[ADMIN] Failed to fetch withdraw requests:", error)
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
    console.error("[ADMIN] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH to approve/reject withdrawal request (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: admin, error: adminError } = await supabase
      .from("admins")
      .select("id, role")
      .eq("email", session.user.email)
      .single()

    if (adminError || !admin || admin.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { withdrawalRequestId, action, notes, rejectionReason } = body

    if (!withdrawalRequestId || !action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      )
    }

    // Get the withdrawal request
    const { data: withdrawRequest, error: fetchError } = await supabase
      .from("withdraw_requests")
      .select("*")
      .eq("id", withdrawalRequestId)
      .single()

    if (fetchError || !withdrawRequest) {
      return NextResponse.json(
        { error: "Withdrawal request not found" },
        { status: 404 }
      )
    }

    const updateData: any = {
      processed_by: admin.id,
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (action === "approve") {
      updateData.status = "approved"
      updateData.notes = notes || "Approved"
    } else {
      updateData.status = "rejected"
      updateData.rejection_reason = rejectionReason || "Request rejected"
    }

    const { error: updateError } = await supabase
      .from("withdraw_requests")
      .update(updateData)
      .eq("id", withdrawalRequestId)

    if (updateError) {
      console.error("[ADMIN] Failed to update withdrawal request:", updateError)
      return NextResponse.json(
        { error: "Failed to update withdrawal request" },
        { status: 500 }
      )
    }

    // If approved, deduct coins from user
    if (action === "approve") {
      const { error: deductError } = await supabase
        .from("users")
        .update({
          coins_balance: withdrawRequest.current_coin_balance - withdrawRequest.requested_coins,
          updated_at: new Date().toISOString(),
        })
        .eq("id", withdrawRequest.user_id)

      if (deductError) {
        console.error("[ADMIN] Failed to deduct coins:", deductError)
      } else {
        console.log(
          `[ADMIN] Deducted ${withdrawRequest.requested_coins} coins from user ${withdrawRequest.user_id}`
        )

        // Create coin transaction record
        await supabase.from("coin_transactions").insert({
          user_id: withdrawRequest.user_id,
          amount: withdrawRequest.requested_coins,
          transaction_type: "withdrawal",
          description: `Withdrew $${withdrawRequest.amount} USD (${withdrawRequest.requested_coins} coins)`,
          reference_id: withdrawalRequestId,
          reference_type: "withdraw_request",
          balance_after: withdrawRequest.current_coin_balance - withdrawRequest.requested_coins,
          created_at: new Date().toISOString(),
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Withdrawal request ${action}ed successfully`,
    })
  } catch (error) {
    console.error("[ADMIN] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
