"use client"

import { useState } from "react"
import { Search, Filter, MoreHorizontal, UserCheck, UserX, Shield, Eye, Ban, Verified } from "lucide-react"
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

const users = [
  {
    id: 1,
    name: "Emma Rodriguez",
    username: "emma_r",
    email: "emma@example.com",
    avatar: "/emma-woman-avatar.jpg",
    status: "active",
    verified: true,
    premium: true,
    joined: "Jan 15, 2024",
    lastActive: "2 min ago",
    posts: 156,
    followers: 2341,
    coins: 4520,
  },
  {
    id: 2,
    name: "James Chen",
    username: "james_c",
    email: "james@example.com",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "pending",
    verified: false,
    premium: false,
    joined: "Mar 20, 2024",
    lastActive: "1 hour ago",
    posts: 23,
    followers: 156,
    coins: 340,
  },
  {
    id: 3,
    name: "Sofia Martinez",
    username: "sofia_m",
    email: "sofia@example.com",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "active",
    verified: true,
    premium: true,
    joined: "Feb 8, 2024",
    lastActive: "5 min ago",
    posts: 89,
    followers: 1023,
    coins: 2100,
  },
  {
    id: 4,
    name: "Marcus Williams",
    username: "marcus_w",
    email: "marcus@example.com",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "suspended",
    verified: false,
    premium: false,
    joined: "Apr 1, 2024",
    lastActive: "3 days ago",
    posts: 12,
    followers: 45,
    coins: 0,
  },
  {
    id: 5,
    name: "Yuki Tanaka",
    username: "yuki_t",
    email: "yuki@example.com",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "active",
    verified: true,
    premium: false,
    joined: "Dec 10, 2023",
    lastActive: "30 min ago",
    posts: 234,
    followers: 3456,
    coins: 6780,
  },
]

const stats = [
  { label: "Total Users", value: "24,521", change: "+12%" },
  { label: "Active Today", value: "8,432", change: "+5%" },
  { label: "New This Week", value: "1,234", change: "+18%" },
  { label: "Premium Users", value: "3,891", change: "+8%" },
]

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">User Management</h1>
        <p className="text-muted-foreground">View, manage, and moderate platform users</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
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
              <Select defaultValue="all">
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
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
            All Users
          </TabsTrigger>
          <TabsTrigger value="verified" className="rounded-full">
            Verified
          </TabsTrigger>
          <TabsTrigger value="premium" className="rounded-full">
            Premium
          </TabsTrigger>
          <TabsTrigger value="pending" className="rounded-full">
            Pending Review
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card className="border-border/50">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left py-4 px-6 font-medium text-muted-foreground">User</th>
                      <th className="text-left py-4 px-6 font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-4 px-6 font-medium text-muted-foreground">Posts</th>
                      <th className="text-left py-4 px-6 font-medium text-muted-foreground">Followers</th>
                      <th className="text-left py-4 px-6 font-medium text-muted-foreground">Coins</th>
                      <th className="text-left py-4 px-6 font-medium text-muted-foreground">Joined</th>
                      <th className="text-right py-4 px-6 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={user.avatar || "/placeholder.svg"} />
                              <AvatarFallback>{user.name[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium">{user.name}</span>
                                {user.verified && <Verified className="w-4 h-4 text-blue-500 fill-blue-500" />}
                                {user.premium && (
                                  <Badge className="gradient-bg text-primary-foreground text-xs h-5">PRO</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">@{user.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <Badge
                            variant={
                              user.status === "active"
                                ? "default"
                                : user.status === "suspended"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className={user.status === "active" ? "bg-green-500" : ""}
                          >
                            {user.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-6">{user.posts}</td>
                        <td className="py-4 px-6">{user.followers.toLocaleString()}</td>
                        <td className="py-4 px-6">{user.coins.toLocaleString()}</td>
                        <td className="py-4 px-6 text-muted-foreground">{user.joined}</td>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
