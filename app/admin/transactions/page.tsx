"use client"

import { useState, useEffect } from "react"
import { Search, Filter, MoreHorizontal, TrendingUp, Loader, X, Eye, Check, XCircle, RefreshCw, Mail } from "lucide-react"
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
  totalRevenueUSD: number
  totalRevenueNGN: number
  successfulTx: number
  pendingTx: number
  pendingAmountUSD: number
  pendingAmountNGN: number
  failedTx: number
}

// Conversion rate
const CONVERSION_RATE = 1450 // $1 = N1450
const KOBO_TO_NAIRA = 100 // 100 kobo = 1 Naira

// Normalize currency names
function normalizeCurrency(currency: string): "NGN" | "USD" {
  const normalized = currency?.toUpperCase() || "NGN"
  if (normalized === "US" || normalized === "NIGERIA") {
    return "USD"
  }
  return normalized === "USD" ? "USD" : "NGN"
}

// Convert amount from database format to naira
// NGN amounts are stored as plain naira (1500 = 1500 NGN)
// USD amounts are stored as cents of naira equivalent (1448550 cents = 14485.50 NGN)
// Event registration amounts are stored in NGN directly (not kobo)
function convertFromKobo(amount: number, currency: string, type?: string): number {
  if (type === "event_registration") {
    // Event registration amounts are stored in NGN directly, not kobo
    return amount
  }
  const normalized = normalizeCurrency(currency)

  if (normalized === "USD") {
    // USD amounts are in cents of naira equivalent, convert to naira
    return amount / 100
  } else {
    // NGN amounts are already in naira
    return amount
  }
}

// Convert amount to USD
function convertToUSD(amount: number, currency: string, type?: string): number {
  if (type === "event_registration") {
    // Event registration amounts are stored in NGN directly
    const base = amount
    return normalizeCurrency(currency) === "USD" ? base : base / CONVERSION_RATE
  }
  const normalizedCurrency = normalizeCurrency(currency)

  if (normalizedCurrency === "USD") {
    // USD: amount is in cents of naira, convert to naira first, then to USD
    const amountInNaira = amount / 100
    return amountInNaira / CONVERSION_RATE
  } else {
    // NGN: amount is already in naira
    return amount / CONVERSION_RATE
  }
}

// Convert amount to NGN
function convertToNGN(amount: number, currency: string, type?: string): number {
  if (type === "event_registration") {
    // Event registration amounts are stored in NGN directly
    const base = amount
    return normalizeCurrency(currency) === "NGN" ? base : base * CONVERSION_RATE
  }
  const normalizedCurrency = normalizeCurrency(currency)

  if (normalizedCurrency === "USD") {
    // USD: amount is in cents of naira, convert to naira
    return amount / 100
  } else {
    // NGN: already in naira
    return amount
  }
}

