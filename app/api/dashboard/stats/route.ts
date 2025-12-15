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

    // Get user profile
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", session.user.email)
      .single()

    if (userError || !user) {
      console.error("Error fetching user:", userError)
      return Response.json({ error: "Failed to fetch user data" }, { status: 500 })
    }

    // Get actual follower counts
    const { count: followersCount } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", user.id)

    const { count: followingCount } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", user.id)

    // Get user's posts stats
    const { data: postsData, count: postsCount } = await supabase
      .from("posts")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)

    // Get likes on user's posts
    const postIds = postsData?.map(p => p.id) || []
    const { count: likesCount } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .in("post_id", postIds.length > 0 ? postIds : [null])

    // Calculate totals
    const totalViews = postsData?.reduce((sum, p) => sum + (p.views_count || 0), 0) || 0
    const totalLikes = likesCount || 0

    // Calculate trends by comparing last 7 days vs previous 7 days
    const today = new Date()
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const fourteenDaysAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000)

    // Get posts from last 7 days and previous 7 days
    const { data: recentPosts } = await supabase
      .from("posts")
      .select("views_count, likes_count, comments_count, shares_count, created_at")
      .eq("user_id", user.id)
      .gte("created_at", sevenDaysAgo.toISOString())
      .order("created_at", { ascending: false })

    const { data: previousPosts } = await supabase
      .from("posts")
      .select("views_count, likes_count, comments_count, shares_count, created_at")
      .eq("user_id", user.id)
      .gte("created_at", fourteenDaysAgo.toISOString())
      .lt("created_at", sevenDaysAgo.toISOString())
      .order("created_at", { ascending: false })

    // Calculate trend percentages
    const calculateTrend = (recent: any[], previous: any[], field: string): string => {
      const recentSum = recent.reduce((sum, p) => sum + (p[field] || 0), 0)
      const previousSum = previous.reduce((sum, p) => sum + (p[field] || 0), 0)

      if (previousSum === 0) {
        return recentSum > 0 ? "+100%" : "0%"
      }

      const percentage = Math.round(((recentSum - previousSum) / previousSum) * 100)
      return percentage > 0 ? `+${percentage}%` : `${percentage}%`
    }

    const viewsTrend = calculateTrend(recentPosts || [], previousPosts || [], "views_count")
    const likesTrend = calculateTrend(recentPosts || [], previousPosts || [], "likes_count")

    // Calculate followers trend
    const { data: followerHistory } = await supabase
      .from("engagement")
      .select("followers_count, created_at")
      .eq("user_id", user.id)
      .gte("created_at", fourteenDaysAgo.toISOString())
      .order("created_at", { ascending: true })

    let followersTrend = "+0%"
    if (followerHistory && followerHistory.length >= 2) {
      const oldFollowers = followerHistory[0]?.followers_count || 0
      const newFollowers = followerHistory[followerHistory.length - 1]?.followers_count || user.followers_count || 0
      if (oldFollowers > 0) {
        const percentage = Math.round(((newFollowers - oldFollowers) / oldFollowers) * 100)
        followersTrend = percentage > 0 ? `+${percentage}%` : `${percentage}%`
      }
    }

    // Get matches - simplified query without complex joins
    let matchesRaw: any[] = []
    try {
      const { data, error: matchesError } = await supabase
        .from("matches")
        .select("id, user1_id, user2_id, status, compatibility_score")
        .eq("status", "matched")
        .limit(10)

      if (matchesError) {
        console.error("Error fetching matches:", matchesError)
      } else if (data) {
        // Filter matches for current user on client side
        matchesRaw = data.filter(
          (m) => m.user1_id === user.id || m.user2_id === user.id
        ).slice(0, 3)
      }
    } catch (err) {
      console.error("Matches fetch error:", err)
    }

    // Get user details for matched users
    let matches = []
    if (matchesRaw && matchesRaw.length > 0) {
      const userIds = matchesRaw
        .map((m) => m.user1_id === user.id ? m.user2_id : m.user1_id)
        .filter(Boolean)

      if (userIds.length > 0) {
        const { data: matchedUsers } = await supabase
          .from("users")
          .select("id, display_name, full_name, profile_picture, city, date_of_birth")
          .in("id", userIds)

        matches = matchesRaw.map((match) => {
          const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id
          const otherUser = matchedUsers?.find((u) => u.id === otherUserId)

          const age = otherUser?.date_of_birth
            ? new Date().getFullYear() - new Date(otherUser.date_of_birth).getFullYear()
            : 0

          return {
            id: match.id,
            name: otherUser?.display_name || otherUser?.full_name || "Unknown",
            age: age,
            image: otherUser?.profile_picture || "/placeholder.svg",
            vibeScore: Math.round(match.compatibility_score || 0),
            online: Math.random() > 0.5,
          }
        })
      }
    }

    // Get recent activity from notifications table
    const { data: activities, error: activitiesError } = await supabase
      .from("notifications")
      .select(`
        id,
        type,
        title,
        message,
        actor_id,
        created_at,
        actor:actor_id(id, display_name, full_name, profile_picture)
      `)
      .eq("user_id", user.id)
      .in("type", ["like", "follow", "comment", "view", "message", "match"])
      .order("created_at", { ascending: false })
      .limit(10)

    if (activitiesError) {
      console.error("Error fetching activities:", activitiesError)
    }

    // Format activities from notifications
    let formattedActivities = []
    if (activities && activities.length > 0) {
      formattedActivities = activities.map((activity: any) => {
        const timeAgo = getTimeAgo(new Date(activity.created_at))
        const actorName = activity.actor?.display_name || activity.actor?.full_name || "Someone"
        const actorAvatar = activity.actor?.profile_picture || "/placeholder.svg"

        let typeLabel = activity.type
        let displayMessage = activity.message || activity.title

        // Map type to display format
        const typeMap: Record<string, string> = {
          like: "like",
          follow: "follow",
          comment: "comment",
          view: "view",
          message: "message",
          match: "match",
          save: "save",
        }

        return {
          type: typeMap[activity.type] || activity.type,
          user: actorName,
          avatar: actorAvatar,
          time: timeAgo,
          message: displayMessage,
          coins: 0,
        }
      })
    }

    // Format stats with real trend data
    const stats = [
      {
        icon: "eye",
        label: "totalViews",
        value: totalViews.toString(),
        trend: viewsTrend,
        coins: 0,
      },
      {
        icon: "heart",
        label: "totalLikes",
        value: totalLikes.toString(),
        trend: likesTrend,
        coins: 0,
      },
      {
        icon: "users",
        label: "followers",
        value: user.followers_count?.toString() || "0",
        trend: followersTrend,
        coins: 0,
      },
      {
        icon: "coins",
        label: "coinsEarned",
        value: (user.coins_balance || 0).toString(),
        trend: "+0%",
        coins: 0,
      },
    ]

    return Response.json({
      stats,
      matches,
      recentActivity: formattedActivities,
      coinBalance: user.coins_balance || 0,
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
