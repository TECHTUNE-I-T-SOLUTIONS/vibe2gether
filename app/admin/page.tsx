"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { Users, FileText, Flag, Coins, TrendingUp, TrendingDown, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useI18n } from "@/lib/i18n/context"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface DashboardStats {
  totalUsers: number
  totalPosts: number
  pendingReports: number
  totalTransactions: number
}

interface RecentUser {
  id: string
  full_name: string
  email: string
  is_verified: boolean
  created_at: string
  profile_picture?: string
}

export default function AdminDashboard() {
  const { t } = useI18n()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/admin/auth/me")
      if (!response.ok) {
        router.push("/auth/login")
        return
      }
      setAuthChecked(true)
      fetchDashboardData()
    } catch (error) {
      console.error("Auth check failed:", error)
      router.push("/auth/login")
    }
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Get stats
      const { count: userCount } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })

      const { count: postCount } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })

      const { count: reportCount } = await supabase
        .from("reports")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending")

      const { count: transactionCount } = await supabase
        .from("transactions")
        .select("*", { count: "exact", head: true })

      setStats({
        totalUsers: userCount || 0,
        totalPosts: postCount || 0,
        pendingReports: reportCount || 0,
        totalTransactions: transactionCount || 0,
      })

      // Get recent users
      const { data: users } = await supabase
        .from("users")
        .select("id, full_name, email, is_verified, created_at, profile_picture")
        .order("created_at", { ascending: false })
        .limit(5)

      setRecentUsers(users || [])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor(diff / (1000 * 60))

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return d.toLocaleDateString()
  }

  if (!authChecked || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    )
  }

  const dashStats = [
    { icon: Users, label: "Total Users", value: stats?.totalUsers.toLocaleString() || "0", trend: "+0%", up: true },
    { icon: FileText, label: "Total Posts", value: stats?.totalPosts.toLocaleString() || "0", trend: "+0%", up: true },
    { icon: Flag, label: "Pending Reports", value: stats?.pendingReports || "0", trend: "-0%", up: false },
    { icon: Coins, label: "Transactions", value: stats?.totalTransactions || "0", trend: "+0%", up: true },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">{t("adminDashboard")}</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening on Vibe2Gether.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashStats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${stat.up ? "text-green-500" : "text-red-500"}`}>
                    {stat.up ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {stat.trend}
                  </div>
                </div>
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Users */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Users</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <a href="/admin/users">View All</a>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={user.profile_picture || ""} />
                    <AvatarFallback>{user.full_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.full_name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={user.is_verified ? "default" : "secondary"}>
                    {user.is_verified ? "Verified" : "Pending"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{formatDate(user.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
