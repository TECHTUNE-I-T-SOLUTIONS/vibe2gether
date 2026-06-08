"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PaymentMethodOptions } from "@/components/payment-method-options"

const MOBILE_MONEY_COUNTRIES = [
  {
    code: "CM",
    label: "Cameroon",
    dialCode: "237",
    currency: "XAF",
    placeholder: "6XXXXXXXX",
    networks: [
      { value: "MTN", label: "MTN Mobile Money" },
      { value: "ORANGE", label: "Orange Money" },
    ],
  },
  {
    code: "NG",
    label: "Nigeria",
    dialCode: "234",
    currency: "NGN",
    placeholder: "8XXXXXXXXX",
    networks: [{ value: "MTN", label: "MTN MoMo" }],
  },
  {
    code: "US",
    label: "United States",
    dialCode: "1",
    currency: "USD",
    placeholder: "5550100000",
    networks: [{ value: "MOBILE_MONEY", label: "Mobile Money" }],
  },
]

interface PaystackPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  amount: number
  currency?: string
  itemType?: "product" | "event" | "coins"
  itemData?: {
    title: string
    id?: string
  }
  purpose?: string
  onPaymentSuccess?: (reference: string) => void
  initialPaymentMethod?: "paystack" | "flutterwave"
}

export function PaystackPaymentModal({
  isOpen,
  onClose,
  amount,
  currency = "NGN",
  itemType,
  itemData,
  purpose,
  onPaymentSuccess,
  initialPaymentMethod = "paystack",
}: PaystackPaymentModalProps) {
  const { toast } = useToast()
  const { data: session } = useSession()
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [paymentAmount, setPaymentAmount] = useState<number | "">(amount)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [paymentReference, setPaymentReference] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<"paystack" | "flutterwave">(initialPaymentMethod)
  const [mobileMoney, setMobileMoney] = useState({
    country: "CM",
    countryCode: "237",
    currency: "XAF",
    network: "MTN",
    phoneNumber: "",
  })
  const selectedMobileMoneyCountry =
    MOBILE_MONEY_COUNTRIES.find((country) => country.code === mobileMoney.country) || MOBILE_MONEY_COUNTRIES[0]

  // USD equivalent = NGN / 1450 (1 USD = 1450 NGN)
  const usdEquivalent = paymentAmount !== "" ? paymentAmount / 1450 : 0

  // Coins equivalent = USD * 500 (500 coins = 1 USD)
  const coinsEquivalent = Math.round(usdEquivalent * 500)

  // XAF equivalent = USD * 585.48 (1 USD = 585.48 XAF)
  const xafEquivalent = Math.round(usdEquivalent * 585.48)
  const methodTwoAmount =
    selectedMobileMoneyCountry.currency === "NGN"
      ? Math.round(usdEquivalent * 1450)
      : selectedMobileMoneyCountry.currency === "USD"
        ? Number(usdEquivalent.toFixed(2))
        : xafEquivalent

  // Check for payment reference in URL params (Paystack redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlReference = params.get("reference")
    
    // Check URL first, then localStorage
    const reference = urlReference || (typeof window !== 'undefined' ? localStorage.getItem("paystack_reference") || localStorage.getItem("flutterwave_reference") : null)
    
    if (reference) {
      console.log("[PAYSTACK] Payment reference found:", reference)
      setPaymentReference(reference)
      // Auto-verify payment when component mounts with reference
      setTimeout(() => verifyPayment(reference), 500)
      // Clean up URL
      if (urlReference) {
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }
  }, [])

  // Poll for payment if user comes back from Paystack
  useEffect(() => {
    if (!paymentReference || paymentStatus === "success") return
    
    // Start polling every 2 seconds if payment reference exists and not yet successful
    const pollInterval = setInterval(() => {
      verifyPayment(paymentReference)
    }, 2000)
    
    return () => clearInterval(pollInterval)
  }, [paymentReference, paymentStatus])

  // Fetch user details from session on modal open
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!isOpen) return
      setPaymentMethod(initialPaymentMethod)
      
      // Get user details from NextAuth session
      if (session?.user) {
        setFullName(session.user.name || "")
        setEmail(session.user.email || "")
      }
      setIsLoading(false)
    }

    fetchUserDetails()
  }, [isOpen, session?.user])

  const handlePayment = async () => {
    if (!email || !fullName) {
      toast({
        title: "Missing Information",
        description: "Please enter your email and full name",
        variant: "destructive",
      })
      return
    }

    if (!email.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      })
      return
    }

    if (paymentAmount === "" || paymentAmount < 1500) {
      toast({
        title: "Minimum Amount Required",
        description: "The minimum payment amount is ₦1,500",
        variant: "destructive",
      })
      return
    }

    if (paymentMethod === "flutterwave" && (!mobileMoney.countryCode || !mobileMoney.network || mobileMoney.phoneNumber.length < 8)) {
      toast({
        title: "Wallet details required",
        description: "Enter a valid mobile money wallet before continuing.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setPaymentStatus("processing")
    setErrorMessage("")

    try {
      const endpoint = paymentMethod === "flutterwave" ? "/api/flutterwave/initialize" : "/api/paystack/initialize"
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          fullName,
          amount: paymentAmount,
          currency,
          itemType,
          itemData,
          mobileMoney: paymentMethod === "flutterwave" ? mobileMoney : undefined,
          metadata: {
            itemType: itemType || "coins",
            itemId: itemData?.id,
            itemTitle: itemData?.title || purpose || "Purchase",
          },
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to initialize payment")
      }

      const data = await response.json()
      const { authorizationUrl, reference } = data

      // Store reference in localStorage for polling if redirect fails
      if (reference) {
        localStorage.setItem(paymentMethod === "flutterwave" ? "flutterwave_reference" : "paystack_reference", reference)
        setPaymentReference(reference)
      }

      if (paymentMethod === "flutterwave" && data.instruction) {
        toast({
          title: "Approve on your phone",
          description: data.instruction,
        })
      }

      // Redirect to Paystack payment page
      if (authorizationUrl) {
        window.location.href = authorizationUrl
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Payment initialization failed"
      setErrorMessage(errorMsg)
      setPaymentStatus("error")
      toast({
        title: "Payment Error",
        description: errorMsg,
        variant: "destructive",
      })
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    if (!isProcessing) {
      setPaymentStatus("idle")
      setErrorMessage("")
      setPaymentReference(null)
      onClose()
    }
  }

  const handleReturnToMarketplace = () => {
    if (paymentReference) {
      // Redirect to verification page with reference
      window.location.href = `/marketplace/payment-callback?reference=${paymentReference}`
    } else {
      window.location.href = "/marketplace"
    }
  }

  const verifyPayment = async (reference: string) => {
    try {
      console.log("[PAYSTACK] Verifying payment with reference:", reference)
      const isFlutterwaveReference = reference.startsWith("flw-")
      const response = isFlutterwaveReference
        ? await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reference }),
          })
        : await fetch(`/api/paystack/verify?reference=${reference}`)
      const result = await response.json()

      console.log("[PAYSTACK] Verification response:", result)

      if (result.success && result.status === "completed") {
        setPaymentStatus("success")
        // Clear stored reference
        if (typeof window !== 'undefined') {
          localStorage.removeItem("paystack_reference")
          localStorage.removeItem("flutterwave_reference")
        }
        toast({
          title: "Success!",
          description: itemType === "product" 
            ? "Payment successful! Redirecting to marketplace..."
            : `${result.coinsAdded || "Payment"} completed!`,
          variant: "default",
        })
        onPaymentSuccess?.(reference)
        
        // Auto redirect based on item type
        if (itemType === "product") {
          setTimeout(() => {
            window.location.href = `/marketplace/payment-callback?reference=${reference}`
          }, 2000)
        } else {
          // Auto close after 3 seconds for other types
          setTimeout(() => {
            handleClose()
          }, 3000)
        }
      } else if (result.status === "pending") {
        setErrorMessage("Payment is being processed. Please wait...")
        setPaymentStatus("processing")
        // Retry verification after 3 seconds
        setTimeout(() => {
          verifyPayment(reference)
        }, 3000)
      } else {
        setErrorMessage("Payment verification failed. Please contact support.")
        setPaymentStatus("error")
      }
    } catch (error) {
      console.error("[PAYSTACK] Verification error:", error)
      setErrorMessage("Could not verify payment. Please try again.")
      setPaymentStatus("error")
    }
  }

  // Amount is already in NGN (1500 = ₦1,500)
  // USD equivalent = NGN / 1450 (1 USD = 1450 NGN)
  // Moved to top with other calculations

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[92dvh] flex-col overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="shrink-0 border-b px-5 pb-4 pt-5 text-left">
          <DialogTitle>Complete Payment</DialogTitle>
          <DialogDescription>
            Choose how you want to pay, then continue securely.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {/* Payment Summary */}
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-3">Item: {itemData?.title || purpose || "Purchase"}</p>
            <div className="space-y-3">
              <div>
                <Label htmlFor="amount" className="text-sm">Amount (NGN)</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="amount"
                    type="number"
                    min="1500"
                    step="100"
                    value={paymentAmount}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === "") {
                        setPaymentAmount("")
                      } else {
                        const numValue = parseInt(value) || 0
                        setPaymentAmount(numValue > 0 ? numValue : "")
                      }
                    }}
                    disabled={isProcessing}
                    className="font-semibold"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Minimum: ₦1,500</p>
              </div>
              <div className="flex justify-between items-baseline bg-background p-3 rounded">
                <div>
                  <span className="text-lg font-bold block">₦{paymentAmount !== "" ? paymentAmount.toLocaleString() : "0"}</span>
                  <span className="text-xs text-muted-foreground">{coinsEquivalent.toLocaleString()} coins</span>
                </div>
                <div className="text-right">
                  <span className="text-sm text-muted-foreground block">${usdEquivalent.toFixed(2)} USD</span>
                  <span className="text-sm text-muted-foreground">FCFA {xafEquivalent.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {paymentStatus === "error" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {(paymentStatus === "idle" || paymentStatus === "processing" || paymentStatus === "error") && (
            <div className="space-y-2">
              <Label>Payment method</Label>
              <PaymentMethodOptions value={paymentMethod} onChange={setPaymentMethod} layout="stack" />
              {paymentMethod === "flutterwave" && (
                <div className="space-y-3 rounded-lg border p-3">
                  <div>
                    <p className="font-semibold">Mobile money wallet</p>
                    <p className="text-xs text-muted-foreground">Choose the country/currency and wallet that will approve this payment.</p>
                  </div>
                  <div className="grid gap-3">
                    <div>
                      <Label className="mb-1 block text-sm font-medium">Country</Label>
                      <select
                        value={mobileMoney.country}
                        onChange={(event) =>
                          setMobileMoney((current) => {
                            const country = MOBILE_MONEY_COUNTRIES.find((item) => item.code === event.target.value) || MOBILE_MONEY_COUNTRIES[0]
                            return {
                              ...current,
                              country: country.code,
                              countryCode: country.dialCode,
                              currency: country.currency,
                              network: country.networks[0]?.value || "",
                            }
                          })
                        }
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      >
                        {MOBILE_MONEY_COUNTRIES.map((country) => (
                          <option key={country.code} value={country.code}>
                            {country.label} ({country.currency})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="mb-1 block text-sm font-medium">Network</Label>
                      <select
                        value={mobileMoney.network}
                        onChange={(event) => setMobileMoney((current) => ({ ...current, network: event.target.value }))}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      >
                        {selectedMobileMoneyCountry.networks.map((network) => (
                          <option key={network.value} value={network.value}>
                            {network.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-[90px_1fr] gap-2">
                      <div>
                        <Label className="mb-1 block text-sm font-medium">Code</Label>
                        <Input value={mobileMoney.countryCode} readOnly />
                      </div>
                      <div>
                        <Label className="mb-1 block text-sm font-medium">Wallet phone</Label>
                        <Input
                          value={mobileMoney.phoneNumber}
                          onChange={(event) =>
                            setMobileMoney((current) => ({
                              ...current,
                              phoneNumber: event.target.value.replace(/\D/g, ""),
                            }))
                          }
                          placeholder={selectedMobileMoneyCountry.placeholder}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form */}
          {(paymentStatus === "idle" || paymentStatus === "processing" || paymentStatus === "error") && (
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="ml-2 text-sm">Loading user details...</span>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="full-name">Full Name</Label>
                    <div className="px-4 py-2 bg-muted rounded-md text-sm font-medium">
                      {fullName || "—"}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="px-4 py-2 bg-muted rounded-md text-sm font-medium break-all">
                      {email || "—"}
                    </div>
                  </div>
                </>
              )}

              {/* Paystack Info */}
              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-900 dark:text-blue-100">
                  <strong>🔒 Secure:</strong> Your payment details are encrypted and processed securely by Paystack
                </p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {paymentStatus === "success" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
              <div className="text-center">
                <p className="font-semibold text-lg">Payment Successful!</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {itemType === "coins" || purpose === "Buy Coins" 
                    ? "Your coins have been added to your wallet. Check your email for details."
                    : `Your ${itemType} has been created. Check your email for details.`
                  }
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t bg-background px-5 py-4">
          {paymentStatus === "success" ? (
            <>
              {itemType === "product" && (
                <Button
                  onClick={handleReturnToMarketplace}
                  className="gap-2 gradient-bg"
                  size="lg"
                >
                  ✓ Return to Marketplace
                </Button>
              )}
              {itemType !== "product" && (
                <Button
                  onClick={handleClose}
                  className="gap-2 gradient-bg"
                  size="lg"
                >
                  Done
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              {(paymentStatus === "idle" || paymentStatus === "processing" || paymentStatus === "error") && paymentReference && (
                <Button
                  onClick={() => verifyPayment(paymentReference)}
                  disabled={isProcessing}
                  className="gap-2"
                  variant="default"
                >
                  {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                  Verify Payment
                </Button>
              )}
              {(paymentStatus === "idle" || paymentStatus === "processing" || paymentStatus === "error") && !paymentReference && (
                <Button
                  onClick={handlePayment}
                  disabled={
                    isProcessing ||
                    !email ||
                    !fullName ||
                    isLoading ||
                    Number(paymentAmount) < 1500 ||
                    (paymentMethod === "flutterwave" &&
                      (!mobileMoney.countryCode || !mobileMoney.network || mobileMoney.phoneNumber.length < 8))
                  }
                  className="gap-2"
                >
                  {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isProcessing ? "Processing..." : `Pay ₦${paymentAmount.toLocaleString()}`}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