function formatCurrency(amount: number, currency: "USD" | "NGN" = "NGN") {
  if (currency === "USD") {
    return `$${amount.toFixed(2)}`
  }
  return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function getCurrencySymbol(currency: string): string {
  const normalized = normalizeCurrency(currency)
  return normalized === "USD" ? "$" : "₦"
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
    totalRevenueUSD: 0,
    totalRevenueNGN: 0,
    successfulTx: 0,
    pendingTx: 0,
    pendingAmountUSD: 0,
    pendingAmountNGN: 0,
    failedTx: 0,
  })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("all")
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [eventDetails, setEventDetails] = useState<any>(null)
  const [loadingEventDetails, setLoadingEventDetails] = useState(false)
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

        const totalRevenueUSD = completed.reduce((sum: number, t: any) => sum + convertToUSD(t.amount || 0, t.currency || "NGN", t.type), 0)
        const totalRevenueNGN = completed.reduce((sum: number, t: any) => sum + convertToNGN(t.amount || 0, t.currency || "NGN", t.type), 0)
        const pendingAmountUSD = pending.reduce((sum: number, t: any) => sum + convertToUSD(t.amount || 0, t.currency || "NGN", t.type), 0)
        const pendingAmountNGN = pending.reduce((sum: number, t: any) => sum + convertToNGN(t.amount || 0, t.currency || "NGN", t.type), 0)

        setStats({
          totalRevenue: totalRevenueUSD,
          totalRevenueUSD,
          totalRevenueNGN,
          successfulTx: completed.length,
          pendingTx: pending.length,
          pendingAmountUSD,
          pendingAmountNGN,
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

  const handleViewDetails = async (tx: Transaction) => {
    setSelectedTransaction(tx)
    setDetailsModalOpen(true)
    
    // Fetch event details if this is an event registration
    if (tx.type === "event_registration" && tx.metadata?.eventId) {
      setLoadingEventDetails(true)
      setEventDetails(null)
      try {
        const supabase = createClient()
        const { data: event, error } = await supabase
          .from("events")
          .select("*")
          .eq("id", tx.metadata.eventId)
          .single()
        
        if (!error && event) {
          setEventDetails(event)
        }
      } catch (error) {
        console.error("Error fetching event details:", error)
      } finally {
        setLoadingEventDetails(false)
      }
    } else {
      setEventDetails(null)
    }
  }

  const handleUpdateStatus = async (transaction: Transaction | "completed" | "failed", newStatus?: "completed" | "failed") => {
    // Handle both calling patterns: handleUpdateStatus(tx, "completed") and handleUpdateStatus("completed")
    let tx: Transaction
    let status: "completed" | "failed"

    if (typeof transaction === "string") {
      // Old pattern: handleUpdateStatus("completed")
      if (!selectedTransaction) return
      tx = selectedTransaction
      status = transaction
    } else {
      // New pattern: handleUpdateStatus(tx, "completed")
      tx = transaction
      status = newStatus || "completed"
    }

    setUpdatingStatus(true)
    try {
      const response = await fetch("/api/admin/transactions/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: tx.id,
          status: status
        })
      })

      const data = await response.json()
      if (!response.ok || data.error) throw new Error(data.error || "Failed to update status")

      // Update local state
      setTransactions(
        transactions.map((t) =>
          t.id === tx.id ? { ...t, status: status } : t
        )
      )

      // Update selected transaction if it's the same one
      if (selectedTransaction && selectedTransaction.id === tx.id) {
        setSelectedTransaction({ ...selectedTransaction, status: status })
      }

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

  const handleRefund = async (transaction?: Transaction) => {
    const tx = transaction || selectedTransaction
    if (!tx) return

    setUpdatingStatus(true)
    try {
      const supabase = createClient()

      // Create refund transaction
      const { error } = await supabase
        .from("transactions")
        .insert({
          user_id: tx.user_id,
          amount: tx.amount,
          type: `${tx.type}_refund`,
          status: "completed",
          payment_method: tx.payment_method,
          description: `Refund for transaction ${tx.id}`,
        })

      if (error) throw error

      // Mark original as refunded
      await supabase
        .from("transactions")
        .update({ status: "refunded", updated_at: new Date().toISOString() })
        .eq("id", tx.id)

      if (selectedTransaction && selectedTransaction.id === tx.id) {
        setSelectedTransaction({ ...selectedTransaction, status: "refunded" })
      }

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

  const handleResendTicket = async (tx: Transaction) => {
    if (!tx || tx.type !== "event_registration") return

    toast({
      title: "Sending...",
      description: "Generating and sending E-Ticket...",
    })

    try {
      const response = await fetch("/api/admin/resend-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: tx.id }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to resend ticket")

      toast({
        title: "Success",
        description: data.message || "E-Ticket sent successfully",
      })
    } catch (error) {
      console.error("Error resending ticket:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to resend ticket",
        variant: "destructive",
      })
    }
  }

  const statItems = [
    { 
      label: "Total Revenue", 
      value: formatCurrency(stats.totalRevenueUSD, "USD"),
      subValue: formatCurrency(stats.totalRevenueNGN, "NGN"),
      change: "+15%" 
    },
    { 
      label: "Successful", 
      value: stats.successfulTx.toString(),
      change: "+8%" 
    },
    { 
      label: "Pending Amount", 
      value: formatCurrency(stats.pendingAmountUSD, "USD"),
      subValue: formatCurrency(stats.pendingAmountNGN, "NGN"),
      change: "-2%" 
    },
    { 
      label: "Failed", 
      value: stats.failedTx.toString(),
      change: "+3%" 
    },
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
        {statItems.map((stat: any, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold">{stat.value}</span>
                <span className="text-sm text-green-500">{stat.change}</span>
              </div>
              {stat.subValue && (
                <p className="text-xs text-muted-foreground mt-1">{stat.subValue}</p>
              )}
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
                  <SelectItem value="premium_subscription">Subscription</SelectItem>
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
              <>
                                <div className="block md:hidden space-y-4 mb-4">
                  {filteredTransactions.slice(0, 100).map((tx: any) => (
                    <Card key={tx.id} className="p-4 flex flex-col gap-3 relative">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={tx.user?.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback>{tx.user?.full_name?.[0] || "U"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{tx.user?.full_name}</p>
                            <p className="text-xs text-muted-foreground break-all max-w-[200px] truncate">{tx.id}</p>
                          </div>
                        </div>
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
                            {tx.type === "event_registration" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-blue-600" onClick={() => handleResendTicket(tx)}>
                                  <Mail className="w-4 h-4 mr-2" />
                                  Send/Resend E-Ticket
                                </DropdownMenuItem>
                              </>
                            )}
                            {tx.status === "pending" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-green-600" onClick={() => handleUpdateStatus(tx, "completed")}>
                                  <Check className="w-4 h-4 mr-2" />
                                  Mark as Completed
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600" onClick={() => handleUpdateStatus(tx, "failed")}>
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Mark as Failed
                                </DropdownMenuItem>
                              </>
                            )}
                            {tx.status === "failed" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-blue-600" onClick={() => handleRefund(tx)}>
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  Refund
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">Amount</span>
                          <span className="font-semibold text-lg flex items-center gap-1">
                            {getCurrencySymbol(tx.currency)}
                            {convertFromKobo(tx.amount || 0, tx.currency || "NGN", tx.type).toLocaleString("en-NG", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-muted-foreground">Status</span>
                          <Badge className={`${getStatusColor(tx.status)} text-white mt-1`}>
                            {tx.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3 mt-1">
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                            {normalizeCurrency(tx.currency)}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px]">
                            {tx.type?.replace("_", " ")}
                          </Badge>
                        </div>
                        <span>{formatDate(tx.created_at)}</span>
                      </div>
                    </Card>
                  ))}
                </div>
                <div className="hidden md:block overflow-x-auto">
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
                              <div className="flex flex-col gap-0.5">
                                <span className="font-semibold">
                                  {getCurrencySymbol(tx.currency)}
                                  {convertFromKobo(tx.amount || 0, tx.currency || "NGN", tx.type).toLocaleString("en-NG", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {normalizeCurrency(tx.currency) === "USD" 
                                    ? formatCurrency(convertToNGN(tx.amount || 0, tx.currency, tx.type), "NGN")
                                    : formatCurrency(convertToUSD(tx.amount || 0, tx.currency, tx.type), "USD")
                                  }
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <Badge variant="outline" className="text-xs font-semibold">
                              {normalizeCurrency(tx.currency)}
                            </Badge>
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
                                {tx.type === "event_registration" && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-blue-600" onClick={() => handleResendTicket(tx)}>
                                      <Mail className="w-4 h-4 mr-2" />
                                      Send/Resend E-Ticket
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {tx.status === "pending" && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-green-600" onClick={() => handleUpdateStatus(tx, "completed")}>
                                      <Check className="w-4 h-4 mr-2" />
                                      Mark as Completed
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600" onClick={() => handleUpdateStatus(tx, "failed")}>
                                      <XCircle className="w-4 h-4 mr-2" />
                                      Mark as Failed
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {tx.status === "failed" && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-blue-600" onClick={() => handleRefund(tx)}>
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
              </>
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
              <>
                                <div className="block md:hidden space-y-4 mb-4">
                  {filteredTransactions.slice(0, 100).map((tx: any) => (
                    <Card key={tx.id} className="p-4 flex flex-col gap-3 relative">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={tx.user?.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback>{tx.user?.full_name?.[0] || "U"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{tx.user?.full_name}</p>
                            <p className="text-xs text-muted-foreground break-all max-w-[200px] truncate">{tx.id}</p>
                          </div>
                        </div>
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
                            {tx.type === "event_registration" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-blue-600" onClick={() => handleResendTicket(tx)}>
                                  <Mail className="w-4 h-4 mr-2" />
                                  Send/Resend E-Ticket
                                </DropdownMenuItem>
                              </>
                            )}
                            {tx.status === "pending" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-green-600" onClick={() => handleUpdateStatus(tx, "completed")}>
                                  <Check className="w-4 h-4 mr-2" />
                                  Mark as Completed
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600" onClick={() => handleUpdateStatus(tx, "failed")}>
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Mark as Failed
                                </DropdownMenuItem>
                              </>
                            )}
                            {tx.status === "failed" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-blue-600" onClick={() => handleRefund(tx)}>
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  Refund
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">Amount</span>
                          <span className="font-semibold text-lg flex items-center gap-1">
                            {getCurrencySymbol(tx.currency)}
                            {convertFromKobo(tx.amount || 0, tx.currency || "NGN", tx.type).toLocaleString("en-NG", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-muted-foreground">Status</span>
                          <Badge className={`${getStatusColor(tx.status)} text-white mt-1`}>
                            {tx.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3 mt-1">
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                            {normalizeCurrency(tx.currency)}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px]">
                            {tx.type?.replace("_", " ")}
                          </Badge>
                        </div>
                        <span>{formatDate(tx.created_at)}</span>
                      </div>
                    </Card>
                  ))}
                </div>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left py-4 px-6 font-medium text-muted-foreground">User</th>
                        <th className="text-left py-4 px-6 font-medium text-muted-foreground">Amount</th>
                        <th className="text-left py-4 px-6 font-medium text-muted-foreground">Currency</th>
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
                              <div className="flex flex-col gap-0.5">
                                <span className="font-semibold">
                                  {getCurrencySymbol(tx.currency)}
                                  {convertFromKobo(tx.amount || 0, tx.currency || "NGN", tx.type).toLocaleString("en-NG", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {normalizeCurrency(tx.currency) === "USD" 
                                    ? formatCurrency(convertToNGN(tx.amount || 0, tx.currency, tx.type), "NGN")
                                    : formatCurrency(convertToUSD(tx.amount || 0, tx.currency, tx.type), "USD")
                                  }
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <Badge variant="outline" className="text-xs font-semibold">
                              {normalizeCurrency(tx.currency)}
                            </Badge>
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
                                {tx.type === "event_registration" && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-blue-600" onClick={() => handleResendTicket(tx)}>
                                      <Mail className="w-4 h-4 mr-2" />
                                      Send/Resend E-Ticket
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
              </>
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
              <>
                                <div className="block md:hidden space-y-4 mb-4">
                  {filteredTransactions.slice(0, 100).map((tx: any) => (
                    <Card key={tx.id} className="p-4 flex flex-col gap-3 relative">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={tx.user?.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback>{tx.user?.full_name?.[0] || "U"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{tx.user?.full_name}</p>
                            <p className="text-xs text-muted-foreground break-all max-w-[200px] truncate">{tx.id}</p>
                          </div>
                        </div>
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
                            {tx.type === "event_registration" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-blue-600" onClick={() => handleResendTicket(tx)}>
                                  <Mail className="w-4 h-4 mr-2" />
                                  Send/Resend E-Ticket
                                </DropdownMenuItem>
                              </>
                            )}
                            {tx.status === "pending" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-green-600" onClick={() => handleUpdateStatus(tx, "completed")}>
                                  <Check className="w-4 h-4 mr-2" />
                                  Mark as Completed
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600" onClick={() => handleUpdateStatus(tx, "failed")}>
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Mark as Failed
                                </DropdownMenuItem>
                              </>
                            )}
                            {tx.status === "failed" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-blue-600" onClick={() => handleRefund(tx)}>
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  Refund
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">Amount</span>
                          <span className="font-semibold text-lg flex items-center gap-1">
                            {getCurrencySymbol(tx.currency)}
                            {convertFromKobo(tx.amount || 0, tx.currency || "NGN", tx.type).toLocaleString("en-NG", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-muted-foreground">Status</span>
                          <Badge className={`${getStatusColor(tx.status)} text-white mt-1`}>
                            {tx.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3 mt-1">
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                            {normalizeCurrency(tx.currency)}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px]">
                            {tx.type?.replace("_", " ")}
                          </Badge>
                        </div>
                        <span>{formatDate(tx.created_at)}</span>
                      </div>
                    </Card>
                  ))}
                </div>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left py-4 px-6 font-medium text-muted-foreground">User</th>
                        <th className="text-left py-4 px-6 font-medium text-muted-foreground">Amount</th>
                        <th className="text-left py-4 px-6 font-medium text-muted-foreground">Currency</th>
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
                              <div className="flex flex-col gap-0.5">
                                <span className="font-semibold">
                                  {getCurrencySymbol(tx.currency)}
                                  {convertFromKobo(tx.amount || 0, tx.currency || "NGN", tx.type).toLocaleString("en-NG", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {normalizeCurrency(tx.currency) === "USD" 
                                    ? formatCurrency(convertToNGN(tx.amount || 0, tx.currency, tx.type), "NGN")
                                    : formatCurrency(convertToUSD(tx.amount || 0, tx.currency, tx.type), "USD")
                                  }
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <Badge variant="outline" className="text-xs font-semibold">
                              {normalizeCurrency(tx.currency)}
                            </Badge>
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
                                {tx.type === "event_registration" && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-blue-600" onClick={() => handleResendTicket(tx)}>
                                      <Mail className="w-4 h-4 mr-2" />
                                      Send/Resend E-Ticket
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-green-600" onClick={() => handleUpdateStatus(tx, "completed")}>
                                  <Check className="w-4 h-4 mr-2" />
                                  Mark as Completed
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600" onClick={() => handleUpdateStatus(tx, "failed")}>
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
              </>
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
                  <p className="font-semibold text-lg">
                    {getCurrencySymbol(selectedTransaction.currency || "NGN")}
                    {convertFromKobo(selectedTransaction.amount || 0, selectedTransaction.currency || "NGN", selectedTransaction.type).toLocaleString("en-NG", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
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

              {/* Receipt Preview */}
              {selectedTransaction.metadata?.receiptUrl && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Uploaded Receipt</p>
                  <div className="border rounded-lg p-2 bg-muted/20">
                    <a href={selectedTransaction.metadata.receiptUrl} target="_blank" rel="noreferrer" className="block w-full max-w-sm">
                      <img src={selectedTransaction.metadata.receiptUrl} alt="Payment Receipt" className="w-full h-auto object-contain rounded border" />
                    </a>
                    <p className="text-xs text-muted-foreground mt-2 text-center">Click image to view full size</p>
                  </div>
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

              {/* Event Details */}
              {selectedTransaction.type === "event_registration" && selectedTransaction.metadata?.eventId && (
                <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                  <h3 className="font-semibold mb-2">Event Registration Details</h3>
                  
                  {loadingEventDetails ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : eventDetails ? (
                    <div className="space-y-4">
                      {/* Event Image */}
                      {eventDetails.thumbnail_url || eventDetails.thumbnail ? (
                        <div className="relative rounded-lg overflow-hidden">
                          <img 
                            src={eventDetails.thumbnail_url || eventDetails.thumbnail} 
                            alt={eventDetails.title}
                            className="w-full h-48 object-cover"
                          />
                        </div>
                      ) : null}
                      
                      {/* Event Info */}
                      <div className="space-y-2">
                        <div>
                          <p className="text-muted-foreground text-sm">Event Name</p>
                          <p className="font-semibold">{eventDetails.title}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-muted-foreground text-sm">Date</p>
                            <p className="text-sm">{new Date(eventDetails.event_date).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-sm">Time</p>
                            <p className="text-sm">{new Date(eventDetails.event_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-muted-foreground text-sm">Location</p>
                          <p className="text-sm">{eventDetails.location_name || eventDetails.location || "Online / TBD"}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Event ID</p>
                            <p className="font-mono text-xs break-all">{selectedTransaction.metadata.eventId}</p>
                          </div>
                          {selectedTransaction.metadata?.registration_id && (
                            <div>
                              <p className="text-muted-foreground">Registration ID</p>
                              <p className="font-mono text-xs break-all">{selectedTransaction.metadata.registration_id}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* View Event Button */}
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => window.open(`/events/${selectedTransaction.metadata.eventId}`, '_blank')}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Event Page
                      </Button>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      <p>Event ID: {selectedTransaction.metadata.eventId}</p>
                      {selectedTransaction.metadata?.registration_id && (
                        <p>Registration ID: {selectedTransaction.metadata.registration_id}</p>
                      )}
                      <Button 
                        variant="outline" 
                        className="w-full mt-2"
                        onClick={() => window.open(`/events/${selectedTransaction.metadata.eventId}`, '_blank')}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Event Page
                      </Button>
                    </div>
                  )}
                </div>
              )}

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
              
              {selectedTransaction.type === "event_registration" && (
                <Button
                  className="w-full mt-2 bg-blue-600 hover:bg-blue-700"
                  onClick={() => handleResendTicket(selectedTransaction)}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send/Resend E-Ticket
                </Button>
              )}

              {selectedTransaction.status === "failed" && (
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => handleRefund()}
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

