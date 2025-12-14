"use client"

import { useState } from "react"
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
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useI18n } from "@/lib/i18n/context"

const transactions = [
  { type: "earned", description: "Profile views", amount: 12, date: "Today" },
  { type: "earned", description: "New followers (5)", amount: 10, date: "Today" },
  { type: "spent", description: "Premium boost", amount: -50, date: "Yesterday" },
  { type: "earned", description: "Post likes (45)", amount: 45, date: "Yesterday" },
  { type: "withdrawn", description: "Withdrawal to PayPal", amount: -500, date: "Dec 5" },
  { type: "earned", description: "Referral bonus", amount: 100, date: "Dec 4" },
  { type: "spent", description: "Featured product", amount: -200, date: "Dec 3" },
]

const earningRates = [
  { icon: Eye, action: "Profile Views", rate: "10 views = 1 coin", color: "text-blue-500" },
  { icon: Heart, action: "Post Likes", rate: "1 like = 1 coin", color: "text-primary" },
  { icon: Users, action: "New Followers", rate: "1 follower = 2 coins", color: "text-secondary" },
  { icon: BadgeCheck, action: "Verification", rate: "One-time 100 coins", color: "text-green-500" },
]

const redeemOptions = [
  { title: "Premium Membership", coins: 500, description: "1 month of premium features", icon: Sparkles },
  { title: "Profile Boost", coins: 50, description: "24hr visibility boost", icon: TrendingUp },
  { title: "Featured Product", coins: 200, description: "Feature your product for 7 days", icon: ShoppingBag },
  { title: "Gift Card", coins: 1000, description: "$10 gift card", icon: Gift },
]

export default function WalletPage() {
  const { t } = useI18n()
  const [balance] = useState(3450)
  const [totalEarned] = useState(5200)
  const [totalSpent] = useState(1750)

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
                  <p className="text-xl font-bold">{totalEarned.toLocaleString()}</p>
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
                  <p className="text-xl font-bold">{totalSpent.toLocaleString()}</p>
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
                {transactions.map((tx, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.type === "earned" ? "bg-green-500/10" : tx.type === "spent" ? "bg-primary/10" : "bg-muted"
                        }`}
                      >
                        {tx.type === "earned" && <ArrowDownRight className="w-5 h-5 text-green-500" />}
                        {tx.type === "spent" && <ArrowUpRight className="w-5 h-5 text-primary" />}
                        {tx.type === "withdrawn" && <Wallet className="w-5 h-5 text-muted-foreground" />}
                      </div>
                      <div>
                        <p className="font-medium">{tx.description}</p>
                        <p className="text-sm text-muted-foreground">{tx.date}</p>
                      </div>
                    </div>
                    <span className={`font-semibold ${tx.amount > 0 ? "text-green-500" : "text-foreground"}`}>
                      {tx.amount > 0 ? "+" : ""}
                      {tx.amount} coins
                    </span>
                  </div>
                ))}
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
                {earningRates.map((item, i) => {
                  const Icon = item.icon
                  return (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                      <div
                        className={`w-12 h-12 rounded-xl bg-background flex items-center justify-center ${item.color}`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-medium">{item.action}</p>
                        <p className="text-sm text-muted-foreground">{item.rate}</p>
                      </div>
                    </div>
                  )
                })}
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
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Post 3 times</span>
                  <span className="text-sm text-muted-foreground">2/3</span>
                </div>
                <Progress value={66} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Get 50 profile views</span>
                  <span className="text-sm text-muted-foreground">38/50</span>
                </div>
                <Progress value={76} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Reply to 5 messages</span>
                  <span className="text-sm text-green-500">Completed!</span>
                </div>
                <Progress value={100} className="h-2" />
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
