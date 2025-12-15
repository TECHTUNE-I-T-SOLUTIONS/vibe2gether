import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get user
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .single()

    if (userError || !user) {
      return Response.json({ error: "User not found" }, { status: 404 })
    }

    // Get unread notifications count
    const { count: unreadCount } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false)

    // Get latest notifications (unread first, then most recent)
    const { data: notifications, error: notifError } = await supabase
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
      .limit(20)

    if (notifError) {
      console.error("Error fetching notifications:", notifError)
      return Response.json({ error: "Failed to fetch notifications" }, { status: 500 })
    }

    // Format notifications
    const formattedNotifications = (notifications || []).map((notif: any) => {
      const actorName = notif.actor?.display_name || notif.actor?.full_name || "System"
      const actorImage = notif.actor?.profile_picture || "/v2g-logo.png"
      
      return {
        id: notif.id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        actor_name: actorName,
        actor_image: actorImage,
        actor_id: notif.actor?.id,
        isRead: notif.is_read,
        created_at: notif.created_at,
        read: notif.is_read,
        actionUrl: notif.action_url,
      }
    })

    return Response.json({
      unreadCount: unreadCount || 0,
      notifications: formattedNotifications,
    })
  } catch (error) {
    console.error("Notifications fetch error:", error)
    return Response.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { notificationIds } = await request.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get user
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .single()

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 })
    }

    // Mark notifications as read
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .in("id", notificationIds)

    if (error) {
      return Response.json({ error: "Failed to update notifications" }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("Mark read error:", error)
    return Response.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    )
  }
}
