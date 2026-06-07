import { createClient } from "@/lib/supabase/server"

/**
 * Sync premium status between premium_subscriptions and users table
 * 
 * This function:
 * 1. Checks if user has an ACTIVE premium subscription (status = 'active' only)
 * 2. Updates the users.is_premium flag if it doesn't match the subscription status
 * 3. Returns the actual premium status
 * 
 * Usage in API routes:
 * const isPremium = await syncUserPremiumStatus(userId)
 */
export async function syncUserPremiumStatus(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient()

    // Check for ACTIVE premium subscriptions (status = 'active' ONLY)
    const { data: activeSubscriptions, error: subError } = await supabase
      .from("premium_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active") // ONLY active, not pending
      .gt("expires_at", new Date().toISOString())
      .order("expires_at", { ascending: false })

    if (subError) {
      console.error("Error fetching premium subscriptions:", subError)
      return false
    }

    const now = new Date()
    const { data: activeCoinSubscriptions } = await supabase
      .from("coin_premium_subscriptions")
      .select("expires_at")
      .eq("user_id", userId)
      .eq("status", "active")
      .gt("expires_at", now.toISOString())

    const hasActiveSubscription = Boolean(activeSubscriptions?.length || activeCoinSubscriptions?.length)

    // Get current user premium status
    const { data: userRecord, error: userError } = await supabase
      .from("users")
      .select("id, is_premium")
      .eq("id", userId)
      .single()

    if (userError) {
      console.error("Error fetching user:", userError)
      return hasActiveSubscription
    }

    const currentlyPremium = userRecord?.is_premium ?? false

    // Update users table if premium status doesn't match
    if (currentlyPremium !== hasActiveSubscription) {
      const { error: updateError } = await supabase
        .from("users")
        .update({ is_premium: hasActiveSubscription, updated_at: new Date().toISOString() })
        .eq("id", userId)

      if (updateError) {
        console.error("Error updating user premium status:", updateError)
        return hasActiveSubscription
      }

      console.log(
        `[Premium Sync] Synced user ${userId}: is_premium ${currentlyPremium} → ${hasActiveSubscription}`
      )
    }

    return hasActiveSubscription
  } catch (error) {
    console.error("Error syncing premium status:", error)
    return false
  }
}

/**
 * Check if user has any active premium subscription (used for non-critical checks)
 * This includes both 'active' and 'pending' subscriptions
 */
export async function hasActivePremiumSubscription(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient()

    const now = new Date()

    // Check for ACTIVE subscriptions
    const { data: activeSubscriptions } = await supabase
      .from("premium_subscriptions")
      .select("expires_at")
      .eq("user_id", userId)
      .eq("status", "active")
      .gt("expires_at", now.toISOString())
      .limit(1)

    if (activeSubscriptions?.length) {
      return true
    }

    const { data: activeCoinSubscriptions } = await supabase
      .from("coin_premium_subscriptions")
      .select("expires_at")
      .eq("user_id", userId)
      .eq("status", "active")
      .gt("expires_at", now.toISOString())
      .limit(1)

    if (activeCoinSubscriptions?.length) {
      return true
    }

    return false
  } catch (error) {
    console.error("Error checking premium subscription:", error)
    return false
  }
}

/**
 * Get subscription details for a user
 * Returns the earliest expiring active subscription with details
 */
export async function getUserSubscriptionDetails(userId: string) {
  try {
    const supabase = await createClient()

    const { data: subscriptions, error } = await supabase
      .from("premium_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString())
      .order("expires_at", { ascending: true })
      .limit(1)

    if (error || !subscriptions?.length) {
      return null
    }

    const sub = subscriptions[0]
    const expiresAt = new Date(sub.expires_at)
    const now = new Date()

    if (expiresAt < now) {
      return null // Subscription has expired
    }

    return {
      plan: sub.plan,
      expiresAt: sub.expires_at,
      daysRemaining: Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      paymentMethod: sub.payment_method,
      autoRenew: sub.auto_renew,
    }
  } catch (error) {
    console.error("Error getting subscription details:", error)
    return null
  }
}
