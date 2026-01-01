import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is admin
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: adminUser } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (adminUser?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { status, notes } = await request.json()

    if (!["approved", "rejected", "settled", "pending"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      )
    }

    // Update withdrawal request
    const { data, error } = await supabase
      .from("withdraw_requests")
      .update({
        status,
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
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
          notificationMessage = `Your withdrawal of $${data.amount} has been processed and sent to your bank account.`
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
