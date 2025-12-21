"use client"

import { useState, useEffect } from "react"
import { Loader2, Crown, Check, X, Zap, Heart, MessageCircle, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useUserProfile } from "@/hooks/use-user-profile"
import { getUserPremiumSubscription, createPremiumSubscription } from "@/lib/supabase/queries"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const PREMIUM_FEATURES = [
  { name: "Unlimited Swipes", description: "No limits on who you can connect with" },
  { name: "See Likes", description: "Know who's interested in you" },
  { name: "Priority Matches", description: "Appear higher in search results" },
  { name: "Message First", description: "Message without matching first" },
  { name: "Rewind", description: "Undo your last swipe" },
  { name: "Super Likes", description: "Show extra interest in someone" },
]

const PLANS = [
  {
    name: "Monthly",
    price: 9.99,
    period: "per month",
    duration: "1_month",
    savings: 0,
    features: PREMIUM_FEATURES,
  },
  {
    name: "6 Months",
    price: 49.99,
    period: "every 6 months",
    duration: "6_months",
    savings: 17,
    features: PREMIUM_FEATURES,
    popular: true,
  },
  {
    name: "Yearly",
    price: 79.99,
    period: "per year",
    duration: "1_year",
    savings: 33,
    features: PREMIUM_FEATURES,
  },
]

export default function PremiumUpgradePage() {
  const { user, loading } = useUserProfile()
  const [subscription, setSubscription] = useState<any>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("credit-card")
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvc: "",
    name: "",
  })
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (user) {
      fetchSubscription()
    }
  }, [user])

  async function fetchSubscription() {
    try {
      setLoadingData(true)
      const { data } = await getUserPremiumSubscription(user.id)
      setSubscription(data)
    } catch (err) {
      console.error("Failed to fetch subscription:", err)
    } finally {
      setLoadingData(false)
    }
  }

  async function handleUpgrade() {
    if (!user || !selectedPlan) return

    try {
      setProcessing(true)

      // Validate card details
      if (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvc || !cardDetails.name) {
        alert("Please fill in all card details")
        return
      }

      // Create subscription
      await createPremiumSubscription(user.id, {
        plan_type: selectedPlan.duration,
        amount: selectedPlan.price,
        status: "active",
        auto_renew: true,
      })

      setShowPaymentDialog(false)
      setCardDetails({ number: "", expiry: "", cvc: "", name: "" })
      setSelectedPlan(null)
      
      alert("Premium upgrade successful!")
      await fetchSubscription()
    } catch (err) {
      console.error("Failed to upgrade:", err)
      alert("Failed to process payment")
    } finally {
      setProcessing(false)
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  }

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center h-96 p-2">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const isPremium = subscription?.status === "active"

  return (
    <div className="space-y-8 pb-8 p-4">
      <div className="text-center space-y-3 pt-8">
        <div className="flex items-center justify-center">
          <Crown className="w-8 h-8 text-yellow-500 mr-2" />
          <h1 className="text-4xl font-bold">Upgrade to Premium</h1>
        </div>
        <p className="text-lg text-muted-foreground">Unlock exclusive features and connect more meaningfully</p>
      </div>

      {isPremium && (
        <Alert className="border-green-200 bg-green-50">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            You're currently subscribed to {subscription.plan_type.replace("_", " ")} plan. Your subscription renews on{" "}
            <strong>{formatDate(subscription.renewal_date)}</strong>
          </AlertDescription>
        </Alert>
      )}

      {/* Current Benefits Comparison */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Why Go Premium?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PREMIUM_FEATURES.map((feature, idx) => (
            <Card key={idx} className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">{feature.name}</p>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Pricing Plans */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Choose Your Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <Card
              key={plan.name}
              className={`border-border/50 relative transition ${
                plan.popular ? "ring-2 ring-primary scale-105" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
              )}

              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <div className="space-y-2 mt-4">
                  <div className="text-4xl font-bold">${plan.price}</div>
                  <p className="text-sm text-muted-foreground">{plan.period}</p>
                  {plan.savings > 0 && (
                    <p className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded w-fit">
                      Save {plan.savings}%
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature.name}</span>
                    </li>
                  ))}
                </ul>

                {isPremium && subscription.plan_type === plan.duration ? (
                  <Button className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => {
                      setSelectedPlan(plan)
                      setShowPaymentDialog(true)
                    }}
                  >
                    {isPremium ? "Switch Plan" : "Upgrade Now"}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Complete Your Premium Upgrade</DialogTitle>
            <DialogDescription>
              You're upgrading to {selectedPlan?.name} Plan for ${selectedPlan?.price}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <Alert>
              <AlertDescription>
                Your subscription will renew automatically. You can cancel anytime from your account settings.
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

            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <p className="text-sm font-semibold">Order Summary</p>
              <div className="flex justify-between text-sm">
                <span>Plan</span>
                <span>{selectedPlan?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Amount</span>
                <span>${selectedPlan?.price}</span>
              </div>
              <div className="border-t border-border/50 pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span>${selectedPlan?.price}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPaymentDialog(false)
                setSelectedPlan(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpgrade} disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Complete Upgrade
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
