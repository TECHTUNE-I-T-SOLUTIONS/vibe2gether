"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, ChevronLeft, ChevronRight, Ban, CheckCircle } from "lucide-react"
import { useAdminAuth } from "@/hooks/use-admin-auth"

interface User {
  id: string
  email: string
  display_name: string
  is_verified: boolean
  is_premium: boolean
  followers_count: number
  following_count: number
  is_active: boolean
  created_at: string
}

interface ApiResponse {
  users: User[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
  stats: {
    total: number
    active: number
    premium: number
    newThisWeek: number
  }
}

export function AdminUsersManager() {
  const { isAuthenticated } = useAdminAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [stats, setStats] = useState({ total: 0, active: 0, premium: 0, newThisWeek: 0 })
  const [totalPages, setTotalPages] = useState(1)

  const fetchUsers = async () => {
    if (!isAuthenticated) return

    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
      })

      const res = await fetch(`/api/admin/users?${params}`)
      if (!res.ok) throw new Error("Failed to fetch users")

      const data: ApiResponse = await res.json()
      setUsers(data.users || [])
      setStats(data.stats)
      setTotalPages(data.pagination.pages)
    } catch (error) {
      console.error("[AdminUsersManager] Error fetching users:", error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers()
    }
  }, [page, isAuthenticated])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchUsers()
  }

  const handleBanUser = async (userId: string) => {
    if (!confirm("Are you sure you want to ban this user?")) return

    try {
      const res = await fetch(`/api/admin/users/${userId}/ban`, { method: "POST" })
      if (res.ok) {
        fetchUsers()
        alert("User banned successfully")
      }
    } catch (error) {
      console.error("[AdminUsersManager] Error banning user:", error)
    }
  }

  const handleVerifyUser = async (userId: string) => {
    if (!confirm("Verify this user?")) return

    try {
      const res = await fetch(`/api/admin/users/${userId}/verify`, { method: "POST" })
      if (res.ok) {
        fetchUsers()
        alert("User verified successfully")
      }
    } catch (error) {
      console.error("[AdminUsersManager] Error verifying user:", error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">{stats.newThisWeek} new this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.active / stats.total) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.premium}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.premium / stats.total) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Verified Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => u.is_verified).length}
            </div>
            <p className="text-xs text-muted-foreground">Identity verified</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search Users</CardTitle>
          <CardDescription>Find users by name, email, or ID</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Showing {users.length} users</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No users found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Followers</TableHead>
                      <TableHead>Following</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.display_name}</TableCell>
                        <TableCell className="text-sm">{user.email}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {user.is_active && (
                              <Badge variant="outline" className="bg-green-50">
                                Active
                              </Badge>
                            )}
                            {user.is_premium && (
                              <Badge className="bg-purple-100 text-purple-900">Premium</Badge>
                            )}
                            {user.is_verified && (
                              <Badge className="bg-blue-100 text-blue-900">Verified</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{user.followers_count}</TableCell>
                        <TableCell>{user.following_count}</TableCell>
                        <TableCell className="text-sm">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {!user.is_verified && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleVerifyUser(user.id)}
                                className="text-xs"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verify
                              </Button>
                            )}
                            {user.is_active && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleBanUser(user.id)}
                                className="text-xs"
                              >
                                <Ban className="h-3 w-3 mr-1" />
                                Ban
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
