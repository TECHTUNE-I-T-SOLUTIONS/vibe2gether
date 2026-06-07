import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { reconcileExpiredPremiumSubscriptions } from "@/lib/premium-expiry"

/**
 * Sync premium status between premium_subscriptions and users table
 * 
 * This endpoint:
 * 1. Checks if user has an ACTIVE premium subscription (status = 'active' only, not 'pending')
 * 2. Updates the users.is_premium flag if it doesn't match
 * 3. Returns the current premium status and whether an update was made
 * 
 * Only ACTIVE subscriptions count - pending subscriptions are excluded for this sync
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated", isPremium: false },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const supabase = await createClient()
    await reconcileExpiredPremiumSubscriptions()

    // Step 1: Check for ACTIVE premium subscriptions (status = 'active' ONLY)
    const { data: activeSubscriptions, error: subError } = await supabase
      .from("premium_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active") // ONLY active, not pending
      .order("expires_at", { ascending: false })

    if (subError) {
      console.error("Error fetching premium subscriptions:", subError)
      return NextResponse.json(
        { error: "Failed to fetch subscription data", isPremium: false },
        { status: 500 }
      )
    }

    const { data: activeCoinSubscriptions, error: coinSubError } = await supabase
      .from("coin_premium_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("expires_at", { ascending: false })

    if (coinSubError) {
      console.error("Error fetching coin premium subscriptions:", coinSubError)
    }

    // Step 2: Determine if user should be premium based on active subscriptions
    const now = new Date()
    const hasActiveSubscription = Boolean(
      activeSubscriptions?.some((sub) => new Date(sub.expires_at) > now) ||
      activeCoinSubscriptions?.some((sub) => new Date(sub.expires_at) > now)
    )

    // Step 3: Get current user premium status from users table
    const { data: userRecord, error: userError } = await supabase
      .from("users")
      .select("id, is_premium")
      .eq("id", userId)
      .single()

    if (userError) {
      console.error("Error fetching user:", userError)
      return NextResponse.json(
        { error: "Failed to fetch user data", isPremium: hasActiveSubscription },
        { status: 500 }
      )
    }

    const currentlyPremium = userRecord?.is_premium ?? false
    let updatedFlag = false

    // Step 4: Update users table if premium status doesn't match
    if (currentlyPremium !== hasActiveSubscription) {
      const { error: updateError } = await supabase
        .from("users")
        .update({ is_premium: hasActiveSubscription, updated_at: new Date().toISOString() })
        .eq("id", userId)

      if (updateError) {
        console.error("Error updating user premium status:", updateError)
        return NextResponse.json(
          {
            error: "Failed to update premium status",
            isPremium: hasActiveSubscription,
            currentStatus: currentlyPremium,
            shouldBe: hasActiveSubscription,
            wasUpdated: false,
          },
          { status: 500 }
        )
      }

      updatedFlag = true
      console.log(
        `[Premium Sync] Updated user ${userId}: is_premium ${currentlyPremium} → ${hasActiveSubscription}`
      )
    }

    // Step 5: Get subscription details if premium
    let subscriptionInfo = null
    if (hasActiveSubscription) {
      const activeSubData = activeSubscriptions?.find((sub) => {
        const expiresAt = new Date(sub.expires_at)
        return expiresAt > now
      })

      if (activeSubData) {
        subscriptionInfo = {
          plan: activeSubData.plan,
          expiresAt: activeSubData.expires_at,
          daysRemaining: Math.ceil(
            (new Date(activeSubData.expires_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          ),
          paymentMethod: activeSubData.payment_method,
          autoRenew: activeSubData.auto_renew,
        }
      }
    }

    return NextResponse.json(
      {
        isPremium: hasActiveSubscription,
        currentStatus: currentlyPremium,
        shouldBe: hasActiveSubscription,
        wasUpdated: updatedFlag,
        subscription: subscriptionInfo,
        message: updatedFlag
          ? `Premium status synced: ${currentlyPremium} → ${hasActiveSubscription}`
          : "Premium status already in sync",
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error syncing premium status:", error)
    return NextResponse.json(
      { error: "Internal server error", isPremium: false },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check sync status without making changes
 * Returns current premium status and whether sync is needed
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated", isPremium: false },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const supabase = await createClient()
    await reconcileExpiredPremiumSubscriptions()

    // Check for ACTIVE premium subscriptions
    const { data: activeSubscriptions, error: subError } = await supabase
      .from("premium_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("expires_at", { ascending: false })

    if (subError) {
      console.error("Error fetching premium subscriptions:", subError)
      return NextResponse.json(
        { error: "Failed to fetch subscription data" },
        { status: 500 }
      )
    }

    const { data: activeCoinSubscriptions } = await supabase
      .from("coin_premium_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("expires_at", { ascending: false })

    // Check user current status
    const { data: userRecord, error: userError } = await supabase
      .from("users")
      .select("id, is_premium")
      .eq("id", userId)
      .single()

    if (userError) {
      console.error("Error fetching user:", userError)
      return NextResponse.json(
        { error: "Failed to fetch user data" },
        { status: 500 }
      )
    }

    const now = new Date()
    const hasActiveSubscription = Boolean(
      activeSubscriptions?.some((sub) => new Date(sub.expires_at) > now) ||
      activeCoinSubscriptions?.some((sub) => new Date(sub.expires_at) > now)
    )

    const currentlyPremium = userRecord?.is_premium ?? false
    const needsSync = currentlyPremium !== hasActiveSubscription

    return NextResponse.json(
      {
        isPremium: hasActiveSubscription,
        currentStatus: currentlyPremium,
        shouldBe: hasActiveSubscription,
        needsSync,
        activeSubscriptionCount: activeSubscriptions?.length ?? 0,
        message: needsSync
          ? `Sync needed: is_premium is ${currentlyPremium} but should be ${hasActiveSubscription}`
          : "Premium status is in sync",
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error checking premium sync status:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
