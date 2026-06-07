"use client"

import { useState, useEffect, Suspense } from "react"
import { useSession } from "next-auth/react"
import { Loader2, Crown, Check, Zap, Sparkles, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useUserProfile } from "@/hooks/use-user-profile"
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import { PaymentMethodOptions } from "@/components/payment-method-options"

const PREMIUM_FEATURES = [
  { name: "Unlimited Swipes", description: "Unlimited swipes on profiles", premium: false },
  { name: "First Message", description: "Send a message to anyone and auto-match", premium: true },
  { name: "See Likes", description: "Know exactly who's interested in you", premium: true },
  { name: "View connections", description: "See all your connections instantly", premium: true },
  { name: "Priority connections", description: "Appear higher in search results", premium: true },
  { name: "Message First", description: "Message without matching first", premium: true },
  { name: "Rewind", description: "Undo your last swipe", premium: true },
  // { name: "Super Likes", description: "Show extra interest in someone", premium: true },
  { name: "Advanced Filters", description: "Filter by multiple criteria", premium: true },
  { name: "Profile Boost", description: "Get more visibility for 24 hours", premium: true },
]

// Currency conversion rate: 1 USD = 1450 NGN
const USD_TO_NGN = 1450

// Currency symbols by country code
const CURRENCY_SYMBOLS: Record<string, string> = {
  US: "$",
  GB: "£",
  CA: "C$",
  AU: "A$",
  NG: "₦",
  ZA: "R",
  KE: "KSh",
  GH: "GHS",
  TZ: "TSh",
  UG: "USh",
  IN: "₹",
  PK: "₨",
  BD: "৳",
  PH: "₱",
  MY: "RM",
  SG: "S$",
  TH: "฿",
  VN: "₫",
  ID: "Rp",
  BR: "R$",
  MX: "Mex$",
  AR: "AR$",
  CL: "CLP$",
  CO: "COL$",
}

// Prices in USD (base currency)
const PLAN_PRICES_USD = {
  Monthly: 9.99,
  "6 Months": 49.99,
  Yearly: 79.99,
}

const PLANS = [
  {
    name: "Monthly",
    priceUSD: 9.99,
    period: "per month",
    duration: "1_month",
    savings: 0,
    features: PREMIUM_FEATURES,
  },
  {
    name: "6 Months",
    priceUSD: 49.99,
    period: "every 6 months",
    duration: "6_months",
    savings: 12,
    features: PREMIUM_FEATURES,
    popular: true,
  },
  {
    name: "Yearly",
    priceUSD: 79.99,
    period: "per year",
    duration: "1_year",
    savings: 27,
    features: PREMIUM_FEATURES,
  },
]

// Helper function to format price
function formatPrice(priceUSD: number, currencySymbol: string = "$"): string {
  return `${currencySymbol}${priceUSD.toFixed(2)}`
}

// Helper function to convert USD to NGN (for Paystack)
function convertToNGN(priceUSD: number): number {
  // Convert to kobo (NGN * 100)
  return Math.round(priceUSD * USD_TO_NGN * 100)
}

