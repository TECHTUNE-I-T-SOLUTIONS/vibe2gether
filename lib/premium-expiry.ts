import { createServiceRoleClient } from "@/lib/supabase/server"

type ExpiryResult = {
  expiredPremiumSubscriptions: number
  expiredCoinPremiumSubscriptions: number
  usersUpdated: number
  premiumUsersChecked: number
  checkedAt: string
}

export async function reconcileExpiredPremiumSubscriptions(): Promise<ExpiryResult> {
  const supabase = createServiceRoleClient()
  const checkedAt = new Date().toISOString()

  const { data: expiredPremium, error: premiumFetchError } = await supabase
    .from("premium_subscriptions")
    .select("id, user_id")
    .eq("status", "active")
    .lte("expires_at", checkedAt)

  if (premiumFetchError) throw premiumFetchError

  const { data: expiredCoinPremium, error: coinFetchError } = await supabase
    .from("coin_premium_subscriptions")
    .select("id, user_id")
    .eq("status", "active")
    .lte("expires_at", checkedAt)

  if (coinFetchError) throw coinFetchError

  if (expiredPremium?.length) {
    const { error } = await supabase
      .from("premium_subscriptions")
      .update({ status: "expired", auto_renew: false, updated_at: checkedAt })
      .in("id", expiredPremium.map((subscription) => subscription.id))
    if (error) throw error
  }

  if (expiredCoinPremium?.length) {
    const { error } = await supabase
      .from("coin_premium_subscriptions")
      .update({ status: "expired", auto_renew: false, updated_at: checkedAt })
      .in("id", expiredCoinPremium.map((subscription) => subscription.id))
    if (error) throw error
  }

  const { data: currentlyPremiumUsers, error: premiumUsersError } = await supabase
    .from("users")
    .select("id")
    .eq("is_premium", true)

  if (premiumUsersError) throw premiumUsersError

  const affectedUserIds = Array.from(
    new Set([
      ...(expiredPremium || []).map((subscription) => subscription.user_id),
      ...(expiredCoinPremium || []).map((subscription) => subscription.user_id),
      ...(currentlyPremiumUsers || []).map((user) => user.id),
    ].filter(Boolean))
  )

  let usersUpdated = 0
  for (const userId of affectedUserIds) {
    const [{ data: activePaid }, { data: activeCoin }] = await Promise.all([
      supabase
        .from("premium_subscriptions")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "active")
        .gt("expires_at", checkedAt)
        .limit(1),
      supabase
        .from("coin_premium_subscriptions")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "active")
        .gt("expires_at", checkedAt)
        .limit(1),
    ])

    const shouldBePremium = Boolean(activePaid?.length || activeCoin?.length)
    const { error } = await supabase
      .from("users")
      .update({ is_premium: shouldBePremium, updated_at: checkedAt })
      .eq("id", userId)

    if (error) throw error
    usersUpdated += 1
  }

  return {
    expiredPremiumSubscriptions: expiredPremium?.length || 0,
    expiredCoinPremiumSubscriptions: expiredCoinPremium?.length || 0,
    usersUpdated,
    premiumUsersChecked: affectedUserIds.length,
    checkedAt,
  }
}
