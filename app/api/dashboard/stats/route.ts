import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Mock data - in production, this would come from a database
    const stats = [
      { icon: "eye", label: "profileViews", value: Math.floor(Math.random() * 5000).toLocaleString(), trend: "+12%", coins: 12 },
      { icon: "heart", label: "likesReceived", value: Math.floor(Math.random() * 1000).toLocaleString(), trend: "+8%", coins: 46 },
      { icon: "users", label: "followers", value: Math.floor(Math.random() * 500).toLocaleString(), trend: "+15%", coins: 58 },
      { icon: "coins", label: "coinsEarned", value: Math.floor(Math.random() * 10000).toLocaleString(), trend: "+25%", coins: 0 },
    ]

    const recentActivity = [
      { type: "like", user: "Emma", time: "2 min ago", avatar: "/placeholder-user.jpg", coins: 1 },
      { type: "follow", user: "James", time: "15 min ago", avatar: "/placeholder-user.jpg", coins: 2 },
      { type: "view", user: "Sofia", time: "1 hour ago", avatar: "/placeholder-user.jpg", coins: 0.1 },
      { type: "message", user: "Marcus", time: "2 hours ago", avatar: "/placeholder-user.jpg", coins: 0 },
      { type: "like", user: "Yuki", time: "3 hours ago", avatar: "/placeholder-user.jpg", coins: 1 },
    ]

    const matches = [
      { id: 1, name: "Emma", age: 28, image: "/placeholder-user.jpg", vibeScore: 95, online: true },
      { id: 2, name: "Sofia", age: 26, image: "/placeholder-user.jpg", vibeScore: 92, online: false },
      { id: 3, name: "Yuki", age: 27, image: "/placeholder-user.jpg", vibeScore: 89, online: true },
    ]

    return Response.json({
      stats,
      recentActivity,
      matches,
      coinBalance: Math.floor(Math.random() * 10000),
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return Response.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    )
  }
}
