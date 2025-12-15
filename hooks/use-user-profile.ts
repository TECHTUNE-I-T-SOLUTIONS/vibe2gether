import { useState, useEffect } from "react"
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

export function useUserProfile() {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      fetchUserProfile()
    } else if (status === "unauthenticated") {
      setLoading(false)
    }
  }, [status, session?.user?.email])

  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/user/profile")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch profile")
      }

      setUser(data.user)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      setError(errorMessage)
      console.error("Error fetching user profile:", err)
    } finally {
      setLoading(false)
    }
  }

  const refetch = async () => {
    await fetchUserProfile()
  }

  return { user, loading, error, refetch }
}
