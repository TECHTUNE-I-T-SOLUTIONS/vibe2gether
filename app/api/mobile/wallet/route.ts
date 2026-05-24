import { NextResponse } from "next/server"
import { requireMobileUser } from "../_lib/auth"

export async function GET(request: Request) {
  try {
    const { supabase, user } = await requireMobileUser(request)

    const [{ data: profile }, { data: transactions }, { data: referrals }, { data: pendingTransactions }] = await Promise.all([
      supabase.from("users").select("coins_balance, coins_earned, coins_spent").eq("id", user.id).single(),
      supabase.from("coin_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
      supabase
        .from("referral_bonuses")
        .select(`
          id,
          referred_user_id,
          bonus_coins,
          claimed,
          created_at,
          users!referral_bonuses_referred_user_id_fkey(id, display_name, email, profile_picture)
        `)
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.from("transactions").select("*").eq("user_id", user.id).eq("status", "pending").order("created_at", { ascending: false }),
    ])

    return NextResponse.json({
      success: true,
      wallet: {
        balance: {
          coins: profile?.coins_balance || 0,
          coinsEarned: profile?.coins_earned || 0,
          coinsSpent: profile?.coins_spent || 0,
        },
        transactions: transactions || [],
        referrals: {
          total: referrals?.length || 0,
          earned: referrals?.filter((item: any) => item.claimed).length || 0,
          pending: referrals?.filter((item: any) => !item.claimed).length || 0,
          list: (referrals || []).map((item: any) => ({
            id: item.id,
            userId: item.referred_user_id,
            userName: item.users?.display_name || "Unknown",
            amount: item.bonus_coins,
            claimed: item.claimed,
            date: item.created_at,
          })),
        },
        pending: {
          total: pendingTransactions?.length || 0,
          transactions: (pendingTransactions || []).map((item: any) => ({
            id: item.id,
            type: item.type,
            amount: item.amount / 100,
            status: item.status,
            date: item.created_at,
          })),
        },
      },
    })
  } catch (error) {
    console.error("Mobile wallet error:", error)
    return NextResponse.json({ error: "Failed to fetch wallet" }, { status: 500 })
  }
}