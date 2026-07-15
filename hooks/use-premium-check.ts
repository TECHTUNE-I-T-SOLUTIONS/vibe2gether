import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useCallback, useState, useEffect, useRef } from "react"

// Global cache to prevent duplicate premium check calls
let globalPremiumCache: { isPremium: boolean; subscription: any } | null = null
let globalPremiumCacheTimestamp: number = 0
const PREMIUM_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function usePremiumCheck() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isPremiumStatus, setIsPremiumStatus] = useState(globalPremiumCache?.isPremium || false)
  const [subscriptionInfo, setSubscriptionInfo] = useState(globalPremiumCache?.subscription || null)
  const [loading, setLoading] = useState(!globalPremiumCache && !!session?.user)
  const fetchInProgress = useRef(false)

  // Fetch actual premium status from database
  useEffect(() => {
    async function checkPremiumStatus() {
      // Prevent duplicate fetches
      if (fetchInProgress.current) return

      // Check if we have valid cached data
      const now = Date.now()
      if (globalPremiumCache && (now - globalPremiumCacheTimestamp) < PREMIUM_CACHE_DURATION) {
        setIsPremiumStatus(globalPremiumCache.isPremium)
        setSubscriptionInfo(globalPremiumCache.subscription)
        setLoading(false)
        return
      }

      try {
        fetchInProgress.current = true
        setLoading(true)
        const response = await fetch("/api/premium/check", {
          cache: 'force-cache' // Use browser cache
        })

        if (!response.ok) {
          setIsPremiumStatus(false)
          setSubscriptionInfo(null)
          setLoading(false)
          return
        }

        const data = await response.json()
        setIsPremiumStatus(data.isPremium)
        setSubscriptionInfo(data.subscription)

        // Update global cache
        globalPremiumCache = { isPremium: data.isPremium, subscription: data.subscription }
        globalPremiumCacheTimestamp = Date.now()
      } catch (error) {
        console.error("Error checking premium status:", error)
        setIsPremiumStatus(false)
        setSubscriptionInfo(null)
      } finally {
        setLoading(false)
        fetchInProgress.current = false
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
