"use client"

import { useState, useEffect } from "react"
import { Search, Filter, MoreHorizontal, UserCheck, UserX, Shield, Eye, Ban, Verified, Loader } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"

interface User {
  id: string
  email: string
  full_name?: string
  username?: string
  avatar_url?: string
  is_verified?: boolean
  email_confirmed_at?: string
  created_at?: string
  last_sign_in_at?: string
  user_metadata?: any
  premium_subscriptions?: any[]
}

interface DashboardStats {
  totalUsers: number
  activeToday: number
  newThisWeek: number
  premiumUsers: number
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Never"
  try {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (mins < 1) return "Just now"
    if (mins < 60) return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return d.toLocaleDateString()
  } catch {
    return "Unknown"
  }
}

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeToday: 0,
    newThisWeek: 0,
    premiumUsers: 0,
  })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  useEffect(() => {
    async function fetchData() {
      try {
        const params = new URLSearchParams()
        if (statusFilter !== "all") params.append("status", statusFilter)
        if (searchQuery) params.append("search", searchQuery)

        const response = await fetch(`/api/admin/users?${params}`)
        if (!response.ok) throw new Error("Failed to fetch users")

        const data = await response.json()
        setUsers(data.users || [])
        setStats({
          totalUsers: data.stats.total,
          activeToday: data.stats.active,
          newThisWeek: data.stats.newThisWeek,
          premiumUsers: data.stats.premium,
        })
      } catch (error) {
        console.error("Error fetching users:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [statusFilter, searchQuery])

  const filteredUsers = users.filter((user: any) => {
    const matchesSearch =
      searchQuery === "" ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && user.last_sign_in_at) ||
      (statusFilter === "pending" && !user.is_verified)

    const matchesType =
      typeFilter === "all" ||
      (typeFilter === "premium" && user.is_premium) ||
      (typeFilter === "verified" && user.is_verified)

    return matchesSearch && matchesStatus && matchesType
  })

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex items-center justify-center min-h-[500px]">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  const statItems = [
    { label: "Total Users", value: stats.totalUsers.toLocaleString(), change: "+12%" },
    { label: "Active Today", value: stats.activeToday.toLocaleString(), change: "+5%" },
    { label: "New This Week", value: stats.newThisWeek.toLocaleString(), change: "+18%" },
    { label: "Premium Users", value: stats.premiumUsers.toLocaleString(), change: "+8%" },
  ]

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">User Management</h1>
        <p className="text-muted-foreground">View, manage, and moderate platform users</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statItems.map((stat, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold">{stat.value}</span>
                <span className="text-sm text-green-500">{stat.change}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-border/50 mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name, email, or username..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="bg-transparent">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Tabs defaultValue="all">
        <TabsList className="bg-muted/50 p-1 rounded-full mb-6">
          <TabsTrigger value="all" className="rounded-full">
            All Users ({users.length})
          </TabsTrigger>
          <TabsTrigger value="verified" className="rounded-full">
            Verified ({users.filter((u: any) => u.is_verified).length})
          </TabsTrigger>
          <TabsTrigger value="premium" className="rounded-full">
            Premium ({users.filter((u: any) => u.is_premium).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card className="border-border/50">
            <CardContent className="p-0">
              {filteredUsers.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  No users found matching your criteria
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left py-4 px-6 font-medium text-muted-foreground">User</th>
                        <th className="text-left py-4 px-6 font-medium text-muted-foreground">Email</th>
                        <th className="text-left py-4 px-6 font-medium text-muted-foreground">Status</th>
                        <th className="text-left py-4 px-6 font-medium text-muted-foreground">Joined</th>
                        <th className="text-left py-4 px-6 font-medium text-muted-foreground">Last Active</th>
                        <th className="text-right py-4 px-6 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.slice(0, 50).map((user: any) => (
                        <tr
                          key={user.id}
                          className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={user.avatar_url || "/placeholder.svg"} alt={user.full_name} />
                                <AvatarFallback>{user.full_name?.[0] || "U"}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-medium text-sm">{user.full_name}</span>
                                  {user.is_verified && (
                                    <Verified className="w-4 h-4 text-blue-500 fill-blue-500" />
                                  )}
                                  {user.is_premium && (
                                    <Badge className="bg-gradient-to-r from-orange-400 to-pink-500 text-white text-xs h-5">
                                      PRO
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">@{user.username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm">{user.email}</td>
                          <td className="py-4 px-6">
                            <Badge
                              variant={user.is_verified ? "default" : "secondary"}
                              className={user.is_verified ? "bg-green-500" : ""}
                            >
                              {user.is_verified ? "Verified" : "Pending"}
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-sm text-muted-foreground">
                            {formatDate(user.created_at)}
                          </td>
                          <td className="py-4 px-6 text-sm text-muted-foreground">
                            {formatDate(user.last_sign_in_at)}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  Verify User
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Shield className="w-4 h-4 mr-2" />
                                  Make Admin
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-orange-500">
                                  <UserX className="w-4 h-4 mr-2" />
                                  Suspend User
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                  <Ban className="w-4 h-4 mr-2" />
                                  Ban User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
