import { NextResponse } from "next/server"
import { requireMobileUser } from "../_lib/auth"

export async function GET(request: Request) {
  try {
    const { supabase, user } = await requireMobileUser(request)

    const { data: notifications, error } = await supabase
      .from("notifications")
      .select(`
        id,
        type,
        title,
        message,
        actor_id,
        is_read,
        created_at,
        action_url,
        actor:actor_id(id, display_name, full_name, profile_picture)
      `)
      .eq("user_id", user.id)
      .order("is_read", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(30)

    if (error) {
      throw error
    }

    const formattedNotifications = (notifications || []).map((notif: any) => ({
      id: notif.id,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      actor_name: notif.actor?.display_name || notif.actor?.full_name || "System",
      actor_image: notif.actor?.profile_picture || "/v2g-logo.png",
      actor_id: notif.actor_id || notif.actor?.id,
      read: notif.is_read,
      created_at: notif.created_at,
      actionUrl: notif.action_url,
    }))

    return NextResponse.json({
      unreadCount: formattedNotifications.filter((notif: any) => !notif.read).length,
      notifications: formattedNotifications,
    })
  } catch (error) {
    console.error("Mobile notifications error:", error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}
