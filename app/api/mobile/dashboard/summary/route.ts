import { NextResponse } from "next/server"
import { requireMobileUser } from "../../_lib/auth"

export async function GET(request: Request) {
  try {
    const { supabase, user } = await requireMobileUser(request)

    const [notificationsRes, messagesRes, referralRes, recentNotificationsRes] = await Promise.all([
      supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_read", false),
      supabase.from("messages").select("id", { count: "exact", head: true }).eq("is_read", false).neq("sender_id", user.id),
      supabase.from("referral_bonuses").select("id, referrer_bonus_amount, referrer_bonus_claimed").eq("referrer_id", user.id),
      supabase
        .from("notifications")
        .select("id, type, title, message, created_at, is_read, actor:actor_id(display_name, full_name, profile_picture)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ])

    const unreadNotifications = notificationsRes.count || 0
    const unreadMessages = messagesRes.count || 0
    const referralBonuses = referralRes.data || []
    const referralTotal = referralBonuses.reduce((sum, bonus: any) => sum + (bonus.referrer_bonus_claimed ? bonus.referrer_bonus_amount || 0 : 0), 0)

    const recentActivity = (recentNotificationsRes.data || []).map((item: any) => ({
      id: item.id,
      title: item.title || item.type || "Notification",
      description: item.message || "",
      created_at: item.created_at,
    }))

    const stats = [
      { label: "Notifications", value: unreadNotifications },
      { label: "Messages", value: unreadMessages },
      { label: "Coins", value: user.coins_balance || 0 },
      { label: "Referral Bonuses", value: referralRes.data?.length || 0 },
    ]

    return NextResponse.json({
      stats,
      unreadNotifications,
      unreadMessages,
      coinBalance: user.coins_balance || referralTotal || 0,
      recentActivity,
      matches: [],
    })
  } catch (error) {
    console.error("Mobile dashboard summary error:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard summary" }, { status: 500 })
  }
}
