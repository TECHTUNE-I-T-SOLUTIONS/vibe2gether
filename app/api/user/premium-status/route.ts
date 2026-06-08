import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { reconcileExpiredPremiumSubscriptions } from "@/lib/premium-expiry"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      console.log("[GET /api/user/premium-status] User not authenticated")
      return NextResponse.json({ hasPremium: false, subscription: null }, { status: 200 })
    }

    const supabase = await createClient()
    await reconcileExpiredPremiumSubscriptions()

    console.log(`[GET /api/user/premium-status] Checking premium status for user ${session.user.id}`)

    // Get active premium subscription
    const now = new Date().toISOString()
    const { data: subscription, error } = await supabase
      .from("premium_subscriptions")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .gte("expires_at", now)
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows found (not an error)
      console.error("[GET /api/user/premium-status] Error fetching subscription:", error)
      throw error
    }

    if (!subscription) {
      const { data: coinSubscription, error: coinError } = await supabase
        .from("coin_premium_subscriptions")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("status", "active")
        .gte("expires_at", now)
        .order("expires_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (coinError && coinError.code !== "PGRST116") {
        console.error("[GET /api/user/premium-status] Error fetching coin subscription:", coinError)
        throw coinError
      }

      if (!coinSubscription) {
        console.log(`[GET /api/user/premium-status] No active premium subscription for user ${session.user.id}`)
        return NextResponse.json({ hasPremium: false, subscription: null }, { status: 200 })
      }

      const coinDaysUntilExpiry = Math.ceil(
        (new Date(coinSubscription.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )

      return NextResponse.json({
        hasPremium: true,
        subscription: {
          id: coinSubscription.id,
          plan: coinSubscription.plan,
          status: coinSubscription.status,
          amount: coinSubscription.coins_spent,
          startedAt: coinSubscription.activated_at,
          expiresAt: coinSubscription.expires_at,
          daysUntilExpiry: coinDaysUntilExpiry,
          autoRenew: coinSubscription.auto_renew,
          paymentMethod: "coins",
          tier: null,
        },
      })
    }

    console.log(`[GET /api/user/premium-status] User has active premium: ${subscription.plan}`)

    // Get tier information based on plan name
    const { data: tier, error: tierError } = await supabase
      .from("premium_tiers")
      .select("*")
      .eq("name", subscription.plan)
      .single()

    if (tierError && tierError.code !== "PGRST116") {
      console.error("[GET /api/user/premium-status] Error fetching tier:", tierError)
      // Don't throw - tier might not exist, just return subscription without tier
    }

    const daysUntilExpiry = Math.ceil(
      (new Date(subscription.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )

    return NextResponse.json({
      hasPremium: true,
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        amount: subscription.amount,
        startedAt: subscription.started_at,
        expiresAt: subscription.expires_at,
        daysUntilExpiry,
        autoRenew: subscription.auto_renew,
        paymentMethod: subscription.payment_method,
        tier: tier || null,
      },
    })
  } catch (error) {
    console.error("[GET /api/user/premium-status] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