function PremiumUpgradePageContent() {
  const { user, loading: userLoading, refetch: refetchUser } = useUserProfile()
  const [subscription, setSubscription] = useState<any>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [userCountry, setUserCountry] = useState<string>("US")
  const router = useRouter()
  const searchParams = useSearchParams()

  const supabase = createClient()
  const currencySymbol = CURRENCY_SYMBOLS[userCountry] || "$"

  useEffect(() => {
    if (user?.id) {
      // Get user's country from profile if available
      const getUserCountry = async () => {
        const { data } = await supabase
          .from("users")
          .select("country")
          .eq("id", user.id)
          .single()
        if (data?.country) {
          setUserCountry(data.country.toUpperCase())
        }
      }
      getUserCountry()

      fetchSubscription()
      // Check for payment verification callback
      const reference = searchParams.get("reference")
      if (reference) {
        verifyPaymentCallback(reference)
      }
    }
  }, [user?.id, searchParams])

  async function fetchSubscription() {
    try {
      setLoadingData(true)
      const { data, error: err } = await supabase
        .from("premium_subscriptions")
        .select("*")
        .eq("user_id", user?.id)
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString())
        .order("expires_at", { ascending: false })
        .limit(1)
        .single()

      if (err && err.code !== "PGRST116") {
        console.error("Error fetching subscription:", err)
      }
      setSubscription(data)
    } catch (err) {
      console.error("Failed to fetch subscription:", err)
    } finally {
      setLoadingData(false)
    }
  }

  async function verifyPaymentCallback(reference: string) {
    try {
      console.log("[Premium] Verifying payment with reference:", reference)
      const toastId = toast.loading("Verifying your payment...")

      const response = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      })

      const result = await response.json()

      if (!response.ok) {
        // Handle not found error gracefully
        if (response.status === 400 || response.status === 404) {
          console.log("[Premium] Payment not yet verified, will retry...")
          toast.dismiss(toastId)
          // Show informational toast instead of error
          toast.info("Processing your payment", {
            description: "Your payment is being processed. Please wait...",
            duration: 5000,
          })
          // Retry verification after a delay
          setTimeout(() => verifyPaymentCallback(reference), 3000)
          return
        }
        toast.dismiss(toastId)
        toast.error("Verification Failed", {
          description: result.error || "Payment verification failed. Please try again.",
          duration: 5000,
        })
        return
      }

      if (result.status === "success" || result.success) {
        toast.dismiss(toastId)
        // Refresh subscription data
        await new Promise(resolve => setTimeout(resolve, 500))
        await fetchSubscription()
        await refetchUser()
        
        // Show success toast
        toast.success("Premium Activated!", {
          description: "Your premium subscription is now active. Enjoy all premium features!",
          duration: 5000,
        })

        // Clear URL
        window.history.replaceState({}, "", "/dashboard/premium")
      }
    } catch (err) {
      console.error("Verification error:", err)
      toast.error("Verification Error", {
        description: "Failed to verify payment. We're retrying...",
        duration: 5000,
      })
      // Retry on error
      setTimeout(() => verifyPaymentCallback(reference), 2000)
    }
  }

  async function handleUpgrade(plan: any) {
    try {
      if (!user?.id) {
        setError("You must be logged in to upgrade")
        return
      }

      console.log("[Premium] Initiating upgrade for plan:", plan.name)
      setError(null)
      setSuccess(null)
      setProcessing(true)

      // Convert USD to NGN for Paystack
      const amountNGNInKobo = convertToNGN(plan.priceUSD)

      // Call the premium subscribe API
      const response = await fetch("/api/premium/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tierName: plan.name,
          priceUSD: plan.priceUSD,
          amountNGNInKobo: amountNGNInKobo,
          currency: userCountry,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Failed to initiate payment")
        return
      }

      if (!result.authorization_url) {
        setError("Failed to get payment authorization URL")
        return
      }

      console.log("[Premium] Payment initialized, redirecting to Paystack")

      // Redirect to Paystack payment page
      window.location.href = result.authorization_url
    } catch (err) {
      console.error("Upgrade error:", err)
      setError(err instanceof Error ? err.message : "Failed to process upgrade")
    } finally {
      setProcessing(false)
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  }

  if (userLoading || loadingData) {
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

      {/* Success Alert */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Current Subscription Status */}
      {isPremium && subscription && (
        <Alert className="border-green-200 bg-green-50">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            You're currently subscribed to <strong>{subscription.plan}</strong> plan. Your subscription renews on{" "}
            <strong>{formatDate(subscription.expires_at)}</strong>
          </AlertDescription>
        </Alert>
      )}

      {/* Why Premium Section */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Why Go Premium?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PREMIUM_FEATURES.map((feature, idx) => (
            <Card key={idx} className={`border-border/50 ${feature.premium ? 'border-primary/50 bg-primary/5' : ''}`}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {feature.premium ? (
                      <Crown className="w-5 h-5 text-yellow-500" />
                    ) : (
                      <Check className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{feature.name}</p>
                      {feature.premium && <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Premium</span>}
                    </div>
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
                  <div className="text-4xl font-bold">{formatPrice(plan.priceUSD, currencySymbol)}</div>
                  <p className="text-sm text-muted-foreground">{plan.period}</p>
                  {plan.savings > 0 && (
                    <p className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded w-fit">
                      Save {plan.savings}%
                    </p>
                  )}
                  {userCountry !== "NG" && (
                    <p className="text-xs text-muted-foreground">
                      ≈ ₦{(plan.priceUSD * USD_TO_NGN).toFixed(0)} NGN
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

                {isPremium && subscription.plan === plan.name ? (
                  <Button className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => handleUpgrade(plan)}
                    disabled={processing}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {isPremium ? "Switch Plan" : "Upgrade Now"}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Info Section */}
      <Card className="border-border/50 bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">Secure Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <PaymentMethodOptions />
          <p>✓ Payments are processed securely through Paystack</p>
          <p>✓ Your subscription will renew automatically</p>
          <p>✓ You can cancel anytime from your account settings</p>
          <p>✓ No hidden fees or surprise charges</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PremiumUpgradePage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin h-8 w-8" /></div>}>
      <PremiumUpgradePageContent />
    </Suspense>
  )
}
