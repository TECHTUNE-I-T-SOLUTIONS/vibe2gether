"use client"

import { useState, useEffect } from "react"
import {
  Coins,
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Gift,
  Sparkles,
  Eye,
  Heart,
  Users,
  BadgeCheck,
  ShoppingBag,
  Loader2,
  Copy,
  Share2,
  Check,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useI18n } from "@/lib/i18n/context"
import { useUserProfile } from "@/hooks/use-user-profile"
import { PaystackPaymentModal } from "@/components/paystack-payment-modal"

interface Transaction {
  id: string
  type: string
  description: string
  amount: number
  balanceAfter: number
  date: string
}

interface CoinRate {
  actionType: string
  coinsAmount: number
  description: string
}

const redeemOptions = [
  { title: "Premium Membership", coins: 500, description: "1 month of premium features", icon: Sparkles, id: "premium" },
  { title: "Profile Boost", coins: 50, description: "24hr visibility boost", icon: TrendingUp, id: "profile_boost" },
  { title: "Featured Product", coins: 200, description: "Feature your product for 7 days", icon: ShoppingBag, id: "featured_product" },
  { title: "Gift Card", coins: 30000, description: "$10 gift card", icon: Gift, id: "gift_card" },
]

export default function WalletPage() {
  const { t } = useI18n()
  const { user } = useUserProfile()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [coinRates, setCoinRates] = useState<CoinRate[]>([])
  const [stats, setStats] = useState({ totalEarned: 0, totalSpent: 0 })
  const [dailyGoals, setDailyGoals] = useState<any[]>([])
  const [referralStats, setReferralStats] = useState<any>(null)
  const [referralLink, setReferralLink] = useState("")
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)
  const [withdrawalAmount, setWithdrawalAmount] = useState("")
  const [bankName, setBankName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [accountName, setAccountName] = useState("")
  const [withdrawalLoading, setWithdrawalLoading] = useState(false)
  const [balance, setBalance] = useState(0)
  const [banks, setBanks] = useState<any[]>([])
  const [bankCode, setBankCode] = useState("")
  const [verifyingAccount, setVerifyingAccount] = useState(false)
  const [accountVerified, setAccountVerified] = useState(false)
  const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)
  
  // New redemption states
  const [premiumTiers, setPremiumTiers] = useState<any[]>([])
  const [showRedemptionModal, setShowRedemptionModal] = useState(false)
  const [selectedRedemption, setSelectedRedemption] = useState<any>(null)
  const [redeeming, setRedeeming] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [userProducts, setUserProducts] = useState<any[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  
  const { toast } = useToast()

  useEffect(() => {
    // Fetch banks from Paystack
    const fetchBanks = async () => {
      try {
        const response = await fetch("/api/payments/paystack/banks")
        const data = await response.json()
        if (data.success) {
          setBanks(data.banks)
        }
      } catch (error) {
        console.error("Failed to fetch banks:", error)
      }
    }
    
    // Fetch premium tiers
    const fetchPremiumTiers = async () => {
      try {
        const response = await fetch("/api/premium-tiers")
        const data = await response.json()
        if (data.success) {
          setPremiumTiers(data.tiers || [])
        }
      } catch (error) {
        console.error("Failed to fetch premium tiers:", error)
      }
    }
    
    // Fetch user products for featured product selection
    const fetchUserProducts = async () => {
      try {
        const response = await fetch("/api/marketplace/my-products")
        const data = await response.json()
        if (data.success) {
          setUserProducts(data.products || [])
        }
      } catch (error) {
        console.error("Failed to fetch user products:", error)
      }
    }
    
    fetchBanks()
    fetchPremiumTiers()
    fetchUserProducts()
  }, [])

  useEffect(() => {
    // Check for payment reference in URL
    const params = new URLSearchParams(window.location.search)
    const reference = params.get("reference")
    
    if (reference) {
      console.log("Payment reference detected:", reference)
      // Verify the payment and open modal to show success
      verifyPaymentAndShowModal(reference)
    }
  }, [])

  const verifyPaymentAndShowModal = async (reference: string) => {
    try {
      console.log("Verifying payment with reference:", reference)
      const response = await fetch(`/api/paystack/verify?reference=${reference}`)
      const data = await response.json()
      
      if (data.success) {
        console.log("Payment verified successfully, coins added:", data.coinsAdded)
        // Show modal with success message
        setShowPaymentModal(true)
        // The modal will detect the reference and show success
      } else {
        console.error("Payment verification failed:", data.error)
      }
    } catch (error) {
      console.error("Error verifying payment:", error)
    }
  }

  useEffect(() => {
    async function fetchWalletData() {
      try {
        setLoading(true)
        const [transRes, goalsRes, referralStatsRes, referralLinkRes] = await Promise.all([
          fetch("/api/wallet/transactions"),
          fetch("/api/wallet/daily-goals"),
          fetch("/api/referral/stats"),
          fetch("/api/referral/link"),
        ])

        if (transRes.ok) {
          const data = await transRes.json()
          setTransactions(data.transactions || [])
          setCoinRates(data.coinRates || [])
          setStats(data.stats || { totalEarned: 0, totalSpent: 0 })
        }

        if (goalsRes.ok) {
          const data = await goalsRes.json()
          setDailyGoals(data.dailyGoals || [])
        }

        if (referralStatsRes.ok) {
          const data = await referralStatsRes.json()
          setReferralStats(data)
        }

        if (referralLinkRes.ok) {
          const data = await referralLinkRes.json()
          setReferralLink(data.referralLink)
        }
      } catch (err) {
        console.error("Failed to fetch wallet data:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchWalletData()
  }, [])

  const handleVerifyAccount = async () => {
    if (!accountNumber || !bankCode) {
      toast({ title: "Error", description: "Please select bank and enter account number", variant: "destructive" })
      return
    }

    try {
      setVerifyingAccount(true)
      const response = await fetch("/api/payments/paystack/verify-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountNumber,
          bankCode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify account")
      }

      setAccountName(data.accountName)
      setAccountVerified(true)
      toast({ title: "Success", description: "Account verified successfully", variant: "default" })
    } catch (error) {
      console.error("Account verification error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to verify account",
        variant: "destructive",
      })
    } finally {
      setVerifyingAccount(false)
    }
  }

  const fetchWithdrawalRequests = async () => {
    try {
      setLoadingRequests(true)
      const response = await fetch("/api/wallet/withdrawal-requests")
      const data = await response.json()
      if (response.ok) {
        setWithdrawalRequests(data.requests || [])
      }
    } catch (error) {
      console.error("Failed to fetch withdrawal requests:", error)
    } finally {
      setLoadingRequests(false)
    }
  }

  useEffect(() => {
    if (showWithdrawalModal === false) {
      // Modal closed, reset verification
      setAccountVerified(false)
    }
  }, [showWithdrawalModal])

  useEffect(() => {
    // Fetch withdrawal requests when component mounts
    if (user?.id) {
      fetchWithdrawalRequests()
    }
  }, [user?.id])

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault()

    const amount = parseFloat(withdrawalAmount)
    const minWithdrawal = 15 // $15 minimum (21,750 NGN)
    const currentBalance = user?.coins_balance || 0
    const maxWithdrawal = currentBalance / 500 // Convert coins to USD
    const usdBalance = currentBalance / 500

    // Validation
    if (!withdrawalAmount || !bankCode || !bankName || !accountNumber || !accountName || !accountVerified) {
      toast({ title: "Error", description: "Please complete all fields and verify account", variant: "destructive" })
      return
    }

    if (amount < minWithdrawal) {
      toast({
        title: "Error",
        description: `Minimum withdrawal is $${minWithdrawal} (₦${(minWithdrawal * 1450).toLocaleString()})`,
        variant: "destructive",
      })
      return
    }

    if (amount > maxWithdrawal) {
      toast({
        title: "Error",
        description: `Insufficient balance. You have $${usdBalance.toFixed(2)}`,
        variant: "destructive",
      })
      return
    }

    try {
      setWithdrawalLoading(true)

      const response = await fetch("/api/wallet/withdrawal-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount,
          bankCode: bankCode,
          bankName: bankName,
          accountNumber: accountNumber,
          accountName: accountName,
          requestedCoins: Math.round(currentBalance),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit withdrawal request")
      }

      toast({
        title: "Success",
        description: "Withdrawal request submitted successfully. Our team will review it shortly.",
      })

      // Reset form
      setWithdrawalAmount("")
      setBankCode("")
      setBankName("")
      setAccountNumber("")
      setAccountName("")
      setAccountVerified(false)
      setShowWithdrawalModal(false)
      // Refresh withdrawal requests
      await fetchWithdrawalRequests()
    } catch (error) {
      console.error("Withdrawal error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit withdrawal request",
        variant: "destructive",
      })
    } finally {
      setWithdrawalLoading(false)
    }
  }

  const handleOpenRedemptionModal = (option: any) => {
    // Check if already premium (for premium membership)
    if (option.id === "premium" && user?.is_premium) {
      toast({
        title: "Already Premium",
        description: "You are already a premium member",
        variant: "default",
      })
      return
    }

    // For featured product, check if user has products
    if (option.id === "featured_product" && userProducts.length === 0) {
      toast({
        title: "No Products",
        description: "You need to create a product first before featuring it",
        variant: "destructive",
      })
      return
    }

    setSelectedRedemption(option)
    setShowRedemptionModal(true)
  }

  const handleRedeemCoins = async () => {
    if (!selectedRedemption) return

    // Validate user has enough coins
    if ((user?.coins_balance || 0) < selectedRedemption.coins) {
      toast({
        title: "Insufficient Coins",
        description: `You need ${selectedRedemption.coins} coins but only have ${user?.coins_balance || 0}`,
        variant: "destructive",
      })
      return
    }

    // For featured product, validate product selection
    if (selectedRedemption.id === "featured_product" && !selectedProduct) {
      toast({
        title: "Select Product",
        description: "Please select a product to feature",
        variant: "destructive",
      })
      return
    }

    try {
      setRedeeming(true)

      const response = await fetch("/api/wallet/redeem-coins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          redemptionType: selectedRedemption.id,
          coinsAmount: selectedRedemption.coins,
          selectedProductId: selectedProduct?.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to redeem coins")
      }

      toast({
        title: "Success",
        description: `Successfully redeemed ${selectedRedemption.coins} coins for ${selectedRedemption.title}`,
      })

      // Close modal
      setShowRedemptionModal(false)
      setSelectedRedemption(null)
      setSelectedProduct(null)

      // Refresh user data
      // In a real app, you'd trigger a refetch of user data
      window.location.reload()
    } catch (error) {
      console.error("Redemption error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to redeem coins",
        variant: "destructive",
      })
    } finally {
      setRedeeming(false)
    }
  }

  // Calculate premium membership coins based on tier price
  const getPremiumCoins = () => {
    if (premiumTiers.length === 0) return 500 // Default fallback
    const premiumTier = premiumTiers.find((t) => t.name.toLowerCase() === "premium")
    if (premiumTier) {
      // Assuming monthly_price is in USD, convert to coins
      return Math.round((premiumTier.monthly_price / 100) * 500) // If price is in cents
    }
    return 500
  }

  const updatedRedeemOptions = redeemOptions.map((option) => {
    if (option.id === "premium") {
      const premiumCoins = getPremiumCoins()
      return { ...option, coins: premiumCoins }
    }
    return option
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">{t("wallet")}</h1>
        <p className="text-muted-foreground">Manage your coins and rewards</p>
      </div>

      {/* Balance Overview */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card className="border-border/50 overflow-hidden md:col-span-2">
          <div className="gradient-bg p-6 md:p-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/70 mb-1">Total Balance</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl md:text-5xl font-bold text-white">{(user?.coins_balance || 0).toLocaleString()}</span>
                  <span className="text-white/70 text-lg">coins</span>
                </div>
                <div className="flex gap-4 mt-2">
                  <p className="text-white/70 text-sm">≈ ${((user?.coins_balance || 0) / 500).toFixed(2)} USD</p>
                  <p className="text-white/70 text-sm">≈ ₦{((user?.coins_balance || 0) * 2.9).toLocaleString(undefined, { maximumFractionDigits: 0 })} NGN</p>
                </div>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                <Coins className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button 
                variant="secondary" 
                className="rounded-full bg-white/20 text-white hover:bg-white/30 border-0"
                onClick={() => setShowWithdrawalModal(true)}
              >
                <Wallet className="w-4 h-4 mr-2" />
                {t("withdraw")}
              </Button>
              <Button 
                variant="secondary" 
                className="rounded-full bg-white/20 text-white hover:bg-white/30 border-0"
                onClick={() => setShowPaymentModal(true)}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Buy Coins
              </Button>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <ArrowDownRight className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Earned</p>
                  <p className="text-xl font-bold">{stats.totalEarned.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <ArrowUpRight className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-xl font-bold">{stats.totalSpent.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-full">
          <TabsTrigger value="transactions" className="rounded-full">
            Transactions
          </TabsTrigger>
          <TabsTrigger value="withdrawals" className="rounded-full">
            Withdrawals
          </TabsTrigger>
          <TabsTrigger value="earn" className="rounded-full">
            {t("earnCoins")}
          </TabsTrigger>
          <TabsTrigger value="referral" className="rounded-full">
            Referral
          </TabsTrigger>
          <TabsTrigger value="redeem" className="rounded-full">
            Redeem
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions && transactions.length > 0 ? (
                  transactions.map((tx) => {
                    const date = new Date(tx.date)
                    const dateStr = date.toLocaleDateString()
                    return (
                      <div key={tx.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              tx.amount > 0 ? "bg-green-500/10" : "bg-primary/10"
                            }`}
                          >
                            {tx.amount > 0 && <ArrowDownRight className="w-5 h-5 text-green-500" />}
                            {tx.amount < 0 && <ArrowUpRight className="w-5 h-5 text-primary" />}
                          </div>
                          <div>
                            <p className="font-medium">{tx.description}</p>
                            <p className="text-sm text-muted-foreground">{dateStr}</p>
                          </div>
                        </div>
                        <span className={`font-semibold ${tx.amount > 0 ? "text-green-500" : "text-foreground"}`}>
                          {tx.amount > 0 ? "+" : ""}
                          {tx.amount} coins
                        </span>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-center text-muted-foreground py-8">No transactions yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Withdrawal Requests</h2>
            <Button onClick={() => setShowWithdrawalModal(true)}>
              Request Withdrawal
            </Button>
          </div>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Your Withdrawal Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingRequests ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : withdrawalRequests.length > 0 ? (
                <div className="space-y-3">
                  {withdrawalRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            {request.status === "pending" && (
                              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-200">
                                Pending
                              </Badge>
                            )}
                            {request.status === "approved" && (
                              <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-200">
                                Approved
                              </Badge>
                            )}
                            {request.status === "settled" && (
                              <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-200">
                                Settled
                              </Badge>
                            )}
                            {request.status === "rejected" && (
                              <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-200">
                                Rejected
                              </Badge>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">
                              ${request.amount.toFixed(2)} USD ({(request.amount * 1450).toLocaleString()} NGN)
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {request.bank_name} • {request.account_number}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(request.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      {request.notes && (
                        <div className="text-right ml-4">
                          <p className="text-xs text-muted-foreground italic">
                            {request.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No withdrawal requests yet. Request one to get started!
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earn" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>How to Earn Coins</CardTitle>
              <CardDescription>Your engagement on Vibe2Gether earns you coins automatically</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                {coinRates && coinRates.length > 0 ? (
                  coinRates.map((rate, i) => {
                    // Map action types to icons
                    let Icon = Eye
                    let color = "text-blue-500"
                    
                    switch (rate.actionType) {
                      case "like_received":
                        Icon = Heart
                        color = "text-red-500"
                        break
                      case "follow_received":
                        Icon = Users
                        color = "text-secondary"
                        break
                      case "view_received":
                        Icon = Eye
                        color = "text-blue-500"
                        break
                      case "comment_received":
                        Icon = BadgeCheck
                        color = "text-green-500"
                        break
                      default:
                        Icon = Gift
                        color = "text-purple-500"
                    }

                    return (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                        <div className={`w-12 h-12 rounded-xl bg-background flex items-center justify-center ${color}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-medium capitalize">{rate.actionType.replace(/_/g, " ")}</p>
                          <p className="text-sm text-muted-foreground">{rate.coinsAmount} coins</p>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-muted-foreground col-span-2">No earning rates available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Daily Goals */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Daily Goals</CardTitle>
              <CardDescription>Complete daily goals to earn bonus coins</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {dailyGoals.length > 0 ? (
                dailyGoals.map((goal) => (
                  <div key={goal.id}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{goal.title}</span>
                        {goal.completed && <Check className="w-4 h-4 text-green-500" />}
                      </div>
                      <Badge className={goal.completed ? "bg-green-500/20 text-green-700" : "gradient-bg text-white"}>
                        +{goal.coins} coins
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{goal.description}</p>
                    {goal.progress !== undefined && (
                      <>
                        <div className="flex items-center justify-between mb-1 text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span>{goal.progress}/{goal.total}</span>
                        </div>
                        <Progress value={(goal.progress / goal.total) * 100} className="h-2" />
                      </>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">Loading daily goals...</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referral" className="space-y-4">
          <Card className="border-border/50 overflow-hidden">
            <div className="gradient-bg p-6 text-white">
              <h3 className="text-2xl font-bold mb-2">Invite Friends & Earn</h3>
              <p className="text-white/90">Get 20 coins for each friend who joins using your code</p>
            </div>
            <CardContent className="pt-6 space-y-6">
              {/* Referral Link Share */}
              <div>
                <Label className="mb-3 block">Your Referral Link</Label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      type="text"
                      value={referralLink}
                      readOnly
                      className="pr-10 rounded-full bg-muted/50"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(referralLink)
                        const event = new CustomEvent("showToast", {
                          detail: { title: "Copied!", description: "Link copied to clipboard" },
                        })
                        window.dispatchEvent(event)
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={async () => {
                      const shareData = {
                        title: "Join V2G",
                        text: "Join me on V2G and earn 20 coins bonus!",
                        url: referralLink,
                      }
                      if (navigator.share) {
                        try {
                          await navigator.share(shareData)
                        } catch (err) {
                          console.error("Error sharing:", err)
                        }
                      } else {
                        // Fallback: copy to clipboard
                        navigator.clipboard.writeText(
                          `Join V2G using my referral link: ${referralLink}`
                        )
                      }
                    }}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>

              {/* Referral Stats */}
              {referralStats && (
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <p className="text-sm text-muted-foreground mb-1">Total Referred</p>
                    <p className="text-2xl font-bold">{referralStats.totalReferred}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                    <p className="text-sm text-muted-foreground mb-1">Bonuses Earned</p>
                    <p className="text-2xl font-bold">{referralStats.bonusesClaimed}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                    <p className="text-sm text-muted-foreground mb-1">Total Bonus</p>
                    <p className="text-2xl font-bold">{referralStats.totalBonusEarned}</p>
                  </div>
                </div>
              )}

              {/* How it works */}
              <div className="space-y-3">
                <h4 className="font-semibold">How it works:</h4>
                <div className="space-y-2">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                      1
                    </div>
                    <div>
                      <p className="text-sm"><strong>Share your link</strong> with friends</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                      2
                    </div>
                    <div>
                      <p className="text-sm"><strong>Friend signs up</strong> with your code</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                      3
                    </div>
                    <div>
                      <p className="text-sm"><strong>Friend completes profile</strong> and you both earn 20 coins!</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="redeem" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Redeem Your Coins</CardTitle>
              <CardDescription>Use your coins for premium features and rewards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                {updatedRedeemOptions.map((option, i) => {
                  const Icon = option.icon
                  const canAfford = (user?.coins_balance || 0) >= option.coins
                  const isPremiumAlready = option.id === "premium" && user?.is_premium
                  return (
                    <div
                      key={i}
                      className={`p-4 rounded-xl border ${canAfford && !isPremiumAlready ? "border-primary/30 bg-primary/5" : "border-border bg-muted/30"}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <Badge variant={canAfford && !isPremiumAlready ? "default" : "secondary"} className={canAfford && !isPremiumAlready ? "gradient-bg" : ""}>
                          <Coins className="w-3 h-3 mr-1" />
                          {option.coins}
                        </Badge>
                      </div>
                      <h3 className="font-semibold mb-1">{option.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{option.description}</p>
                      {isPremiumAlready && (
                        <div className="w-full py-2 px-3 rounded-full bg-green-500/20 border border-green-500/50 text-green-700 text-sm font-medium text-center flex items-center justify-center gap-2">
                          <BadgeCheck className="w-4 h-4" />
                          Already Premium
                        </div>
                      )}
                      {!isPremiumAlready && (
                        <Button
                          className={`w-full rounded-full ${canAfford ? "gradient-bg" : ""}`}
                          variant={canAfford ? "default" : "secondary"}
                          disabled={!canAfford}
                          onClick={() => handleOpenRedemptionModal(option)}
                        >
                          {canAfford ? "Redeem" : "Not enough coins"}
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Withdrawal Modal */}
      <Dialog open={showWithdrawalModal} onOpenChange={setShowWithdrawalModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Withdrawal</DialogTitle>
            <DialogDescription>
              Withdraw your earnings to your bank account
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Wallet Info */}
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Current Balance</span>
                <span className="font-bold">{(user?.coins_balance || 0).toLocaleString()} coins</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">In USD</span>
                <span className="font-bold">${((user?.coins_balance || 0) / 500).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">In NGN</span>
                <span className="font-bold">₦{((user?.coins_balance || 0) * 2.9).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="pt-2 border-t border-border">
                <span className="text-xs text-muted-foreground">Minimum withdrawal: $15 USD</span>
              </div>
            </div>

            {/* Withdrawal Form */}
            <form onSubmit={handleWithdrawal} className="space-y-4">
              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Withdrawal Amount (USD)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="15.00"
                    min="15"
                    max={(user?.coins_balance || 0) / 500}
                    step="0.01"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    className="pl-7"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  ≈ ₦{withdrawalAmount ? (parseFloat(withdrawalAmount) * 1450).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "0"}
                </p>
              </div>

              {/* Bank Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="bankCode">Bank Name</Label>
                <select
                  id="bankCode"
                  value={bankCode}
                  onChange={(e) => {
                    const selected = banks.find((b) => b.code === e.target.value)
                    if (selected) {
                      setBankCode(selected.code)
                      setBankName(selected.name)
                    }
                  }}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                >
                  <option value="">Select a bank...</option>
                  {banks.map((bank, index) => (
                    <option key={`${bank.code}-${index}`} value={bank.code}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Account Number & Verify */}
              <div className="space-y-2">
                <Label htmlFor="account">Account Number</Label>
                <div className="flex gap-2">
                  <Input
                    id="account"
                    placeholder="Your bank account number"
                    value={accountNumber}
                    onChange={(e) => {
                      setAccountNumber(e.target.value)
                      setAccountVerified(false)
                      setAccountName("")
                    }}
                    disabled={!bankCode}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleVerifyAccount}
                    disabled={!accountNumber || !bankCode || verifyingAccount || accountVerified}
                    className="whitespace-nowrap"
                  >
                    {verifyingAccount ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </>
                    ) : accountVerified ? (
                      <>✓ Verified</>
                    ) : (
                      "Verify"
                    )}
                  </Button>
                </div>
              </div>

              {/* Account Name (Auto-filled after verification) */}
              {accountVerified && (
                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Name (Verified)</Label>
                  <Input
                    id="accountName"
                    value={accountName}
                    disabled
                    className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                  />
                  <p className="text-xs text-green-600 dark:text-green-400">✓ Account verified with Paystack</p>
                </div>
              )}

              {/* Eligibility Check */}
              {(() => {
                const usdBalance = (user?.coins_balance || 0) / 500
                const requestAmount = parseFloat(withdrawalAmount) || 0
                const insufficientBalance = usdBalance < 15
                const requestTooSmall = requestAmount < 15 && requestAmount > 0

                return withdrawalAmount ? (
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm">
                      {insufficientBalance ? (
                        <span className="text-red-600 dark:text-red-400 font-medium">✗ Insufficient balance (${usdBalance.toFixed(2)}). Minimum required: $15</span>
                      ) : requestAmount >= 15 && accountVerified ? (
                        <span className="text-green-600 dark:text-green-400 font-medium">✓ You are eligible for withdrawal</span>
                      ) : requestTooSmall ? (
                        <span className="text-orange-600 dark:text-orange-400 font-medium">⚠ Minimum $15 required</span>
                      ) : (
                        <span className="text-blue-600 dark:text-blue-400 font-medium">ℹ Verify account to proceed</span>
                      )}
                    </p>
                  </div>
                ) : null
              })()}

              <DialogFooter className="gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowWithdrawalModal(false)}
                  disabled={withdrawalLoading}
                >
                  Cancel
                </Button>
                <Button
                  className="gradient-bg"
                  type="submit"
                  disabled={withdrawalLoading || !withdrawalAmount || !bankCode || !accountNumber || !accountVerified || ((user?.coins_balance || 0) / 500) < 15}
                >
                  {withdrawalLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Redemption Modal */}
      <Dialog open={showRedemptionModal} onOpenChange={setShowRedemptionModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Redemption</DialogTitle>
            <DialogDescription>
              {selectedRedemption?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Redemption Details */}
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Feature</span>
                <span className="font-semibold">{selectedRedemption?.title}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Coins Required</span>
                <span className="font-bold text-lg flex items-center gap-1">
                  <Coins className="w-4 h-4" />
                  {selectedRedemption?.coins}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Your Balance</span>
                <span className={`font-semibold ${(user?.coins_balance || 0) >= selectedRedemption?.coins ? "text-green-600" : "text-red-600"}`}>
                  {(user?.coins_balance || 0).toLocaleString()} coins
                </span>
              </div>
              {selectedRedemption?.id === "premium" && (
                <>
                  <div className="border-t border-border pt-2">
                    <p className="text-sm text-muted-foreground">Duration: 1 Month</p>
                    <p className="text-sm text-muted-foreground">Auto-renewal: Disabled</p>
                  </div>
                </>
              )}
              {selectedRedemption?.id === "profile_boost" && (
                <div className="border-t border-border pt-2">
                  <p className="text-sm text-muted-foreground">Duration: 24 Hours</p>
                  <p className="text-sm text-muted-foreground">Visibility: Top of Users List</p>
                </div>
              )}
            </div>

            {/* Product Selection for Featured Product */}
            {selectedRedemption?.id === "featured_product" && (
              <div className="space-y-2">
                <Label>Select Product to Feature</Label>
                <select
                  value={selectedProduct?.id || ""}
                  onChange={(e) => {
                    const product = userProducts.find((p) => p.id === e.target.value)
                    setSelectedProduct(product)
                  }}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Choose a product...</option>
                  {userProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.title} ({product.condition || "Unknown"})
                    </option>
                  ))}
                </select>
                {selectedProduct && (
                  <div className="bg-primary/5 border border-primary/30 p-3 rounded-lg">
                    <p className="text-sm font-medium">{selectedProduct.title}</p>
                    <p className="text-xs text-muted-foreground">Feature expires in 7 days</p>
                  </div>
                )}
              </div>
            )}

            {/* Confirmation Message */}
            <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-900 dark:text-amber-200">
                You are about to redeem <span className="font-semibold">{selectedRedemption?.coins}</span> coins for <span className="font-semibold">{selectedRedemption?.title}</span>. This action cannot be undone.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowRedemptionModal(false)
                setSelectedRedemption(null)
                setSelectedProduct(null)
              }}
              disabled={redeeming}
            >
              Cancel
            </Button>
            <Button
              className="gradient-bg"
              onClick={handleRedeemCoins}
              disabled={redeeming || (selectedRedemption?.id === "featured_product" && !selectedProduct)}
            >
              {redeeming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm Redemption"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PaystackPaymentModal 
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={1500}
        itemType="coins"
        purpose="Buy Coins"
      />
    </div>
  )
}
