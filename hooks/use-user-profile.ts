import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"

export interface UserProfile {
  id: string
  email: string
  full_name: string
  display_name: string | null
  date_of_birth: string | null
  gender: string | null
  bio: string | null
  profile_picture: string | null
  cover_picture: string | null
  country_code: string | null
  mobile_number: string | null
  country: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
  is_verified: boolean
  is_premium: boolean
  is_admin: boolean
  is_active: boolean
  coins_balance: number
  total_coins_earned: number
  language: string
  looking_for: string | null
  interests: string[] | null
  last_login_at: string | null
  email_verified_at: string | null
  created_at: string
  updated_at: string
  followers_count: number
  following_count: number
  referral_code: string | null
}

// Global cache to prevent duplicate fetches across components
let globalUserCache: UserProfile | null = null
let globalCacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useUserProfile() {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<UserProfile | null>(globalUserCache)
  const [loading, setLoading] = useState(!globalUserCache && status === "authenticated")
  const [error, setError] = useState<string | null>(null)
  const fetchInProgress = useRef(false)

  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      // Check if we have valid cached data
      const now = Date.now()
      if (globalUserCache && (now - globalCacheTimestamp) < CACHE_DURATION) {
        setUser(globalUserCache)
        setLoading(false)
        return
      }

      // Prevent duplicate fetches
      if (fetchInProgress.current) {
        return
      }

      fetchUserProfile()
    } else if (status === "unauthenticated") {
      setLoading(false)
      setUser(null)
    }
  }, [status, session?.user?.email])

  const fetchUserProfile = async () => {
    if (fetchInProgress.current) return

    try {
      fetchInProgress.current = true
      setLoading(true)
      setError(null)
      const response = await fetch("/api/user/profile", {
        cache: 'force-cache' // Use browser cache
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch profile")
      }

      setUser(data.user)
      // Update global cache
      globalUserCache = data.user
      globalCacheTimestamp = Date.now()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      setError(errorMessage)
      console.error("Error fetching user profile:", err)
    } finally {
      setLoading(false)
      fetchInProgress.current = false
    }
  }

  const refetch = async () => {
    // Clear cache on explicit refetch
    globalUserCache = null
    globalCacheTimestamp = 0
    fetchInProgress.current = false
    await fetchUserProfile()
  }

  return { user, loading, error, refetch }
}
