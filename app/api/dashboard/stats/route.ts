import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

export async function POST() {
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

    // Get user profile - select only needed fields
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, display_name, followers_count, coins_balance")
      .eq("email", session.user.email)
      .single()

    if (userError || !user) {
      console.error("Error fetching user:", userError)
      return Response.json({ error: "Failed to fetch user data" }, { status: 500 })
    }

    // Parallelize all independent queries
    const today = new Date()
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const fourteenDaysAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000)

    // First: Get posts to know which IDs to query for likes
    const { data: postsData } = await supabase
      .from("posts")
      .select("id, views_count")
      .eq("user_id", user.id)

    const postIds = postsData?.map(p => p.id) || []

    // Execute remaining queries in parallel
    const [
      { data: recentPosts },
      { data: previousPosts },
      likesResult,
      { count: savedOppsCount },
      { data: activities }
    ] = await Promise.all([
      // Get recent posts (last 7 days)
      supabase
        .from("posts")
        .select("views_count, likes_count, comments_count")
        .eq("user_id", user.id)
        .gte("created_at", sevenDaysAgo.toISOString()),
      
      // Get previous posts (7-14 days ago)
      supabase
        .from("posts")
        .select("views_count, likes_count, comments_count")
        .eq("user_id", user.id)
        .gte("created_at", fourteenDaysAgo.toISOString())
        .lt("created_at", sevenDaysAgo.toISOString()),
      
      // Get likes count (only query if we have post IDs)
      postIds.length > 0
        ? supabase
            .from("likes")
            .select("*", { count: "exact", head: true })
            .in("post_id", postIds)
        : Promise.resolve({ count: 0 }),
      
      // Get saved opportunities count
      supabase
        .from("opportunity_bookmarks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
      
      // Get recent activities
      supabase
        .from("notifications")
        .select("id, type, title, message, actor_id, created_at, actor:actor_id(id, display_name, profile_picture)")
        .eq("user_id", user.id)
        .in("type", ["like", "follow", "comment", "view", "message", "match"])
        .order("created_at", { ascending: false })
        .limit(8)
    ])

    const likesCount = likesResult?.count || 0

    // Calculate totals from posts data
    const totalViews = (postsData || []).reduce((sum, p) => sum + (p.views_count || 0), 0)
    const totalLikes = likesCount || 0

    // Calculate trend percentages
    const calculateTrend = (recent: any[], previous: any[], field: string): string => {
      const recentSum = (recent || []).reduce((sum, p) => sum + (p[field] || 0), 0)
      const previousSum = (previous || []).reduce((sum, p) => sum + (p[field] || 0), 0)

      if (previousSum === 0) {
        return recentSum > 0 ? "+100%" : "0%"
      }

      const percentage = Math.round(((recentSum - previousSum) / previousSum) * 100)
      return percentage > 0 ? `+${percentage}%` : `${percentage}%`
    }

    const viewsTrend = calculateTrend(recentPosts || [], previousPosts || [], "views_count")
    const likesTrend = calculateTrend(recentPosts || [], previousPosts || [], "likes_count")

    // Format activities from notifications (no need for additional queries)
    let formattedActivities: Array<{
      type: string
      user: string
      avatar: string
      time: string
      message: string
      coins: number
    }> = []
    if (activities && activities.length > 0) {
      formattedActivities = activities.map((activity: any) => {
        const timeAgo = getTimeAgo(new Date(activity.created_at))
        const actorName = activity.actor?.display_name || "Someone"
        const actorAvatar = activity.actor?.profile_picture || "/placeholder.svg"

        const typeMap: Record<string, string> = {
          like: "like",
          follow: "follow",
          comment: "comment",
          view: "view",
          message: "message",
          match: "match",
        }

        return {
          type: typeMap[activity.type] || activity.type,
          user: actorName,
          avatar: actorAvatar,
          time: timeAgo,
          message: activity.message || activity.title,
          coins: 0,
        }
      })
    }

    // Format stats - simplified without extra engagement queries
    const stats = [
      {
        icon: "eye",
        label: "total Views",
        value: totalViews.toString(),
        trend: viewsTrend,
        coins: 0,
      },
      {
        icon: "heart",
        label: "total Likes",
        value: totalLikes.toString(),
        trend: likesTrend,
        coins: 0,
      },
      {
        icon: "users",
        label: "followers",
        value: (user.followers_count || 0).toString(),
        trend: "+0%",
        coins: 0,
      },
      {
        icon: "connections",
        label: "your Connections",
        value: (savedOppsCount || 0).toString(),
        trend: "+0%",
        coins: 0,
      },
      {
        icon: "coins",
        label: "coins Earned",
        value: (user.coins_balance || 0).toString(),
        trend: "+0%",
        coins: 0,
      },
    ]

    return Response.json({
      stats,
      matches: [], // Empty matches - user can view full list in dedicated page
      recentActivity: formattedActivities,
      coinBalance: user.coins_balance || 0,
    }, {
      headers: {
        "Cache-Control": "private, max-age=60", // Cache for 60 seconds
      }
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return Response.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    )
  }
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}
