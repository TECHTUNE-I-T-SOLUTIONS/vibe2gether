"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, Clock, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AdminReportsPage() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("pending")

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch("/api/admin/reports")
        if (response.ok) {
          const data = await response.json()
          setReports(data.reports || [])
        }
      } catch (error) {
        console.error("Failed to fetch reports:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Reports & Moderation</h1>
        <p className="text-muted-foreground">Review and resolve user reports</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 p-1 rounded-full mb-6 w-full">
          <TabsTrigger value="pending" className="rounded-full">
            Pending
          </TabsTrigger>
          <TabsTrigger value="investigating" className="rounded-full">
            Investigating
          </TabsTrigger>
          <TabsTrigger value="resolved" className="rounded-full">
            Resolved
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {reports.filter((r: any) => r.status === "pending").length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No pending reports
              </CardContent>
            </Card>
          ) : (
            reports
              .filter((r: any) => r.status === "pending")
              .map((report: any) => (
                <Card key={report.id} className="border-border/50">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex gap-2 mb-3 flex-wrap">
                          <Badge>{report.type.replace("_", " ")}</Badge>
                          <Badge variant={report.priority === "high" ? "destructive" : "secondary"}>
                            {report.priority}
                          </Badge>
                        </div>
                        <p className="font-medium mb-2">{report.reason}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(report.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>

        <TabsContent value="investigating" className="space-y-4">
          {reports.filter((r: any) => r.status === "investigating").length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No investigating reports
              </CardContent>
            </Card>
          ) : (
            reports.filter((r: any) => r.status === "investigating").map((report: any) => (
              <Card key={report.id} className="border-l-4 border-l-orange-500">
                <CardContent className="p-4 md:p-6">
                  <Badge className="bg-orange-500 mb-2">{report.type}</Badge>
                  <p className="font-medium mb-2">{report.reason}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(report.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          {reports.filter((r: any) => r.status === "resolved").length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No resolved reports
              </CardContent>
            </Card>
          ) : (
            reports.filter((r: any) => r.status === "resolved").map((report: any) => (
              <Card key={report.id} className="opacity-75">
                <CardContent className="p-4 md:p-6">
                  <Badge className="bg-green-500 mb-2">Resolved</Badge>
                  <p className="font-medium mb-2">{report.reason}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(report.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
