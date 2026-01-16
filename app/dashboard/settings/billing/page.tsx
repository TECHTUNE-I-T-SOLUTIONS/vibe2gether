"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, CreditCard, Plus, TrendingUp } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUserProfile } from "@/hooks/use-user-profile"
import { getAccountTopups, createAccountTopup, getCoinsBalance } from "@/lib/supabase/queries"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
  const [coinsBalance, setCoinsBalance] = useState(0)
  const [topups, setTopups] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [showTopupDialog, setShowTopupDialog] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<any>(null)
  const [paymentMethod, setPaymentMethod] = useState("credit-card")
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvc: "",
    name: "",
  })

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
      const [topupsData, balanceData] = await Promise.all([
        getAccountTopups(user.id),
        getCoinsBalance(user.id),
      ])
      setTopups(topupsData?.data || [])
      setCoinsBalance(balanceData?.data?.coins || 0)
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

      // Validate card details
      if (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvc || !cardDetails.name) {
        alert("Please fill in all card details")
        return
      }

      // Create topup record
      await createAccountTopup(user.id, {
        amount: selectedPackage.price,
        coins: selectedPackage.coins,
        payment_method: paymentMethod,
        status: "completed",
      })

      // Update coins balance in state
      setCoinsBalance(coinsBalance + selectedPackage.coins)
      setShowTopupDialog(false)
      setCardDetails({ number: "", expiry: "", cvc: "", name: "" })
      setSelectedPackage(null)
      
      alert("Coins purchased successfully!")
      await fetchBillingData()
    } catch (err) {
      console.error("Failed to create topup:", err)
      alert("Failed to process payment")
    } finally {
      setSaving(false)
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  function formatCurrency(amount: number) {
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
      <Card className="border-border/50 bg-gradient-to-br from-primary/10 to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              Your Coins Balance
            </span>
            <span className="text-3xl font-bold text-primary">{coinsBalance}</span>
          </CardTitle>
          <CardDescription>Use coins to unlock premium features and purchase items</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            size="lg"
            onClick={() => setShowTopupDialog(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Coins
          </Button>
        </CardContent>
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
                    <span className="text-xl font-semibold">{formatCurrency(pkg.price)}</span>
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
          {topups.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {topups.map((topup) => (
                <div
                  key={topup.id}
                  className="flex items-center justify-between p-3 border border-border/50 rounded-lg hover:bg-muted/50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Plus className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{topup.coins} Coins</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(topup.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(topup.amount)}</p>
                    <p className={`text-xs font-medium ${topup.status === "completed" ? "text-green-600" : "text-yellow-600"}`}>
                      {topup.status === "completed" ? "✓ Completed" : "Pending"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Topup Dialog */}
      <Dialog open={showTopupDialog} onOpenChange={setShowTopupDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Coins to Your Wallet</DialogTitle>
            <DialogDescription>Choose a package and complete payment</DialogDescription>
          </DialogHeader>

          {!selectedPackage ? (
            <div className="grid grid-cols-2 gap-3">
              {COIN_PACKAGES.map((pkg) => (
                <button
                  key={pkg.coins}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`p-4 border-2 rounded-lg transition text-center ${
                    selectedPackage?.coins === pkg.coins
                      ? "border-primary bg-primary/5"
                      : "border-border/50 hover:border-primary/50"
                  }`}
                >
                  <div className="font-bold text-lg text-primary">{pkg.coins}</div>
                  <div className="text-sm font-semibold">{formatCurrency(pkg.price)}</div>
                  {pkg.savings > 0 && <div className="text-xs text-green-600">Save {pkg.savings}%</div>}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <Alert>
                <AlertDescription>
                  You're purchasing <strong>{selectedPackage.coins} coins</strong> for{" "}
                  <strong>{formatCurrency(selectedPackage.price)}</strong>
                </AlertDescription>
              </Alert>

              <div>
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit-card">Credit Card</SelectItem>
                    <SelectItem value="debit-card">Debit Card</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="apple-pay">Apple Pay</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4 border-t border-border/50 pt-4">
                <div>
                  <Label htmlFor="card-name">Cardholder Name</Label>
                  <Input
                    id="card-name"
                    placeholder="John Doe"
                    value={cardDetails.name}
                    onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="card-number">Card Number</Label>
                  <Input
                    id="card-number"
                    placeholder="4242 4242 4242 4242"
                    value={cardDetails.number}
                    onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                    className="mt-1 font-mono"
                    maxLength="19"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="card-expiry">Expiry Date</Label>
                    <Input
                      id="card-expiry"
                      placeholder="MM/YY"
                      value={cardDetails.expiry}
                      onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                      className="mt-1 font-mono"
                      maxLength="5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="card-cvc">CVC</Label>
                    <Input
                      id="card-cvc"
                      placeholder="123"
                      value={cardDetails.cvc}
                      onChange={(e) => setCardDetails({ ...cardDetails, cvc: e.target.value })}
                      className="mt-1 font-mono"
                      maxLength="4"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowTopupDialog(false)
                setSelectedPackage(null)
              }}
            >
              {selectedPackage ? "Back" : "Cancel"}
            </Button>
            {selectedPackage && (
              <Button onClick={handleTopup} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Pay {formatCurrency(selectedPackage.price)}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
