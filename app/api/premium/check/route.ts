import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { reconcileExpiredPremiumSubscriptions } from "@/lib/premium-expiry"

/**
 * Check if user has an active premium subscription
 * 
 * This endpoint queries the premium_subscriptions table to determine
 * if a user has an active subscription with a valid expiration date.
 * 
 * Premium is considered active if:
 * - Status is 'active'
 * - Expiration date is in the future
 * 
 * NOTE: This check includes BOTH 'active' and 'pending' subscriptions for feature access
 * See /api/premium/sync for strict 'active' only checks
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ isPremium: false, subscription: null }, { status: 200 })
    }

    const userId = session.user.id
    const supabase = await createClient()
    await reconcileExpiredPremiumSubscriptions()

    // Query the premium_subscriptions table for active subscriptions
    const { data: subscriptions, error } = await supabase
      .from("premium_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active") // Only active subscriptions
      .order("expires_at", { ascending: false })

    if (error) {
      console.error("Error fetching premium subscriptions:", error)
      return NextResponse.json({ isPremium: false, subscription: null }, { status: 200 })
    }

    // Check if user has an active subscription that hasn't expired
    const now = new Date()
    const activeSubscription = subscriptions?.find((sub) => {
      const expiresAt = new Date(sub.expires_at)
      return expiresAt > now
    })

    if (activeSubscription) {
      return NextResponse.json(
        {
          isPremium: true,
          subscription: {
            plan: activeSubscription.plan,
            expiresAt: activeSubscription.expires_at,
            daysRemaining: Math.ceil(
              (new Date(activeSubscription.expires_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            ),
          },
        },
        { status: 200 }
      )
    }

    const { data: coinSubscriptions, error: coinError } = await supabase
      .from("coin_premium_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("expires_at", { ascending: false })

    if (!coinError) {
      const activeCoinSubscription = coinSubscriptions?.find((sub) => {
        const expiresAt = new Date(sub.expires_at)
        return expiresAt > now
      })

      if (activeCoinSubscription) {
        return NextResponse.json(
          {
            isPremium: true,
            subscription: {
              plan: activeCoinSubscription.plan,
              expiresAt: activeCoinSubscription.expires_at,
              paymentMethod: "coins",
              daysRemaining: Math.ceil(
                (new Date(activeCoinSubscription.expires_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
              ),
            },
          },
          { status: 200 }
        )
      }
    }

    // Also check for pending paid subscriptions that haven't expired (payment in progress only)
    const { data: pendingSubscriptions, error: pendingError } = await supabase
      .from("premium_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "pending") // Pending subscriptions
      .order("expires_at", { ascending: false })

    if (!pendingError && pendingSubscriptions?.length > 0) {
      const pendingSubscription = pendingSubscriptions.find((sub) => {
        const expiresAt = new Date(sub.expires_at)
        return expiresAt > now
      })

      if (pendingSubscription) {
        // User has a pending subscription - treat as premium for UX
        return NextResponse.json(
          {
            isPremium: true,
            subscription: {
              plan: pendingSubscription.plan,
              expiresAt: pendingSubscription.expires_at,
              status: "pending",
              daysRemaining: Math.ceil(
                (new Date(pendingSubscription.expires_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
              ),
            },
          },
          { status: 200 }
        )
      }
    }

    return NextResponse.json({ isPremium: false, subscription: null }, { status: 200 })
  } catch (error) {
    console.error("Error checking premium status:", error)
    return NextResponse.json({ isPremium: false, subscription: null, error: "Internal server error" }, { status: 500 })
  }
}
