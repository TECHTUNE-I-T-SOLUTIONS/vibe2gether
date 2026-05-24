import { NextResponse } from "next/server"
import { requireMobileUser } from "../../_lib/auth"

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireMobileUser(request)
    const { action } = await request.json()

    if (action === "mark-all-read") {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("is_read", false)

      if (error) throw error

      return NextResponse.json({ success: true, message: "All notifications marked as read" })
    }

    if (action === "clear-all") {
      const { error } = await supabase.from("notifications").delete().eq("user_id", user.id)
      if (error) throw error

      return NextResponse.json({ success: true, message: "All notifications cleared" })
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Mobile notifications action error:", error)
    return NextResponse.json({ success: false, error: "Failed to update notifications" }, { status: 500 })
  }
}
