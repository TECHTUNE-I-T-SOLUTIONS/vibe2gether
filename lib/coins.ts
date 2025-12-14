import { createClient } from "@/lib/supabase/server"

export const COIN_RATES = {
  view_received: 1,
  like_received: 5,
  follow_received: 10,
  comment_received: 3,
  share_received: 8,
  daily_login: 5,
  profile_complete: 50,
  first_post: 20,
  referral_signup: 100,
  welcome_bonus: 50,
} as const

export type CoinActionType = keyof typeof COIN_RATES

export async function awardCoins(
  userId: string,
  actionType: CoinActionType,
  referenceId?: string,
  referenceType?: string,
  customDescription?: string,
) {
  const supabase = await createClient()

  const amount = COIN_RATES[actionType]

  // Get current balance
  const { data: user } = await supabase
    .from("users")
    .select("coins_balance, total_coins_earned")
    .eq("id", userId)
    .single()

  if (!user) return null

  const newBalance = user.coins_balance + amount
  const newTotalEarned = user.total_coins_earned + amount

  // Update user balance
  await supabase
    .from("users")
    .update({
      coins_balance: newBalance,
      total_coins_earned: newTotalEarned,
    })
    .eq("id", userId)

  // Create transaction record
  const { data: transaction } = await supabase
    .from("coin_transactions")
    .insert({
      user_id: userId,
      amount,
      transaction_type: actionType,
      description: customDescription || getDefaultDescription(actionType),
      reference_id: referenceId || null,
      reference_type: referenceType || null,
      balance_after: newBalance,
    })
    .select()
    .single()

  return transaction
}

export async function spendCoins(
  userId: string,
  amount: number,
  description: string,
  referenceId?: string,
  referenceType?: string,
) {
  const supabase = await createClient()

  // Get current balance
  const { data: user } = await supabase.from("users").select("coins_balance").eq("id", userId).single()

  if (!user || user.coins_balance < amount) {
    return { success: false, error: "Insufficient coins" }
  }

  const newBalance = user.coins_balance - amount

  // Update user balance
  await supabase.from("users").update({ coins_balance: newBalance }).eq("id", userId)

  // Create transaction record
  await supabase.from("coin_transactions").insert({
    user_id: userId,
    amount: -amount,
    transaction_type: "spent",
    description,
    reference_id: referenceId || null,
    reference_type: referenceType || null,
    balance_after: newBalance,
  })

  return { success: true, newBalance }
}

function getDefaultDescription(actionType: CoinActionType): string {
  const descriptions: Record<CoinActionType, string> = {
    view_received: "Someone viewed your post",
    like_received: "Someone liked your post",
    follow_received: "Someone followed you",
    comment_received: "Someone commented on your post",
    share_received: "Someone shared your post",
    daily_login: "Daily login bonus",
    profile_complete: "Profile completion bonus",
    first_post: "First post bonus",
    referral_signup: "Referral signup bonus",
    welcome_bonus: "Welcome bonus",
  }
  return descriptions[actionType]
}
