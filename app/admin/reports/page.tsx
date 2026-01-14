"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, AlertTriangle, CheckCircle, Eye, MessageCircle, Clock, Loader2, Flag, FileText } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PostDetailsModal } from "@/components/admin-post-details-modal"
import { InvestigateReportModal } from "@/components/admin-investigate-modal"
import { ResolveReportModal } from "@/components/admin-resolve-modal"

interface Report {
  id: string
  type: string
  reporter?: { id: string; full_name: string; avatar_url?: string }
  reported?: { id: string; full_name: string; avatar_url?: string }
  reason: string
  status: string
  priority: string
  created_at: string
}

interface PostReport {
  id: string
  post_id: string
  reporter_id: string
  reason: string
  description?: string
  status: string
  priority: string
  created_at: string
  posts?: { id: string; user_id: string; content: string }
}

interface Stats {
  total: number
  pending: number
  resolved: number
}

export default function AdminReportsPage() {
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [postReports, setPostReports] = useState<PostReport[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, resolved: 0 })
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("users")

  // Modal states
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showInvestigateModal, setShowInvestigateModal] = useState(false)
  const [showResolveModal, setShowResolveModal] = useState(false)

  useEffect(() => {
    fetchReports()
  }, [filterStatus, filterPriority, activeTab])

  const fetchReports = async () => {
    try {
      setLoading(true)
      if (activeTab === "posts") {
        const params = new URLSearchParams()
        if (filterStatus !== "all") params.append("status", filterStatus)
        if (filterPriority !== "all") params.append("priority", filterPriority)
        if (searchQuery) params.append("search", searchQuery)
        const response = await fetch(`/api/posts/report?${params}`)
        if (response.ok) {
          const data = await response.json()
          setPostReports(data.reports || [])
          setStats(data.stats)
        }
      } else {
        const params = new URLSearchParams()
        if (filterStatus !== "all") params.append("status", filterStatus)
        if (filterPriority !== "all") params.append("priority", filterPriority)
        const response = await fetch(`/api/admin/reports?${params}`)
        if (response.ok) {
          const data = await response.json()
          setReports(data.reports || [])
          setStats(data.stats)
        }
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error)
    } finally {
      setLoading(false)
    }
  }

  const currentReports = activeTab === "posts" ? postReports : reports
  const filteredReports = currentReports.filter((report: any) => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase()
      if (activeTab === "posts") {
        return (
          report.reason?.toLowerCase().includes(searchLower) ||
          report.description?.toLowerCase().includes(searchLower) ||
          report.posts?.content?.toLowerCase().includes(searchLower)
        )
      } else {
        return report.reason?.toLowerCase().includes(searchLower)
      }
    }
    return true
  })

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-orange-500"
      case "low":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-500"
      case "investigating":
        return "bg-orange-500"
      case "resolved":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const handleReview = (report: any) => {
    setSelectedReport(report)
    setShowDetailsModal(true)
  }

  const handleInvestigate = (report: any) => {
    setSelectedReport(report)
    setShowInvestigateModal(true)
  }

  const handleResolve = (report: any) => {
    setSelectedReport(report)
    setShowResolveModal(true)
  }

  const handleChatWithUser = (userId: string, userName: string) => {
    // Navigate to admin messages page with user ID parameter
    router.push(`/admin/messages?user=${userId}`)
  }

  const handleReportRefresh = () => {
    fetchReports()
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 w-full max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Reports & Moderation</h1>
        <p className="text-muted-foreground">Review and manage user and post reports</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Reports</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pending</p>
                <p className="text-3xl font-bold">{stats.pending}</p>
              </div>
              <div className="bg-yellow-500/10 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Resolved</p>
                <p className="text-3xl font-bold">{stats.resolved}</p>
              </div>
              <div className="bg-green-500/10 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 mb-6">
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search reports..."
                  className="pl-10 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Priority</label>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted/50 p-1 rounded-lg mb-6 grid grid-cols-2 w-full md:w-auto">
          <TabsTrigger value="users" className="rounded flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">User Reports</span>
            <span className="sm:hidden">Users</span>
          </TabsTrigger>
          <TabsTrigger value="posts" className="rounded flex items-center gap-2">
            <Flag className="w-4 h-4" />
            <span className="hidden sm:inline">Post Reports</span>
            <span className="sm:hidden">Posts</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredReports.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="p-12 text-center">
                <AlertTriangle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">No user reports found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredReports.map((report: any) => (
                <Card key={report.id} className="border-border/50">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex gap-2 mb-2">
                          <Badge className={`${getPriorityColor(report.priority)} text-white`}>
                            {report.priority?.toUpperCase()}
                          </Badge>
                          <Badge className={`${getStatusColor(report.status)} text-white`}>
                            {report.status?.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="font-medium">{report.reason}</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          {new Date(report.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button className="gradient-bg">Review</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="posts">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredReports.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="p-12 text-center">
                <Flag className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">No post reports found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredReports.map((report: any) => (
                <Card key={report.id} className="border-border/50">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex gap-2 mb-2">
                          <Badge className={`${getPriorityColor(report.priority)} text-white`}>
                            {report.priority?.toUpperCase()}
                          </Badge>
                          <Badge className={`${getStatusColor(report.status)} text-white`}>
                            {report.status?.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">Post Report</Badge>
                        </div>

                        {report.posts && (
                          <div className="mb-3 p-2 bg-muted rounded">
                            <p className="text-xs text-muted-foreground mb-1">Post Content</p>
                            <p className="text-sm line-clamp-2">{report.posts.content}</p>
                          </div>
                        )}

                        <p className="font-medium">Reason: {report.reason?.replace(/_/g, " ")}</p>
                        {report.description && <p className="text-sm text-muted-foreground mt-1">{report.description}</p>}
                        <p className="text-sm text-muted-foreground mt-2">
                          {new Date(report.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          className="gradient-bg"
                          size="sm"
                          onClick={() => handleReview(report)}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Review
                        </Button>
                        {report.status?.toLowerCase() !== "resolved" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleInvestigate(report)}
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Investigate
                            </Button>
                            <Button
                              className="bg-green-600 hover:bg-green-700"
                              size="sm"
                              onClick={() => handleResolve(report)}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Resolve
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {selectedReport && (
        <>
          <PostDetailsModal
            open={showDetailsModal}
            onOpenChange={setShowDetailsModal}
            report={selectedReport}
            onChatWithAuthor={() => {
              setShowDetailsModal(false)
              handleChatWithUser(selectedReport.posts?.user_id, "Post Author")
            }}
            onChatWithReporter={() => {
              setShowDetailsModal(false)
              handleChatWithUser(selectedReport.reporter_id, "Reporter")
            }}
          />

          <InvestigateReportModal
            open={showInvestigateModal}
            onOpenChange={setShowInvestigateModal}
            reportId={selectedReport.id}
            currentStatus={selectedReport.status}
            currentNotes={selectedReport.admin_notes || ""}
            onSuccess={handleReportRefresh}
          />

          <ResolveReportModal
            open={showResolveModal}
            onOpenChange={setShowResolveModal}
            reportId={selectedReport.id}
            currentNotes={selectedReport.admin_notes || ""}
            onSuccess={handleReportRefresh}
          />
        </>
      )}
    </div>
  )
}
