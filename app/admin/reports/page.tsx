"use client"

import { useState, useEffect } from "react"
import { Search, AlertTriangle, CheckCircle, Eye, MessageCircle, Clock, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Report {
  id: string
  type: string
  reporter?: {
    id: string
    full_name: string
    avatar_url?: string
  }
  reported?: {
    id: string
    full_name: string
    avatar_url?: string
  }
  reason: string
  status: string
  priority: string
  created_at: string
}

interface Stats {
  total: number
  pending: number
  resolved: number
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    resolved: 0,
  })
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    fetchReports()
  }, [filterStatus, filterPriority])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterStatus !== "all") params.append("status", filterStatus)
      if (filterPriority !== "all") params.append("priority", filterPriority)

      const response = await fetch(`/api/admin/reports?${params}`)
      if (response.ok) {
        const data = await response.json()
        setReports(data.reports || [])
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredReports = reports.filter((report) => {
    if (searchQuery && !report.reason.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (activeTab !== "all" && report.status !== activeTab) {
      return false
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

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Reports & Moderation</h1>
        <p className="text-muted-foreground">Review and manage user reports</p>
      </div>

      {/* Stats Cards */}
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

      {/* Filters */}
      <Card className="border-border/50 mb-6">
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
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

            {/* Status Filter */}
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

            {/* Priority Filter */}
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

      {/* Reports Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 p-1 rounded-lg mb-6 grid grid-cols-4 w-full">
          <TabsTrigger value="all" className="rounded">
            All
          </TabsTrigger>
          <TabsTrigger value="pending" className="rounded">
            Pending ({stats.pending})
          </TabsTrigger>
          <TabsTrigger value="investigating" className="rounded">
            Investigating
          </TabsTrigger>
          <TabsTrigger value="resolved" className="rounded">
            Resolved
          </TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredReports.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="p-12 text-center">
              <AlertTriangle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No reports found</p>
            </CardContent>
          </Card>
        ) : (
          <TabsContent value={activeTab} className="space-y-4">
            {filteredReports.map((report) => (
              <Card key={report.id} className="border-border/50 hover:border-border/80 transition-colors">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* Left Section */}
                    <div className="flex-1 min-w-0">
                      {/* Badges */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge className={`${getPriorityColor(report.priority)} text-white`}>
                          {report.priority?.charAt(0).toUpperCase() + report.priority?.slice(1)} Priority
                        </Badge>
                        <Badge className={`${getStatusColor(report.status)} text-white`}>
                          {report.status?.charAt(0).toUpperCase() + report.status?.slice(1)}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {report.type?.replace(/_/g, " ")}
                        </Badge>
                      </div>

                      {/* Reporter and Reported User */}
                      {(report.reporter || report.reported) && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 pb-4 border-b border-border/30">
                          {report.reporter && (
                            <div className="flex items-center gap-2">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={report.reporter.avatar_url} />
                                <AvatarFallback>{report.reporter.full_name?.[0]}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-xs text-muted-foreground">Reporter</p>
                                <p className="text-sm font-medium truncate">{report.reporter.full_name}</p>
                              </div>
                            </div>
                          )}

                          {report.reported && (
                            <>
                              <span className="hidden sm:block text-muted-foreground">→</span>
                              <div className="flex items-center gap-2">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={report.reported.avatar_url} />
                                  <AvatarFallback>{report.reported.full_name?.[0]}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="text-xs text-muted-foreground">Reported</p>
                                  <p className="text-sm font-medium truncate">{report.reported.full_name}</p>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* Report Reason */}
                      <p className="text-foreground font-medium mb-2">{report.reason}</p>

                      {/* Date */}
                      <p className="text-xs text-muted-foreground">
                        {new Date(report.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    {/* Right Section - Actions */}
                    <div className="flex flex-col gap-2 w-full lg:w-auto">
                      <Button className="gradient-bg w-full lg:w-32" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Review</span>
                        <span className="sm:hidden">View</span>
                      </Button>
                      <Button variant="outline" className="w-full lg:w-32" size="sm">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Contact</span>
                        <span className="sm:hidden">Chat</span>
                      </Button>
                      {report.status?.toLowerCase() !== "resolved" && (
                        <Button className="bg-green-600 hover:bg-green-700 w-full lg:w-32" size="sm">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          <span className="hidden sm:inline">Resolve</span>
                          <span className="sm:hidden">Done</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
