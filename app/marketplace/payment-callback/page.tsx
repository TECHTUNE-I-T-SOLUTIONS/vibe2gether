"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function PaymentCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reference = searchParams.get("reference")

  useEffect(() => {
    if (reference) {
      // Redirect back to marketplace with reference in URL
      // This will trigger the payment verification in the modal
      router.push(`/marketplace?reference=${reference}`)
    } else {
      // No reference, redirect to marketplace
      router.push("/marketplace")
    }
  }, [reference, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-lg font-medium">Processing your payment...</p>
        <p className="text-sm text-muted-foreground mt-2">Redirecting you back to marketplace</p>
      </div>
    </div>
  )
}
