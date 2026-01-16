import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useCallback, useState, useEffect } from "react"

export function usePremiumCheck() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isPremiumStatus, setIsPremiumStatus] = useState(false)
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Fetch actual premium status from database
  useEffect(() => {
    async function checkPremiumStatus() {
      try {
        setLoading(true)
        const response = await fetch("/api/premium/check")

        if (!response.ok) {
          setIsPremiumStatus(false)
          setLoading(false)
          return
        }

        const data = await response.json()
        setIsPremiumStatus(data.isPremium)
        setSubscriptionInfo(data.subscription)
      } catch (error) {
        console.error("Error checking premium status:", error)
        setIsPremiumStatus(false)
      } finally {
        setLoading(false)
      }
    }

    if (session?.user) {
      checkPremiumStatus()
    }
  }, [session?.user])

  const checkPremium = useCallback(
    (featureName: string = "Premium Feature"): boolean => {
      if (!session?.user) {
        router.push("/login")
        return false
      }

      if (!isPremiumStatus) {
        // Redirect to premium page with feature info in URL
        router.push(`/dashboard/premium?feature=${encodeURIComponent(featureName)}`)
        return false
      }

      return true
    },
    [session, router, isPremiumStatus]
  )

  return { 
    checkPremium, 
    isPremium: isPremiumStatus,
    subscriptionInfo,
    loading
  }
}
