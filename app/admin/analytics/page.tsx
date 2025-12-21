"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Users, Zap, MessageCircle, TrendingUp, ArrowUp, ArrowDown, Loader } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface AnalyticsData {
  totalUsers: number
  activeUsers: number
  totalPosts: number
  totalComments: number
  totalCoinsSpent: number
  topCountries: Array<{ country: string; count: number }>
}

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  isPositive = true,
}: {
  title: string
  value: string
  change: string
  icon: React.ComponentType<{ className?: string }>
  isPositive?: boolean
}) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-2">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            <div className="flex items-center gap-1 mt-2">
              {isPositive ? (
                <ArrowUp className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDown className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm ${isPositive ? "text-green-500" : "text-red-500"}`}>{change}</span>
            </div>
          </div>
          <Icon className="w-10 h-10 text-muted-foreground opacity-50" />
        </div>
      </CardContent>
    </Card>
  )
}

const overviewStats = [
  { label: "Total Users", value: "24,521", change: "+12.5%", up: true, icon: Users },
  { label: "Daily Active Users", value: "8,432", change: "+5.2%", up: true, icon: Zap },
  { label: "Total Posts", value: "1,234", change: "+18.3%", up: true, icon: MessageCircle },
  { label: "Revenue", value: "₦45.6k", change: "+22.1%", up: true, icon: TrendingUp },
]

const userGrowthData = [
  { month: "Jan", users: 15000 },
  { month: "Feb", users: 16500 },
  { month: "Mar", users: 18200 },
  { month: "Apr", users: 19800 },
  { month: "May", users: 21500 },
  { month: "Jun", users: 22800 },
  { month: "Jul", users: 24521 },
]

const engagementData = [
  { day: "Mon", likes: 1200, comments: 800, shares: 400 },
  { day: "Tue", likes: 1400, comments: 900, shares: 500 },
  { day: "Wed", likes: 1600, comments: 1100, shares: 600 },
  { day: "Thu", likes: 1300, comments: 850, shares: 450 },
  { day: "Fri", likes: 1800, comments: 1200, shares: 700 },
  { day: "Sat", likes: 2200, comments: 1500, shares: 900 },
  { day: "Sun", likes: 2000, comments: 1400, shares: 800 },
]

const deviceData = [
  { name: "Mobile", value: 65, color: "#ff477e" },
  { name: "Desktop", value: 28, color: "#ffaa42" },
  { name: "Tablet", value: 7, color: "#6a4cff" },
]

const countryData = [
  { country: "United States", users: 8500, percentage: 35 },
  { country: "United Kingdom", users: 4200, percentage: 17 },
  { country: "Germany", users: 2800, percentage: 11 },
  { country: "France", users: 2100, percentage: 9 },
  { country: "Canada", users: 1800, percentage: 7 },
  { country: "Others", users: 5121, percentage: 21 },
]

const ageData = [
  { age: "18-24", male: 2500, female: 2800 },
  { age: "25-34", male: 4200, female: 4500 },
  { age: "35-44", male: 2800, female: 3100 },
  { age: "45-54", male: 1500, female: 1800 },
  { age: "55+", male: 600, female: 721 },
]

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalUsers: 0,
    activeUsers: 0,
    totalPosts: 0,
    totalComments: 0,
    totalCoinsSpent: 0,
    topCountries: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const supabase = createClient()

        // Fetch counts
        const [usersRes, postsRes, commentsRes] = await Promise.all([
          supabase.from("users").select("*", { count: "exact", head: true }),
          supabase.from("posts").select("*", { count: "exact", head: true }),
          supabase.from("comments").select("*", { count: "exact", head: true }),
        ])

        // Fetch active users (last 7 days)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const { data: activeUsersData } = await supabase
          .from("users")
          .select("id", { count: "exact" })
          .gte("last_sign_in_at", sevenDaysAgo.toISOString())

        // Fetch top countries
        const { data: countriesData } = await supabase.from("users").select("country")

        const countryMap = new Map<string, number>()
        countriesData?.forEach((p: any) => {
          if (p.country) {
            countryMap.set(p.country, (countryMap.get(p.country) || 0) + 1)
          }
        })

        const topCountries = Array.from(countryMap.entries())
          .map(([country, count]) => ({ country, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)

        // Fetch coins spent
        const { data: transactions } = await supabase
          .from("transactions")
          .select("amount")
          .eq("status", "completed")

        const totalCoinsSpent = transactions?.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0

        setAnalytics({
          totalUsers: usersRes.count || 0,
          activeUsers: activeUsersData?.length || 0,
          totalPosts: postsRes.count || 0,
          totalComments: commentsRes.count || 0,
          totalCoinsSpent,
          topCountries,
        })
      } catch (error) {
        console.error("Error fetching analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex items-center justify-center min-h-[500px]">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Analytics & Insights</h1>
        <p className="text-muted-foreground">Platform performance and user engagement metrics</p>
      </div>

      {/* Main Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Users"
          value={analytics.totalUsers.toLocaleString()}
          change="12% from last month"
          icon={Users}
          isPositive={true}
        />
        <StatCard
          title="Active Users (7d)"
          value={analytics.activeUsers.toLocaleString()}
          change="5% increase"
          icon={Zap}
          isPositive={true}
        />
        <StatCard
          title="Total Posts"
          value={analytics.totalPosts.toLocaleString()}
          change="8% growth"
          icon={MessageCircle}
          isPositive={true}
        />
        <StatCard
          title="Revenue"
          value={`₦${(analytics.totalCoinsSpent / 1000).toFixed(1)}k`}
          change="18% increase"
          icon={TrendingUp}
          isPositive={true}
        />
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="mb-8">
        <TabsList className="bg-muted/50 p-1 rounded-full mb-6">
          <TabsTrigger value="overview" className="rounded-full">
            Overview
          </TabsTrigger>
          <TabsTrigger value="geography" className="rounded-full">
            Geography
          </TabsTrigger>
          <TabsTrigger value="engagement" className="rounded-full">
            Engagement
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Key Metrics Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div>
                    <p className="font-medium">User Engagement Rate</p>
                    <p className="text-sm text-muted-foreground">Active users vs total users</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {analytics.totalUsers > 0
                        ? ((analytics.activeUsers / analytics.totalUsers) * 100).toFixed(1)
                        : 0}
                      %
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div>
                    <p className="font-medium">Avg Posts per User</p>
                    <p className="text-sm text-muted-foreground">Total posts divided by users</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {analytics.totalUsers > 0 ? (analytics.totalPosts / analytics.totalUsers).toFixed(1) : 0}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Total Comments</p>
                    <p className="text-sm text-muted-foreground">User interactions</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{analytics.totalComments.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geography">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Top Countries</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.topCountries.length === 0 ? (
                <p className="text-muted-foreground">No location data available</p>
              ) : (
                <div className="space-y-4">
                  {analytics.topCountries.map((country, index) => (
                    <div key={index} className="flex items-center justify-between pb-4 border-b border-border last:border-0">
                      <div>
                        <Badge variant="secondary">{index + 1}</Badge>
                        <span className="ml-3 font-medium">{country.country}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{country.count} users</p>
                        <p className="text-sm text-muted-foreground">
                          {((country.count / analytics.totalUsers) * 100).toFixed(1)}% of total
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Engagement Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div>
                    <p className="font-medium">Content Creation Rate</p>
                    <p className="text-sm text-muted-foreground">Posts per active user</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {analytics.activeUsers > 0 ? (analytics.totalPosts / analytics.activeUsers).toFixed(2) : 0}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Platform Health Score</p>
                    <p className="text-sm text-muted-foreground">Based on activity metrics</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-green-500">
                      {(
                        (analytics.activeUsers / analytics.totalUsers) *
                        100 +
                        (analytics.totalPosts / Math.max(analytics.totalUsers, 1)) * 10
                      ).toFixed(1)}
                      /100
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
