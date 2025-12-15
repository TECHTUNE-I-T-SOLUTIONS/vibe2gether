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
import { useI18n } from "@/lib/i18n/context"
import { useUserProfile } from "@/hooks/use-user-profile"

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
  { title: "Premium Membership", coins: 500, description: "1 month of premium features", icon: Sparkles },
  { title: "Profile Boost", coins: 50, description: "24hr visibility boost", icon: TrendingUp },
  { title: "Featured Product", coins: 200, description: "Feature your product for 7 days", icon: ShoppingBag },
  { title: "Gift Card", coins: 1000, description: "$10 gift card", icon: Gift },
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

  const balance = user?.coins_balance || 0

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
                  <span className="text-4xl md:text-5xl font-bold text-white">{balance.toLocaleString()}</span>
                  <span className="text-white/70 text-lg">coins</span>
                </div>
                <p className="text-white/70 text-sm mt-2">≈ ${(balance / 100).toFixed(2)} USD</p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                <Coins className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="secondary" className="rounded-full bg-white/20 text-white hover:bg-white/30 border-0">
                <Wallet className="w-4 h-4 mr-2" />
                {t("withdraw")}
              </Button>
              <Button variant="secondary" className="rounded-full bg-white/20 text-white hover:bg-white/30 border-0">
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
                {redeemOptions.map((option, i) => {
                  const Icon = option.icon
                  const canAfford = balance >= option.coins
                  return (
                    <div
                      key={i}
                      className={`p-4 rounded-xl border ${canAfford ? "border-primary/30 bg-primary/5" : "border-border bg-muted/30"}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <Badge variant={canAfford ? "default" : "secondary"} className={canAfford ? "gradient-bg" : ""}>
                          <Coins className="w-3 h-3 mr-1" />
                          {option.coins}
                        </Badge>
                      </div>
                      <h3 className="font-semibold mb-1">{option.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{option.description}</p>
                      <Button
                        className={`w-full rounded-full ${canAfford ? "gradient-bg" : ""}`}
                        variant={canAfford ? "default" : "secondary"}
                        disabled={!canAfford}
                      >
                        {canAfford ? "Redeem" : "Not enough coins"}
                      </Button>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
