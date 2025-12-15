"use client"

import { Users, FileText, Flag, Coins, TrendingUp, TrendingDown, Star, ArrowUpRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useI18n } from "@/lib/i18n/context"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"

const stats = [
  { icon: Users, label: "Total Users", value: "24,521", trend: "+12%", up: true },
  { icon: FileText, label: "Total Posts", value: "156,892", trend: "+8%", up: true },
  { icon: Flag, label: "Pending Reports", value: "8", trend: "-23%", up: false },
  { icon: Coins, label: "Total Coins", value: "2.4M", trend: "+18%", up: true },
]

const chartData = [
  { name: "Mon", users: 400, posts: 240 },
  { name: "Tue", users: 300, posts: 139 },
  { name: "Wed", users: 500, posts: 380 },
  { name: "Thu", users: 278, posts: 390 },
  { name: "Fri", users: 589, posts: 480 },
  { name: "Sat", users: 439, posts: 380 },
  { name: "Sun", users: 349, posts: 430 },
]

const recentUsers = [
  {
    name: "Emma Rodriguez",
    email: "emma@example.com",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "verified",
    joined: "2 min ago",
  },
  {
    name: "James Chen",
    email: "james@example.com",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "pending",
    joined: "15 min ago",
  },
  {
    name: "Sofia Martinez",
    email: "sofia@example.com",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "verified",
    joined: "1 hour ago",
  },
  {
    name: "Marcus Williams",
    email: "marcus@example.com",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "verified",
    joined: "2 hours ago",
  },
]

const featuredRequests = [
  { user: "Fashion Store", type: "Product", status: "pending", date: "Today" },
  { user: "Romantic Gifts Co", type: "Product", status: "pending", date: "Today" },
  { user: "Love Letters Inc", type: "Service", status: "pending", date: "Yesterday" },
  { user: "Date Night Box", type: "Product", status: "approved", date: "Yesterday" },
  { user: "Couples Retreat", type: "Event", status: "pending", date: "Dec 5" },
]

export default function AdminDashboard() {
  const { t } = useI18n()

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">{t("adminDashboard")}</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening on Vibe2Gether.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <Card key={i} className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-white" />
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

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Chart */}
        <Card className="border-border/50 lg:col-span-2 overflow-hidden">
          <CardHeader>
            <CardTitle>Activity Overview</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="w-full p-6" style={{ height: "320px" }}>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff477e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ff477e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffaa42" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ffaa42" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="name" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip />
                  <Area type="monotone" dataKey="users" stroke="#ff477e" fillOpacity={1} fill="url(#colorUsers)" />
                  <Area type="monotone" dataKey="posts" stroke="#ffaa42" fillOpacity={1} fill="url(#colorPosts)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Featured Requests */}
        <Card className="border-border/50">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-accent" />
              {t("featuredRequests")}
            </CardTitle>
            <Badge>
              {featuredRequests.filter((r) => r.status === "pending").length} {t("pending")}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {featuredRequests.map((req, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium">{req.user}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {req.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{req.date}</span>
                    </div>
                  </div>
                  <Badge
                    variant={req.status === "pending" ? "secondary" : "default"}
                    className={req.status === "approved" ? "bg-green-500" : ""}
                  >
                    {t(req.status)}
                  </Badge>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4 rounded-full bg-transparent">
              View All Requests
              <ArrowUpRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Users */}
      <Card className="border-border/50 mt-8">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Recent Users</CardTitle>
          <Button variant="outline" className="rounded-full bg-transparent" size="sm">
            View All
            <ArrowUpRight className="w-4 h-4 ml-2" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">User</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Joined</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((user, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user.avatar || "/placeholder.svg"} />
                          <AvatarFallback>{user.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{user.email}</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={user.status === "verified" ? "default" : "secondary"}
                        className={user.status === "verified" ? "bg-green-500" : ""}
                      >
                        {user.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{user.joined}</td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="sm" className="rounded-full">
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
