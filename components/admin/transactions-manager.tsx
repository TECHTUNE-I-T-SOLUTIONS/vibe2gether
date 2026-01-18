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
import { Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { useAdminAuth } from "@/hooks/use-admin-auth"

interface Transaction {
  id: string
  user_id: string
  amount: number
  currency: string
  type: string
  status: "pending" | "completed" | "failed"
  payment_method: string
  created_at: string
  metadata?: Record<string, any>
}

interface ApiResponse {
  transactions: Transaction[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

export function AdminTransactionsManager() {
  const { isAuthenticated } = useAdminAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [status, setStatus] = useState("all")
  const [stats, setStats] = useState({
    total_revenue_usd: 0,
    total_revenue_ngn: 0,
    pending_amount_usd: 0,
    pending_amount_ngn: 0,
    marketplace_count: 0,
    event_count: 0,
  })
  const [totalPages, setTotalPages] = useState(1)

  // Conversion rate
  const CONVERSION_RATE = 1450 // $1 = N1450
  const KOBO_TO_NAIRA = 100 // 100 kobo = 1 Naira

  // Normalize currency names
  const normalizeCurrency = (currency: string): "NGN" | "USD" => {
    const normalized = currency?.toUpperCase() || "NGN"
    if (normalized === "US" || normalized === "NIGERIA") {
      return "USD"
    }
    return normalized === "USD" ? "USD" : "NGN"
  }

  // Convert amount from kobo to proper currency unit
  const convertFromKobo = (amount: number, currency: string): number => {
    const normalizedCurrency = normalizeCurrency(currency)
    // Amounts are stored in kobo, convert to actual currency
    return amount / KOBO_TO_NAIRA
  }

  // Convert amount to USD
  const convertToUSD = (amount: number, currency: string): number => {
    const normalizedCurrency = normalizeCurrency(currency)
    const amountInUnit = convertFromKobo(amount, currency)
    
    if (normalizedCurrency === "USD") {
      return amountInUnit
    }
    // Convert NGN to USD
    return amountInUnit / CONVERSION_RATE
  }

  // Convert amount to NGN
  const convertToNGN = (amount: number, currency: string): number => {
    const normalizedCurrency = normalizeCurrency(currency)
    const amountInUnit = convertFromKobo(amount, currency)
    
    if (normalizedCurrency === "NGN") {
      return amountInUnit
    }
    // Convert USD to NGN
    return amountInUnit * CONVERSION_RATE
  }

  const calculateStats = (txns: Transaction[]) => {
    const completed = txns.filter((t) => t.status === "completed")
    const pending = txns.filter((t) => t.status === "pending")
    
    const totalRevenueUSD = completed.reduce((sum, t) => sum + convertToUSD(t.amount, t.currency), 0)
    const totalRevenueNGN = completed.reduce((sum, t) => sum + convertToNGN(t.amount, t.currency), 0)
    const pendingUSD = pending.reduce((sum, t) => sum + convertToUSD(t.amount, t.currency), 0)
    const pendingNGN = pending.reduce((sum, t) => sum + convertToNGN(t.amount, t.currency), 0)

    return {
      total_revenue_usd: totalRevenueUSD,
      total_revenue_ngn: totalRevenueNGN,
      pending_amount_usd: pendingUSD,
      pending_amount_ngn: pendingNGN,
      marketplace_count: txns.filter((t) => t.type === "marketplace_purchase").length,
      event_count: txns.filter((t) => t.type === "event_registration").length,
    }
  }

  const fetchTransactions = async () => {
    if (!isAuthenticated) return

    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(status !== "all" && { status }),
      })

      const res = await fetch(`/api/admin/transactions?${params}`)
      if (!res.ok) throw new Error("Failed to fetch transactions")

      const data: ApiResponse = await res.json()
      setTransactions(data.transactions || [])
      setTotalPages(data.pagination.pages)
      
      // Calculate stats from all completed transactions for better accuracy
      // Fetch all completed transactions for stats
      const statsRes = await fetch(`/api/admin/transactions?limit=1000&status=completed`)
      if (statsRes.ok) {
        const statsData: ApiResponse = await statsRes.json()
        setAllTransactions(statsData.transactions || [])
        setStats(calculateStats(statsData.transactions || []))
      } else {
        setStats(calculateStats(data.transactions || []))
      }
    } catch (error) {
      console.error("[AdminTransactionsManager] Error fetching transactions:", error)
      setTransactions([])
      setStats({
        total_revenue_usd: 0,
        total_revenue_ngn: 0,
        pending_amount_usd: 0,
        pending_amount_ngn: 0,
        marketplace_count: 0,
        event_count: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchTransactions()
    }
  }, [page, status, isAuthenticated])

  const formatCurrency = (amount: number, currency: "USD" | "NGN" = "NGN") => {
    if (currency === "USD") {
      return `$${amount.toFixed(2)}`
    }
    return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const getCurrencySymbol = (currency: string): string => {
    const normalized = normalizeCurrency(currency)
    return normalized === "USD" ? "$" : "₦"
  }

  const getAmountWithConversion = (amount: number, currency: string) => {
    const normalized = normalizeCurrency(currency)
    const amountInUnit = convertFromKobo(amount, currency)
    
    if (normalized === "USD") {
      const ngnAmount = convertToNGN(amount, currency)
      return {
        primary: `$${amountInUnit.toFixed(2)}`,
        secondary: `(₦${ngnAmount.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 0 })})`,
        primaryCurrency: "USD",
        secondaryCurrency: "NGN"
      }
    } else {
      const usdAmount = convertToUSD(amount, currency)
      return {
        primary: `₦${amountInUnit.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        secondary: `($${usdAmount.toFixed(2)})`,
        primaryCurrency: "NGN",
        secondaryCurrency: "USD"
      }
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-900">Completed</Badge>
      case "pending":
        return <Badge variant="outline">Pending</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <div className="text-xs text-muted-foreground mb-1">USD</div>
                <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.total_revenue_usd, "USD")}</div>
              </div>
              <div className="pt-2 border-t">
                <div className="text-xs text-muted-foreground mb-1">NGN Equivalent</div>
                <div className="text-lg font-semibold text-green-600">{formatCurrency(stats.total_revenue_ngn, "NGN")}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <div className="text-xs text-muted-foreground mb-1">USD</div>
                <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.pending_amount_usd, "USD")}</div>
              </div>
              <div className="pt-2 border-t">
                <div className="text-xs text-muted-foreground mb-1">NGN Equivalent</div>
                <div className="text-lg font-semibold text-green-600">{formatCurrency(stats.pending_amount_ngn, "NGN")}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Marketplace Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.marketplace_count}</div>
            <p className="text-xs text-muted-foreground">Product purchases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Event Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.event_count}</div>
            <p className="text-xs text-muted-foreground">Paid event bookings</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Transactions</CardTitle>
          <CardDescription>View transactions by status</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Transactions</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>Showing {transactions.length} transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No transactions found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => {
                      const amountDisplay = getAmountWithConversion(transaction.amount, transaction.currency)
                      return (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-mono text-xs">
                            {transaction.id.substring(0, 8)}...
                          </TableCell>
                          <TableCell className="capitalize">
                            {transaction.type.replace(/_/g, " ")}
                          </TableCell>
                          <TableCell className="font-semibold">
                            <div className="flex flex-col gap-0.5">
                              <span>{amountDisplay.primary}</span>
                              <span className="text-xs text-muted-foreground">{amountDisplay.secondary}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-semibold">
                              {normalizeCurrency(transaction.currency)}
                            </Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                          <TableCell className="capitalize">{transaction.payment_method}</TableCell>
                          <TableCell className="text-sm">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      )
                    })}
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
