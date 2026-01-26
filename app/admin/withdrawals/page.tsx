"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, CheckCircle2, XCircle, Clock, DollarSign } from "lucide-react"

interface WithdrawalRequest {
  id: string
  user_id: string
  amount: number
  requested_coins: number
  bank_code: string
  bank_name: string
  account_number: string
  account_name: string
  status: "pending" | "approved" | "rejected" | "settled"
  notes?: string
  created_at: string
  updated_at: string
  user?: {
    display_name: string
    email: string
  }
}

export default function WithdrawalsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null)
  const [showActionDialog, setShowActionDialog] = useState(false)
  const [actionType, setActionType] = useState<"approve" | "reject" | "settle" | null>(null)
  const [notes, setNotes] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("pending")

  useEffect(() => {
    fetchWithdrawals()
  }, [])

  const fetchWithdrawals = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/withdrawals")
      const data = await response.json()

      if (data.success) {
        setWithdrawals(data.withdrawals)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch withdrawal requests",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to fetch withdrawals:", error)
      toast({
        title: "Error",
        description: "Failed to fetch withdrawal requests",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async () => {
    if (!selectedWithdrawal || !actionType) return

    try {
      setActionLoading(true)
      const response = await fetch(`/api/admin/withdrawals/${selectedWithdrawal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: actionType === "approve" ? "approved" : actionType === "reject" ? "rejected" : "settled",
          notes,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: `Withdrawal request ${actionType}ed successfully`,
        })
        await fetchWithdrawals()
        setShowActionDialog(false)
        setSelectedWithdrawal(null)
        setNotes("")
        setActionType(null)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update withdrawal request",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Action error:", error)
      toast({
        title: "Error",
        description: "Failed to update withdrawal request",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const openActionDialog = (withdrawal: WithdrawalRequest, type: "approve" | "reject" | "settle") => {
    setSelectedWithdrawal(withdrawal)
    setActionType(type)
    setNotes("")
    setShowActionDialog(true)
  }

  const filterWithdrawals = (status: string) => {
    if (status === "all") return withdrawals
    return withdrawals.filter((w) => w.status === status)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "approved":
        return <CheckCircle2 className="h-4 w-4 text-blue-600" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "settled":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-200"
      case "approved":
        return "bg-blue-500/10 text-blue-700 border-blue-200"
      case "rejected":
        return "bg-red-500/10 text-red-700 border-red-200"
      case "settled":
        return "bg-green-500/10 text-green-700 border-green-200"
      default:
        return ""
    }
  }

  const stats = {
    pending: withdrawals.filter((w) => w.status === "pending").length,
    approved: withdrawals.filter((w) => w.status === "approved").length,
    rejected: withdrawals.filter((w) => w.status === "rejected").length,
    settled: withdrawals.filter((w) => w.status === "settled").length,
    totalAmount: withdrawals.reduce((sum, w) => sum + w.amount, 0),
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Withdrawal Requests</h1>
        <p className="text-muted-foreground mt-1">Manage user withdrawal requests</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">Approved</p>
              <p className="text-2xl font-bold text-blue-600">{stats.approved}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">Settled</p>
              <p className="text-2xl font-bold text-green-600">{stats.settled}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">Total Amount</p>
              <p className="text-2xl font-bold">${stats.totalAmount.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawals List */}
      <Card>
        <CardHeader>
          <CardTitle>All Withdrawal Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
              <TabsTrigger value="pending">
                Pending {stats.pending > 0 && <Badge className="ml-2">{stats.pending}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved {stats.approved > 0 && <Badge className="ml-2">{stats.approved}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="settled">
                Settled {stats.settled > 0 && <Badge className="ml-2">{stats.settled}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected {stats.rejected > 0 && <Badge className="ml-2">{stats.rejected}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>

            {["pending", "approved", "settled", "rejected", "all"].map((tab) => (
              <TabsContent key={tab} value={tab} className="space-y-4">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : filterWithdrawals(tab).length > 0 ? (
                  <div className="space-y-3">
                    {filterWithdrawals(tab).map((withdrawal) => (
                      <div
                        key={withdrawal.id}
                        className="border border-border/50 rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {getStatusIcon(withdrawal.status)}
                              <div>
                                <p className="font-medium">{withdrawal.user?.display_name || "Unknown User"}</p>
                                <p className="text-sm text-muted-foreground">{withdrawal.user?.email}</p>
                              </div>
                              <Badge className={`ml-auto ${getStatusColor(withdrawal.status)}`}>
                                {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                              <div>
                                <p className="text-muted-foreground">Amount</p>
                                <p className="font-medium">
                                  ${withdrawal.amount.toFixed(2)} USD
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {(withdrawal.amount * 1450).toLocaleString()} NGN
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Coins</p>
                                <p className="font-medium">{withdrawal.requested_coins.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Bank</p>
                                <p className="font-medium">{withdrawal.bank_name}</p>
                                <p className="text-xs">{withdrawal.account_number}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Account Name</p>
                                <p className="font-medium">{withdrawal.account_name}</p>
                              </div>
                            </div>

                            <div className="mt-3 text-xs text-muted-foreground">
                              Requested: {new Date(withdrawal.created_at).toLocaleString()}
                            </div>

                            {withdrawal.notes && (
                              <div className="mt-3 p-2 bg-muted/50 rounded text-sm">
                                <p className="text-muted-foreground">Admin Notes:</p>
                                <p>{withdrawal.notes}</p>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          {withdrawal.status === "pending" && (
                            <div className="flex flex-col gap-2">
                              <Button
                                size="sm"
                                onClick={() => openActionDialog(withdrawal, "approve")}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => openActionDialog(withdrawal, "reject")}
                              >
                                Reject
                              </Button>
                            </div>
                          )}

                          {withdrawal.status === "approved" && (
                            <Button
                              size="sm"
                              onClick={() => openActionDialog(withdrawal, "settle")}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Mark Settled
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No {tab === "all" ? "" : tab} withdrawal requests</p>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" && "Approve Withdrawal"}
              {actionType === "reject" && "Reject Withdrawal"}
              {actionType === "settle" && "Mark as Settled"}
            </DialogTitle>
          </DialogHeader>

          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-3 rounded text-sm space-y-2">
                <div className="flex justify-between">
                  <span>User:</span>
                  <span className="font-medium">{selectedWithdrawal.user?.display_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-medium">${selectedWithdrawal.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bank:</span>
                  <span className="font-medium">{selectedWithdrawal.bank_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Account:</span>
                  <span className="font-medium">{selectedWithdrawal.account_number}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add admin notes for this request..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-24"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={actionLoading}
              className={
                actionType === "approve"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : actionType === "settle"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
              }
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {actionType === "approve" && "Approve"}
                  {actionType === "reject" && "Reject"}
                  {actionType === "settle" && "Mark Settled"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
