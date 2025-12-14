"use client"
import { Search, AlertTriangle, CheckCircle, XCircle, Eye, MessageCircle, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const reports = [
  {
    id: 1,
    type: "harassment",
    reporter: { name: "Emma R.", avatar: "/emma-woman-avatar.jpg" },
    reported: { name: "James C.", avatar: "/placeholder.svg?height=40&width=40" },
    reason: "Sending inappropriate messages repeatedly after being blocked",
    status: "pending",
    priority: "high",
    createdAt: "2 hours ago",
    evidence: "Screenshots attached",
  },
  {
    id: 2,
    type: "fake_profile",
    reporter: { name: "Sofia M.", avatar: "/placeholder.svg?height=40&width=40" },
    reported: { name: "Unknown User", avatar: "/placeholder.svg?height=40&width=40" },
    reason: "Profile uses stolen photos from Instagram celebrity",
    status: "pending",
    priority: "medium",
    createdAt: "5 hours ago",
    evidence: "Original profile links provided",
  },
  {
    id: 3,
    type: "spam",
    reporter: { name: "Marcus W.", avatar: "/placeholder.svg?height=40&width=40" },
    reported: { name: "Crypto Bot", avatar: "/placeholder.svg?height=40&width=40" },
    reason: "Sending crypto investment spam to multiple users",
    status: "resolved",
    priority: "low",
    createdAt: "1 day ago",
    evidence: "Message logs",
    resolution: "Account banned",
  },
  {
    id: 4,
    type: "inappropriate_content",
    reporter: { name: "Yuki T.", avatar: "/placeholder.svg?height=40&width=40" },
    reported: { name: "Anonymous", avatar: "/placeholder.svg?height=40&width=40" },
    reason: "Posted explicit content without proper tagging",
    status: "investigating",
    priority: "high",
    createdAt: "3 hours ago",
    evidence: "Post flagged for review",
  },
]

const stats = [
  { label: "Total Reports", value: "156", icon: AlertTriangle },
  { label: "Pending", value: "8", icon: Clock },
  { label: "Resolved Today", value: "23", icon: CheckCircle },
  { label: "Avg. Response", value: "2.4h", icon: Clock },
]

export default function AdminReportsPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Reports & Moderation</h1>
        <p className="text-muted-foreground">Review and resolve user reports</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <Card key={i} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filters */}
      <Card className="border-border/50 mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search reports..." className="pl-10" />
            </div>
            <div className="flex gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="harassment">Harassment</SelectItem>
                  <SelectItem value="fake_profile">Fake Profile</SelectItem>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="inappropriate_content">Inappropriate</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Priority" />
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
      <Tabs defaultValue="pending">
        <TabsList className="bg-muted/50 p-1 rounded-full mb-6">
          <TabsTrigger value="pending" className="rounded-full">
            Pending
            <Badge className="ml-2 bg-destructive">3</Badge>
          </TabsTrigger>
          <TabsTrigger value="investigating" className="rounded-full">
            Investigating
          </TabsTrigger>
          <TabsTrigger value="resolved" className="rounded-full">
            Resolved
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {reports
            .filter((r) => r.status === "pending")
            .map((report) => (
              <Card key={report.id} className="border-border/50">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <Badge
                          variant={report.priority === "high" ? "destructive" : "secondary"}
                          className={report.priority === "medium" ? "bg-orange-500 text-white" : ""}
                        >
                          {report.priority} priority
                        </Badge>
                        <Badge variant="outline">{report.type.replace("_", " ")}</Badge>
                        <span className="text-sm text-muted-foreground">{report.createdAt}</span>
                      </div>

                      <div className="flex items-center gap-6 mb-4">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={report.reporter.avatar || "/placeholder.svg"} />
                            <AvatarFallback>{report.reporter.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-xs text-muted-foreground">Reporter</p>
                            <p className="text-sm font-medium">{report.reporter.name}</p>
                          </div>
                        </div>
                        <div className="text-muted-foreground">→</div>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={report.reported.avatar || "/placeholder.svg"} />
                            <AvatarFallback>{report.reported.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-xs text-muted-foreground">Reported</p>
                            <p className="text-sm font-medium">{report.reported.name}</p>
                          </div>
                        </div>
                      </div>

                      <p className="text-foreground mb-2">{report.reason}</p>
                      <p className="text-sm text-muted-foreground">{report.evidence}</p>
                    </div>

                    <div className="flex lg:flex-col gap-2">
                      <Button className="gradient-bg rounded-full">
                        <Eye className="w-4 h-4 mr-2" />
                        Review
                      </Button>
                      <Button variant="outline" className="rounded-full bg-transparent">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Contact
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="investigating" className="space-y-4">
          {reports
            .filter((r) => r.status === "investigating")
            .map((report) => (
              <Card key={report.id} className="border-border/50 border-l-4 border-l-orange-500">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Badge className="bg-orange-500">Investigating</Badge>
                    <Badge variant="outline">{report.type.replace("_", " ")}</Badge>
                    <span className="text-sm text-muted-foreground">{report.createdAt}</span>
                  </div>
                  <p className="text-foreground mb-4">{report.reason}</p>
                  <div className="flex gap-2">
                    <Button variant="default" className="rounded-full bg-green-500 hover:bg-green-600">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Resolve
                    </Button>
                    <Button variant="destructive" className="rounded-full">
                      <XCircle className="w-4 h-4 mr-2" />
                      Take Action
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          {reports
            .filter((r) => r.status === "resolved")
            .map((report) => (
              <Card key={report.id} className="border-border/50 opacity-75">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Badge className="bg-green-500">Resolved</Badge>
                    <Badge variant="outline">{report.type.replace("_", " ")}</Badge>
                    <span className="text-sm text-muted-foreground">{report.createdAt}</span>
                  </div>
                  <p className="text-foreground mb-2">{report.reason}</p>
                  {report.resolution && (
                    <p className="text-sm text-green-600 font-medium">Resolution: {report.resolution}</p>
                  )}
                </CardContent>
              </Card>
            ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
