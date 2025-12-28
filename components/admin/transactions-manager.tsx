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
    total_revenue: 0,
    pending_amount: 0,
    marketplace_count: 0,
    event_count: 0,
  })
  const [totalPages, setTotalPages] = useState(1)

  const calculateStats = (txns: Transaction[]) => {
    const completed = txns.filter((t) => t.status === "completed")
    const pending = txns.filter((t) => t.status === "pending")
    
    return {
      total_revenue: completed.reduce((sum, t) => sum + t.amount, 0),
      pending_amount: pending.reduce((sum, t) => sum + t.amount, 0),
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
        total_revenue: 0,
        pending_amount: 0,
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

  const formatCurrency = (amount: number) => {
    return `₦${(amount / 100).toFixed(2)}`
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
            <div className="text-2xl font-bold">{formatCurrency(stats.total_revenue)}</div>
            <p className="text-xs text-muted-foreground">Completed transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.pending_amount)}</div>
            <p className="text-xs text-muted-foreground">Awaiting verification</p>
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
                      <TableHead>Status</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-mono text-xs">
                          {transaction.id.substring(0, 8)}...
                        </TableCell>
                        <TableCell className="capitalize">
                          {transaction.type.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                        <TableCell className="capitalize">{transaction.payment_method}</TableCell>
                        <TableCell className="text-sm">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
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
