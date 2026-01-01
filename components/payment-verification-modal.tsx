"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"

interface PaymentVerificationModalProps {
  isOpen: boolean
  reference: string | null
  onClose: () => void
}

export function PaymentVerificationModal({ isOpen, reference, onClose }: PaymentVerificationModalProps) {
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying")
  const [message, setMessage] = useState("Verifying your payment...")

  const verifyPaymentNow = async () => {
    if (!reference) return
    try {
      setStatus("verifying")
      setMessage("Verifying your payment...")
      const response = await fetch(`/api/paystack/verify?reference=${reference}`)
      const result = await response.json()

      if (result.success && result.status === "completed") {
        setStatus("success")
        setMessage("Payment verified successfully! Your purchase is complete.")
        // Auto close after 3 seconds
        setTimeout(() => {
          onClose()
        }, 3000)
      } else {
        setStatus("error")
        setMessage(result.error || "Payment verification failed. Please contact support.")
      }
    } catch (error) {
      setStatus("error")
      setMessage("Could not verify payment. Please refresh the page.")
      console.error("Payment verification error:", error)
    }
  }

  useEffect(() => {
    if (!isOpen || !reference) return
    // Auto-verify on first load
    verifyPaymentNow()
  }, [isOpen, reference])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verifying Payment</DialogTitle>
          <DialogDescription>
            Please wait while we verify your payment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {status === "verifying" && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-center text-sm">{message}</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl" />
                <CheckCircle2 className="w-12 h-12 text-green-500 relative" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg text-green-700 dark:text-green-400">Payment Successful!</p>
                <p className="text-sm text-muted-foreground mt-1">{message}</p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        <DialogFooter>
          {status === "error" && (
            <>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={verifyPaymentNow}>
                Try Again
              </Button>
            </>
          )}
          {status !== "error" && (
            <Button onClick={onClose} disabled={status === "verifying"}>
              {status === "success" ? "Done" : "Cancel"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
