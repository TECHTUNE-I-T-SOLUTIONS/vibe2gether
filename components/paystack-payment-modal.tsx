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
}: PaystackPaymentModalProps) {
  const { toast } = useToast()
  const { data: session } = useSession()
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  // Convert to Kobo for Paystack (1 NGN = 100 Kobo)
  const amountInKobo = Math.round(amount * 100)

  // Fetch user details from session on modal open
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!isOpen) return
      
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

    setIsProcessing(true)
    setPaymentStatus("processing")
    setErrorMessage("")

    try {
      // Initialize payment with Paystack
      const response = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          fullName,
          amount: amountInKobo,
          currency,
          itemType,
          itemData,
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
      const { authorizationUrl } = data

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
      onClose()
    }
  }

  // Amount is already in NGN (1500 = ₦1,500)
  // USD equivalent = NGN / 1670 (1 USD = 1670 NGN)
  const usdEquivalent = amount / 1670

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
          <DialogDescription>
            Secure payment powered by Paystack
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Summary */}
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Item: {itemData?.title || purpose || "Purchase"}</p>
            <div className="flex justify-between items-baseline">
              <span className="text-xl font-bold">
                ₦{amount.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground">
                ${usdEquivalent.toFixed(2)} USD
              </span>
            </div>
          </div>

          {/* Error Alert */}
          {paymentStatus === "error" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* Form */}
          {paymentStatus !== "success" && (
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
                    <Input
                      id="full-name"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={isProcessing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isProcessing}
                    />
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

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing}
          >
            {paymentStatus === "success" ? "Done" : "Cancel"}
          </Button>
          {paymentStatus !== "success" && (
            <Button
              onClick={handlePayment}
              disabled={isProcessing || !email || !fullName || isLoading}
              className="gap-2"
            >
              {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
              {isProcessing ? "Processing..." : `Pay ₦${amount.toLocaleString()}`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
