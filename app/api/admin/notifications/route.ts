import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

/**
 * GET /api/admin/notifications
 * Fetch admin notifications
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin auth
    const token = request.cookies.get("admin_token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let adminId = ""
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      adminId = decoded.sub || decoded.id
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Get query parameters
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get("limit") || "20")
    const page = parseInt(url.searchParams.get("page") || "1")

    // Fetch notifications
    const { data: notifications, error, count } = await supabase
      .from("admin_notifications")
      .select("*", { count: "exact" })
      .eq("admin_id", adminId)
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (error) {
      console.error("Notifications query error:", error)
      return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 400 })
    }

    const unreadCount = (notifications || []).filter((n: any) => !n.is_read).length

    return NextResponse.json({
      notifications: notifications || [],
      count: count || 0,
      unreadCount,
      pagination: {
        total: count || 0,
        page,
        limit,
        pages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * PUT /api/admin/notifications/:id
 * Mark notification as read
 */
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get("admin_token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
      jwt.verify(token, JWT_SECRET)
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const { is_read } = body

    // Extract ID from URL path
    const pathMatch = request.nextUrl.pathname.match(/\/api\/admin\/notifications\/(.+)/)
    const id = pathMatch?.[1]

    if (!id) {
      return NextResponse.json({ error: "Missing notification ID" }, { status: 400 })
    }

    const updateData: any = { is_read }
    if (is_read) {
      updateData.read_at = new Date().toISOString()
    }

    const { error } = await supabase.from("admin_notifications").update(updateData).eq("id", id)

    if (error) {
      return NextResponse.json({ error: `Update failed: ${error.message}` }, { status: 400 })
    }

    return NextResponse.json({ message: "Notification updated" })
  } catch (error) {
    console.error("Error updating notification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * POST /api/admin/notifications
 * Create a new notification
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("admin_token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let adminId = ""
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      adminId = decoded.sub || decoded.id
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const { type, title, message, related_type, related_id, action_url } = body

    if (!type || !title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { error } = await supabase.from("admin_notifications").insert([
      {
        admin_id: adminId,
        type,
        title,
        message: message || null,
        related_type: related_type || null,
        related_id: related_id || null,
        action_url: action_url || null,
        is_read: false,
      },
    ])

    if (error) {
      return NextResponse.json({ error: `Creation failed: ${error.message}` }, { status: 400 })
    }

    return NextResponse.json({ message: "Notification created" }, { status: 201 })
  } catch (error) {
    console.error("Error creating notification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/notifications/:id
 * Delete a notification
 */
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get("admin_token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
      jwt.verify(token, JWT_SECRET)
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Extract ID from URL path
    const pathMatch = request.nextUrl.pathname.match(/\/api\/admin\/notifications\/(.+)/)
    const id = pathMatch?.[1]

    if (!id) {
      return NextResponse.json({ error: "Missing notification ID" }, { status: 400 })
    }

    const { error } = await supabase.from("admin_notifications").delete().eq("id", id)

    if (error) {
      return NextResponse.json({ error: `Delete failed: ${error.message}` }, { status: 400 })
    }

    return NextResponse.json({ message: "Notification deleted" })
  } catch (error) {
    console.error("Error deleting notification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
