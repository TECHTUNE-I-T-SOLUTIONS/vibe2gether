"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Check, X, Trash2, Star } from "lucide-react"

export default function AdminTestimoniesPage() {
  const { toast } = useToast()

  const [testimonies, setTestimonies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTestimony, setSelectedTestimony] = useState<any>(null)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [actingOnId, setActingOnId] = useState<string | null>(null)
  const [adminEmail, setAdminEmail] = useState<string>("")

  // Fetch all testimonies for admin review on mount
  useEffect(() => {
    fetchTestimonies()
    fetchAdminInfo()
  }, [])

  const fetchAdminInfo = async () => {
    try {
      const response = await fetch("/api/admin/auth/me")
      if (response.ok) {
        const data = await response.json()
        setAdminEmail(data.email || "")
      }
    } catch (error) {
      console.error("Failed to fetch admin info:", error)
    }
  }

  const fetchTestimonies = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/testimonies?status=all")
      if (response.ok) {
        const data = await response.json()
        setTestimonies(data.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch testimonies:", error)
      toast({
        title: "Error",
        description: "Failed to load testimonies",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    try {
      setActingOnId(id)
      const response = await fetch(`/api/testimonies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "approved",
          approved_by: adminEmail,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Testimony approved!",
        })
        fetchTestimonies()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve testimony",
        variant: "destructive",
      })
    } finally {
      setActingOnId(null)
    }
  }

  const handleReject = (testimony: any) => {
    setSelectedTestimony(testimony)
    setRejectionReason("")
    setShowApprovalDialog(true)
  }

  const submitRejection = async () => {
    try {
      setActingOnId(selectedTestimony.id)
      const response = await fetch(`/api/testimonies/${selectedTestimony.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "rejected",
          approval_notes: rejectionReason,
          approved_by: adminEmail,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Testimony rejected",
        })
        setShowApprovalDialog(false)
        setRejectionReason("")
        setSelectedTestimony(null)
        fetchTestimonies()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject testimony",
        variant: "destructive",
      })
    } finally {
      setActingOnId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this testimony?")) return

    try {
      setActingOnId(id)
      const response = await fetch(`/api/testimonies/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Testimony deleted",
        })
        fetchTestimonies()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete testimony",
        variant: "destructive",
      })
    } finally {
      setActingOnId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  const pendingTestimonies = testimonies.filter((t) => t.status === "pending")
  const approvedTestimonies = testimonies.filter((t) => t.status === "approved")
  const rejectedTestimonies = testimonies.filter((t) => t.status === "rejected")

  // Show loading while session is being checked
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  // Show nothing while redirecting if not authenticated
  if (status === "unauthenticated") {
    return null
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Testimonies Management</h1>
        <p className="text-muted-foreground">Review and approve/reject user testimonies</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Pending Testimonies */}
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold mb-4">
                Pending Review ({pendingTestimonies.length})
              </h2>
              {pendingTestimonies.length === 0 ? (
                <p className="text-muted-foreground">No pending testimonies</p>
              ) : (
                <div className="grid gap-4">
                  {pendingTestimonies.map((testimony) => (
                    <Card key={testimony.id} className="border-yellow-200 dark:border-yellow-700 bg-yellow-50/50 dark:bg-yellow-900/50">
                      <CardContent className="p-6 space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={testimony.user_avatar_url} />
                                <AvatarFallback>
                                  {testimony.user_name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold">{testimony.user_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {testimony.user_location}
                                </p>
                              </div>
                            </div>

                            <h3 className="font-semibold text-lg mb-2">{testimony.title}</h3>

                            <div className="flex items-center gap-2 mb-3">
                              <div className="flex gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < testimony.rating
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-muted-foreground"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm">({testimony.rating}/5)</span>
                            </div>

                            <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                              {testimony.content}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              Submitted on {new Date(testimony.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className={getStatusColor(testimony.status)}>
                            {testimony.status}
                          </Badge>
                        </div>

                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            onClick={() => handleApprove(testimony.id)}
                            disabled={actingOnId === testimony.id}
                            className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
                          >
                            {actingOnId === testimony.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleReject(testimony)}
                            disabled={actingOnId === testimony.id}
                            variant="destructive"
                            className="flex-1 gap-2"
                          >
                            {actingOnId === testimony.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                            Reject
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Approved Testimonies */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Approved ({approvedTestimonies.length})</h2>
            {approvedTestimonies.length === 0 ? (
              <p className="text-muted-foreground">No approved testimonies yet</p>
            ) : (
              <div className="grid gap-4">
                {approvedTestimonies.map((testimony) => (
                  <Card key={testimony.id} className="border-green-200 dark:border-green-700 bg-green-50/50 dark:bg-green-900/50">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={testimony.user_avatar_url} />
                              <AvatarFallback>
                                {testimony.user_name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold">{testimony.user_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {testimony.user_location}
                              </p>
                            </div>
                          </div>

                          <h3 className="font-semibold text-lg mb-2">{testimony.title}</h3>

                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < testimony.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-muted-foreground"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm">({testimony.rating}/5)</span>
                          </div>

                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {testimony.content}
                          </p>
                        </div>
                        <Button
                          onClick={() => handleDelete(testimony.id)}
                          disabled={actingOnId === testimony.id}
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:bg-red-50"
                        >
                          {actingOnId === testimony.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Rejected Testimonies */}
          {rejectedTestimonies.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Rejected ({rejectedTestimonies.length})</h2>
              <div className="grid gap-4">
                {rejectedTestimonies.map((testimony) => (
                  <Card key={testimony.id} className="border-red-200 bg-red-50/50 opacity-75">
                    <CardContent className="p-6 space-y-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={testimony.user_avatar_url} />
                          <AvatarFallback>
                            {testimony.user_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold">{testimony.user_name}</p>
                          <p className="text-sm text-muted-foreground">{testimony.title}</p>
                        </div>
                        <Button
                          onClick={() => handleDelete(testimony.id)}
                          disabled={actingOnId === testimony.id}
                          variant="ghost"
                          size="sm"
                        >
                          {actingOnId === testimony.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      {testimony.approval_notes && (
                        <p className="text-sm text-red-700">
                          Reason: {testimony.approval_notes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Rejection Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Testimony</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="font-medium mb-2">Testimony Title</p>
              <p className="text-muted-foreground">{selectedTestimony?.title}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Reason for Rejection</label>
              <Textarea
                placeholder="Provide feedback to the user about why their testimony was not approved..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowApprovalDialog(false)
                setRejectionReason("")
                setSelectedTestimony(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={submitRejection}
              disabled={!rejectionReason.trim() || actingOnId === selectedTestimony?.id}
            >
              {actingOnId === selectedTestimony?.id ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Reject"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
