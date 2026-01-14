import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import jwt from "jsonwebtoken"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

/**
 * PATCH /api/posts/report/[id]
 * Update report status, notes, and action taken
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin auth
    const token = request.cookies.get("admin_token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
      jwt.verify(token, JWT_SECRET)
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { status, action_taken, admin_notes, handled_at } = await request.json()
    const { id: reportId } = await params

    if (!reportId) {
      return NextResponse.json({ error: "Report ID is required" }, { status: 400 })
    }

    // Get admin user ID from token
    const decoded = jwt.verify(token, JWT_SECRET) as any
    const adminUserId = decoded.userId

    // Update the report
    const { data: report, error: updateError } = await supabase
      .from("post_reports")
      .update({
        status: status || undefined,
        action_taken: action_taken || undefined,
        admin_notes: admin_notes || undefined,
        handled_at: handled_at || undefined,
        handled_by: adminUserId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reportId)
      .select()
      .single()

    if (updateError) {
      console.error("[PATCH /api/posts/report] Error updating report:", updateError)
      throw updateError
    }

    // If resolving, create notification for post author
    if (status === "resolved" && report.posts) {
      const notificationMessage = action_taken === "no_action"
        ? "Your post report was reviewed and no action was taken."
        : `Your post report was reviewed. Action taken: ${action_taken.replace(/_/g, " ")}`

      await supabase
        .from("notifications")
        .insert({
          user_id: report.posts.user_id,
          type: "report_resolved",
          title: "Report Resolved",
          message: notificationMessage,
          data: {
            post_id: report.post_id,
            report_id: reportId,
          },
          is_read: false,
        })
    }

    return NextResponse.json({
      success: true,
      message: "Report updated successfully",
      report,
    })
  } catch (error) {
    console.error("[PATCH /api/posts/report] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
