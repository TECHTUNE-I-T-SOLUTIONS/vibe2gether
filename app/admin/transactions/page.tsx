"use client"

import { useState, useEffect } from "react"
import { Search, Filter, MoreHorizontal, TrendingUp, Loader, X, Eye, Check, XCircle, RefreshCw } from "lucide-react"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

interface Transaction {
  id: string
  user_id: string
  admin_id?: string
  amount: number
  type: string
  status: string
  payment_method?: string
  description?: string
  created_at?: string
  updated_at?: string
  user?: any
  currency?: string
}

interface TransactionStats {
  totalRevenue: number
  successfulTx: number
  pendingTx: number
  failedTx: number
}

function formatCurrency(amount: number) {
  return `₦${(amount || 0).toLocaleString()}`
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Unknown"
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

function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case "completed":
      return "bg-green-500"
    case "pending":
      return "bg-yellow-500"
    case "failed":
      return "bg-red-500"
    default:
      return "bg-gray-500"
  }
}

export default function AdminTransactionsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<TransactionStats>({
    totalRevenue: 0,
    successfulTx: 0,
    pendingTx: 0,
    failedTx: 0,
  })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("all")
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient()

        // Fetch all transactions (no status filter here)
        const { data: transactionData, error } = await supabase
          .from("transactions")
          .select("*, users(full_name, profile_picture)")
          .order("created_at", { ascending: false })

        if (error) throw error

        // Enrich with user data
        const enrichedTx = (transactionData || []).map((tx: any) => ({
          ...tx,
          user: {
            full_name: tx.users?.full_name || "Unknown User",
            avatar_url: tx.users?.profile_picture,
          },
        }))

        setTransactions(enrichedTx)

        // Calculate stats
        const completed = enrichedTx.filter((t: any) => t.status === "completed")
        const pending = enrichedTx.filter((t: any) => t.status === "pending")
        const failed = enrichedTx.filter((t: any) => t.status === "failed")

        const totalRevenue = completed.reduce((sum: number, t: any) => sum + (t.amount || 0), 0)

        setStats({
          totalRevenue,
          successfulTx: completed.length,
          pendingTx: pending.length,
          failedTx: failed.length,
        })
      } catch (error) {
        console.error("Error fetching transactions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredTransactions = transactions.filter((tx: any) => {
    const matchesSearch =
      searchQuery === "" ||
      tx.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.description?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = typeFilter === "all" || tx.type === typeFilter

    // Filter by active tab
    let matchesStatus = true
    if (activeTab === "completed") {
      matchesStatus = tx.status === "completed"
    } else if (activeTab === "pending") {
      matchesStatus = tx.status === "pending"
    }
    // For "all" tab, show all statuses

    return matchesSearch && matchesType && matchesStatus
  })

  const handleViewDetails = (tx: Transaction) => {
    setSelectedTransaction(tx)
    setDetailsModalOpen(true)
  }

  const handleUpdateStatus = async (newStatus: "completed" | "failed") => {
    if (!selectedTransaction) return

    setUpdatingStatus(true)
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from("transactions")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", selectedTransaction.id)

      if (error) throw error

      // Update local state
      setTransactions(
        transactions.map((tx) =>
          tx.id === selectedTransaction.id ? { ...tx, status: newStatus } : tx
        )
      )

      // Update selected transaction
      setSelectedTransaction({ ...selectedTransaction, status: newStatus })

      toast({
        title: "Success",
        description: `Transaction marked as ${newStatus}`,
      })
    } catch (error) {
      console.error("Error updating transaction:", error)
      toast({
        title: "Error",
        description: "Failed to update transaction",
        variant: "destructive",
      })
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleRefund = async () => {
    if (!selectedTransaction) return

    setUpdatingStatus(true)
    try {
      const supabase = createClient()

      // Create refund transaction
      const { error } = await supabase
        .from("transactions")
        .insert({
          user_id: selectedTransaction.user_id,
          amount: selectedTransaction.amount,
          type: `${selectedTransaction.type}_refund`,
          status: "completed",
          payment_method: selectedTransaction.payment_method,
          description: `Refund for transaction ${selectedTransaction.id}`,
        })

      if (error) throw error

      // Mark original as refunded
      await supabase
        .from("transactions")
        .update({ status: "refunded", updated_at: new Date().toISOString() })
        .eq("id", selectedTransaction.id)

      setSelectedTransaction({ ...selectedTransaction, status: "refunded" })

      toast({
        title: "Success",
        description: "Refund processed successfully",
      })
    } catch (error) {
      console.error("Error processing refund:", error)
      toast({
        title: "Error",
        description: "Failed to process refund",
        variant: "destructive",
      })
    } finally {
      setUpdatingStatus(false)
    }
  }

  const statItems = [
    { label: "Total Revenue", value: formatCurrency(stats.totalRevenue), change: "+15%" },
    { label: "Successful", value: stats.successfulTx.toString(), change: "+8%" },
    { label: "Pending", value: stats.pendingTx.toString(), change: "-2%" },
    { label: "Failed", value: stats.failedTx.toString(), change: "+3%" },
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
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Transactions</h1>
        <p className="text-muted-foreground">Track and manage platform transactions</p>
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
                placeholder="Search transactions by ID, user, or description..."
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
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="subscription">Subscription</SelectItem>
                  <SelectItem value="coin_purchase">Coin Purchase</SelectItem>
                  <SelectItem value="boost">Boost</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 p-1 rounded-full mb-6">
          <TabsTrigger value="all" className="rounded-full">
            All ({transactions.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="rounded-full">
            Completed ({stats.successfulTx})
          </TabsTrigger>
          <TabsTrigger value="pending" className="rounded-full">
            Pending ({stats.pendingTx})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card className="border-border/50">
            <CardContent className="p-0">
              {filteredTransactions.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  No transactions found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left py-4 px-6 font-medium text-muted-foreground">User</th>
                        <th className="text-left py-4 px-6 font-medium text-muted-foreground">Amount</th>
                        <th className="text-left py-4 px-6 font-medium text-muted-foreground">Type</th>
                        <th className="text-left py-4 px-6 font-medium text-muted-foreground">Status</th>
                        <th className="text-left py-4 px-6 font-medium text-muted-foreground">Date</th>
                        <th className="text-right py-4 px-6 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.slice(0, 100).map((tx: any) => (
                        <tr
                          key={tx.id}
                          className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={tx.user?.avatar_url || "/placeholder.svg"} />
                                <AvatarFallback>{tx.user?.full_name?.[0] || "U"}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{tx.user?.full_name}</p>
                                <p className="text-xs text-muted-foreground">{tx.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-4 h-4 text-green-500" />
                              <span className="font-semibold">{formatCurrency(tx.amount / 100)}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <Badge variant="secondary" className="text-xs">
                              {tx.type?.replace("_", " ")}
                            </Badge>
                          </td>
                          <td className="py-4 px-6">
                            <Badge className={`${getStatusColor(tx.status)} text-white text-xs`}>
                              {tx.status}
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-sm text-muted-foreground">
                            {formatDate(tx.created_at)}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewDetails(tx)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {tx.status === "pending" && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-green-600" onClick={() => handleUpdateStatus("completed")}>
                                      <Check className="w-4 h-4 mr-2" />
                                      Mark as Completed
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600" onClick={() => handleUpdateStatus("failed")}>
                                      <XCircle className="w-4 h-4 mr-2" />
                                      Mark as Failed
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {tx.status === "failed" && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-blue-600" onClick={handleRefund}>
                                      <RefreshCw className="w-4 h-4 mr-2" />
                                      Refund User
                                    </DropdownMenuItem>
                                  </>
                                )}
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

        <TabsContent value="completed">
          <Card className="border-border/50">
            <CardContent className="p-0">
              {filteredTransactions.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  No completed transactions found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left py-4 px-6 font-medium text-muted-foreground">User</th>
                        <th className="text-left py-4 px-6 font-medium text-muted-foreground">Amount</th>
                        <th className="text-left py-4 px-6 font-medium text-muted-foreground">Type</th>
                        <th className="text-left py-4 px-6 font-medium text-muted-foreground">Status</th>
                        <th className="text-left py-4 px-6 font-medium text-muted-foreground">Date</th>
                        <th className="text-right py-4 px-6 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.slice(0, 100).map((tx: any) => (
                        <tr
                          key={tx.id}
                          className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={tx.user?.avatar_url || "/placeholder.svg"} />
                                <AvatarFallback>{tx.user?.full_name?.[0] || "U"}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{tx.user?.full_name}</p>
                                <p className="text-xs text-muted-foreground">{tx.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-4 h-4 text-green-500" />
                              <span className="font-semibold">{formatCurrency(tx.amount / 100)}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <Badge variant="secondary" className="text-xs">
                              {tx.type?.replace("_", " ")}
                            </Badge>
                          </td>
                          <td className="py-4 px-6">
                            <Badge className={`${getStatusColor(tx.status)} text-white text-xs`}>
                              {tx.status}
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-sm text-muted-foreground">
                            {formatDate(tx.created_at)}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewDetails(tx)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
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

        <TabsContent value="pending">
          <Card className="border-border/50">
            <CardContent className="p-0">
              {filteredTransactions.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  No pending transactions found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left py-4 px-6 font-medium text-muted-foreground">User</th>
                        <th className="text-left py-4 px-6 font-medium text-muted-foreground">Amount</th>
                        <th className="text-left py-4 px-6 font-medium text-muted-foreground">Type</th>
                        <th className="text-left py-4 px-6 font-medium text-muted-foreground">Status</th>
                        <th className="text-left py-4 px-6 font-medium text-muted-foreground">Date</th>
                        <th className="text-right py-4 px-6 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.slice(0, 100).map((tx: any) => (
                        <tr
                          key={tx.id}
                          className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={tx.user?.avatar_url || "/placeholder.svg"} />
                                <AvatarFallback>{tx.user?.full_name?.[0] || "U"}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{tx.user?.full_name}</p>
                                <p className="text-xs text-muted-foreground">{tx.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-4 h-4 text-green-500" />
                              <span className="font-semibold">{formatCurrency(tx.amount / 100)}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <Badge variant="secondary" className="text-xs">
                              {tx.type?.replace("_", " ")}
                            </Badge>
                          </td>
                          <td className="py-4 px-6">
                            <Badge className={`${getStatusColor(tx.status)} text-white text-xs`}>
                              {tx.status}
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-sm text-muted-foreground">
                            {formatDate(tx.created_at)}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewDetails(tx)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-green-600" onClick={() => handleUpdateStatus("completed")}>
                                  <Check className="w-4 h-4 mr-2" />
                                  Mark as Completed
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600" onClick={() => handleUpdateStatus("failed")}>
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Mark as Failed
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

      {/* Transaction Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Transaction Details</span>
              <Badge className={getStatusColor(selectedTransaction?.status || "")} style={{ marginLeft: "auto" }}>
                {selectedTransaction?.status}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              ID: {selectedTransaction?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-6">
              {/* User Information */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-4">User Information</h3>
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={selectedTransaction.user?.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>{selectedTransaction.user?.full_name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedTransaction.user?.full_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedTransaction.user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-semibold text-lg">{formatCurrency(selectedTransaction.amount / 100)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-semibold">{selectedTransaction.type?.replace("_", " ")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="font-semibold">{selectedTransaction.payment_method || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Currency</p>
                  <p className="font-semibold">{selectedTransaction.currency || "NGN"}</p>
                </div>
              </div>

              {/* Description */}
              {selectedTransaction.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Description</p>
                  <p className="text-sm bg-muted/50 p-3 rounded">{selectedTransaction.description}</p>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Created</p>
                  <p>{formatDate(selectedTransaction.created_at)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Updated</p>
                  <p>{formatDate(selectedTransaction.updated_at)}</p>
                </div>
              </div>

              {/* Actions */}
              {selectedTransaction.status === "pending" && (
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleUpdateStatus("completed")}
                    disabled={updatingStatus}
                  >
                    {updatingStatus ? <Loader className="w-4 h-4 animate-spin mr-2" /> : null}
                    Mark as Completed
                  </Button>
                  <Button
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    onClick={() => handleUpdateStatus("failed")}
                    disabled={updatingStatus}
                  >
                    {updatingStatus ? <Loader className="w-4 h-4 animate-spin mr-2" /> : null}
                    Mark as Failed
                  </Button>
                </div>
              )}

              {selectedTransaction.status === "failed" && (
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={handleRefund}
                  disabled={updatingStatus}
                >
                  {updatingStatus ? <Loader className="w-4 h-4 animate-spin mr-2" /> : null}
                  Process Refund
                </Button>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

