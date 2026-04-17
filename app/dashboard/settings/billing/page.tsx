"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, CreditCard, Plus, TrendingUp, Coins, ArrowDownRight, ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUserProfile } from "@/hooks/use-user-profile"
import { createAccountTopup, getCoinsBalance } from "@/lib/supabase/queries"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PaystackPaymentModal } from "@/components/paystack-payment-modal"
import { useToast } from "@/hooks/use-toast"

const COIN_PACKAGES = [
  { coins: 100, price: 9.99, label: "100 Coins", savings: 0 },
  { coins: 500, price: 39.99, label: "500 Coins", savings: 25 },
  { coins: 1000, price: 69.99, label: "1000 Coins", savings: 30 },
  { coins: 5000, price: 299.99, label: "5000 Coins", savings: 50 },
]

export default function BillingSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { user, loading } = useUserProfile()
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [showTopupDialog, setShowTopupDialog] = useState(false)
  const [showPaystackModal, setShowPaystackModal] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<any>(null)

  // Auth check
  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [session, router])

  useEffect(() => {
    if (user) {
      fetchBillingData()
    }
  }, [user])

  async function fetchBillingData() {
    try {
      setLoadingData(true)
      const transRes = await fetch("/api/wallet/transactions")

      if (transRes.ok) {
        const data = await transRes.json()
        setTransactions(data.transactions || [])
      }
    } catch (err) {
      console.error("Failed to fetch billing data:", err)
    } finally {
      setLoadingData(false)
    }
  }

  async function handleTopup() {
    if (!user || !selectedPackage) return

    try {
      setSaving(true)
      // Open Paystack modal for payment
      setShowPaystackModal(true)
    } catch (err) {
      console.error("Failed to process topup:", err)
      toast({
        title: "Error",
        description: "Failed to process payment",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  async function handlePaymentSuccess() {
    if (!user || !selectedPackage) return

    try {
      // Create topup record after successful payment
      await createAccountTopup(
        user.id,
        selectedPackage.price,
        selectedPackage.coins,
        "paystack"
      )
      
      toast({
        title: "Success",
        description: `You've successfully purchased ${selectedPackage.coins} coins!`,
      })
      
      setShowTopupDialog(false)
      setShowPaystackModal(false)
      setSelectedPackage(null)
      
      // Refresh billing data
      await fetchBillingData()
    } catch (err) {
      console.error("Failed to record topup:", err)
      toast({
        title: "Error",
        description: "Payment successful but failed to record coins. Please contact support.",
        variant: "destructive",
      })
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  function formatCurrency(coins: number) {
    const usd = (coins / 500).toFixed(2)
    const ngn = Math.round(coins * 2.9)
    const xaf = Math.round((coins / 500) * 585.48)
    return { usd, ngn, xaf }
  }

  function formatUSD(amount: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center gap-4 pt-2">
        <Link href="/dashboard/settings">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CreditCard className="w-8 h-8" />
            Billing & Wallet
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your coins and payment methods</p>
        </div>
      </div>

      {/* Coins Balance Card */}
      <Card className="border-border/50 overflow-hidden">
        <div className="gradient-bg p-6 md:p-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/70 mb-1">Your Coins Balance</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl md:text-5xl font-bold text-white">{(user?.coins_balance || 0).toLocaleString()}</span>
                <span className="text-white/70 text-lg">coins</span>
              </div>
                <div className="flex gap-4 mt-2 flex-wrap">
                  <p className="text-white/70 text-sm">≈ ${formatCurrency(user?.coins_balance || 0).usd} USD</p>
                  <p className="text-white/70 text-sm">≈ ₦{Number(formatCurrency(user?.coins_balance || 0).ngn).toLocaleString()} NGN</p>
                  <p className="text-white/70 text-sm">≈ Fr{Number(formatCurrency(user?.coins_balance || 0).xaf).toLocaleString()} XAF</p>
                </div>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
              <Coins className="w-8 h-8 text-white" />
            </div>
          </div>
          <Button
            className="w-full mt-6 bg-white/20 text-white hover:bg-white/30 border-0"
            onClick={() => setShowTopupDialog(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Coins
          </Button>
        </div>
      </Card>

      {/* Coin Packages Preview */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Coin Packages</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {COIN_PACKAGES.map((pkg) => (
            <Card
              key={pkg.coins}
              className="border-border/50 cursor-pointer hover:border-primary/50 transition"
              onClick={() => {
                setSelectedPackage(pkg)
                setShowTopupDialog(true)
              }}
            >
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-primary">{pkg.coins}</span>
                    <span className="text-xl font-semibold">${formatCurrency(pkg.coins).usd}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{pkg.label}</p>
                  {pkg.savings > 0 && (
                    <p className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded w-fit">
                      Save {pkg.savings}%
                    </p>
                  )}
                  <Button variant="outline" className="w-full" size="sm">
                    Choose Package
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Your recent coin purchases and transactions</CardDescription>
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

      {/* Topup Dialog - Package Selection */}
      <Dialog open={showTopupDialog} onOpenChange={setShowTopupDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Coins to Your Wallet</DialogTitle>
            <DialogDescription>Choose a package to purchase</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            {COIN_PACKAGES.map((pkg) => (
              <button
                key={pkg.coins}
                onClick={() => {
                  setSelectedPackage(pkg)
                  setShowTopupDialog(false)
                  setShowPaystackModal(true)
                }}
                className={`p-4 border-2 rounded-lg transition text-center hover:border-primary/50 ${
                  selectedPackage?.coins === pkg.coins
                    ? "border-primary bg-primary/5"
                    : "border-border/50"
                }`}
              >
                <Coins className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="font-bold text-lg text-primary">{pkg.coins}</div>
                <div className="text-sm font-semibold">${formatCurrency(pkg.coins).usd}</div>
                {pkg.savings > 0 && <div className="text-xs text-green-600">Save {pkg.savings}%</div>}
              </button>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTopupDialog(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Paystack Payment Modal */}
      {selectedPackage && (
        <PaystackPaymentModal
          isOpen={showPaystackModal}
          onClose={() => {
            setShowPaystackModal(false)
            setSelectedPackage(null)
          }}
          amount={selectedPackage.price * 100} // Convert to cents for Paystack
          currency="USD"
          itemType="coins"
          itemData={{
            id: `coins-${selectedPackage.coins}`,
            title: `Buy ${selectedPackage.coins} Coins`,
          }}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  )
}
