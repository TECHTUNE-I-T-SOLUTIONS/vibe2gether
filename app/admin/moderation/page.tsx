"use client"

import { useState, useEffect } from "react"
import { Search, Filter, MoreHorizontal, Trash2, Eye, CheckCircle, XCircle, Loader } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

interface Report {
  id: string
  reported_user_id: string
  reported_post_id?: string
  reason: string
  description: string
  status: string
  created_at: string
  updated_at: string
  reported_user?: any
  post?: any
}

interface ModerationStats {
  totalReports: number
  pendingReports: number
  approvedReports: number
  rejectedReports: number
}

export default function ModerationPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [stats, setStats] = useState<ModerationStats>({
    totalReports: 0,
    pendingReports: 0,
    approvedReports: 0,
    rejectedReports: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [reasonFilter, setReasonFilter] = useState("all")

  useEffect(() => {
    fetchReports()
  }, [statusFilter, reasonFilter])

  async function fetchReports() {
    try {
      const supabase = createClient()

      let query = supabase
        .from("reports")
        .select(
          `
          id,
          reported_user_id,
          reported_post_id,
          reason,
          description,
          status,
          created_at,
          updated_at,
          users(full_name, profile_picture, email),
          posts(content)
        `
        )

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter)
      }

      if (reasonFilter !== "all") {
        query = query.eq("reason", reasonFilter)
      }

      const { data, error } = await query.order("created_at", { ascending: false })

      if (!error && data) {
        const enrichedReports = data.map((report: any) => ({
          ...report,
          reported_user: report.users,
          post: report.posts,
        }))

        setReports(enrichedReports)

        // Calculate stats
        const total = enrichedReports.length
        const pending = enrichedReports.filter((r: any) => r.status === "pending").length
        const approved = enrichedReports.filter((r: any) => r.status === "approved").length
        const rejected = enrichedReports.filter((r: any) => r.status === "rejected").length

        setStats({
          totalReports: total,
          pendingReports: pending,
          approvedReports: approved,
          rejectedReports: rejected,
        })
      }
    } catch (error) {
      console.error("Error fetching reports:", error)
    } finally {
      setLoading(false)
    }
  }

  async function updateReportStatus(reportId: string, newStatus: string) {
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("reports")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", reportId)

      if (!error) {
        await fetchReports()
      }
    } catch (error) {
      console.error("Error updating report:", error)
    }
  }

  async function deleteReport(reportId: string) {
    if (!window.confirm("Are you sure you want to delete this report?")) return

    try {
      const supabase = createClient()
      const { error } = await supabase.from("reports").delete().eq("id", reportId)

      if (!error) {
        setReports((prev) => prev.filter((r) => r.id !== reportId))
      }
    } catch (error) {
      console.error("Error deleting report:", error)
    }
  }

  const filteredReports = reports.filter((report) =>
    searchQuery === "" ||
    report.reported_user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.reported_user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.reason?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const statItems = [
    { label: "Total Reports", value: stats.totalReports.toString(), change: "+5" },
    { label: "Pending", value: stats.pendingReports.toString(), change: "Review now" },
    { label: "Approved", value: stats.approvedReports.toString(), change: "Action taken" },
    { label: "Rejected", value: stats.rejectedReports.toString(), change: "Dismissed" },
  ]

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
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Moderation</h1>
        <p className="text-muted-foreground">Review and manage user reports and content violations</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statItems.map((stat, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold">{stat.value}</span>
                <span className="text-xs text-green-500">{stat.change}</span>
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
                placeholder="Search reports by user or reason..."
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
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={reasonFilter} onValueChange={setReasonFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reasons</SelectItem>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="harassment">Harassment</SelectItem>
                  <SelectItem value="inappropriate_content">Inappropriate Content</SelectItem>
                  <SelectItem value="hate_speech">Hate Speech</SelectItem>
                  <SelectItem value="scam">Scam</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Tabs defaultValue="all">
        <TabsList className="bg-muted/50 p-1 rounded-full mb-6">
          <TabsTrigger value="all" className="rounded-full">
            All ({reports.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="rounded-full">
            Pending ({stats.pendingReports})
          </TabsTrigger>
          <TabsTrigger value="approved" className="rounded-full">
            Approved ({stats.approvedReports})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card className="border-border/50">
            <CardContent className="p-0">
              {filteredReports.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  No reports found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left py-4 px-6 font-medium text-muted-foreground">Reported User</th>
                        <th className="text-left py-4 px-6 font-medium text-muted-foreground">Reason</th>
                        <th className="text-left py-4 px-6 font-medium text-muted-foreground">Description</th>
                        <th className="text-left py-4 px-6 font-medium text-muted-foreground">Status</th>
                        <th className="text-left py-4 px-6 font-medium text-muted-foreground">Date</th>
                        <th className="text-right py-4 px-6 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReports.slice(0, 100).map((report) => (
                        <tr
                          key={report.id}
                          className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={report.reported_user?.profile_picture} />
                                <AvatarFallback>{report.reported_user?.full_name?.[0] || "U"}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{report.reported_user?.full_name}</p>
                                <p className="text-xs text-muted-foreground">{report.reported_user?.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <Badge variant="secondary">{report.reason}</Badge>
                          </td>
                          <td className="py-4 px-6 text-sm text-muted-foreground max-w-xs truncate">
                            {report.description}
                          </td>
                          <td className="py-4 px-6">
                            <Badge
                              className={
                                report.status === "pending"
                                  ? "bg-yellow-500"
                                  : report.status === "approved"
                                    ? "bg-green-500"
                                    : "bg-red-500"
                              }
                            >
                              {report.status}
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-sm text-muted-foreground">
                            {new Date(report.created_at).toLocaleDateString()}
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
                                  View Details
                                </DropdownMenuItem>
                                {report.reported_post_id && (
                                  <DropdownMenuItem>
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Post
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                {report.status !== "approved" && (
                                  <DropdownMenuItem
                                    onClick={() => updateReportStatus(report.id, "approved")}
                                    className="text-green-600"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Approve
                                  </DropdownMenuItem>
                                )}
                                {report.status !== "rejected" && (
                                  <DropdownMenuItem
                                    onClick={() => updateReportStatus(report.id, "rejected")}
                                    className="text-orange-600"
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => deleteReport(report.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Report
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
