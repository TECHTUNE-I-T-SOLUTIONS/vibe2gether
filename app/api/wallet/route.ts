import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      console.log("[GET /api/wallet] User not authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()
    const userId = session.user.id

    console.log(`[GET /api/wallet] Fetching wallet info for user ${userId}`)

    // Get user's coins balance and wallet info
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("coins_balance, coins_earned, coins_spent")
      .eq("id", userId)
      .single()

    if (userError) {
      console.error("[GET /api/wallet] Error fetching user wallet:", userError)
      throw userError
    }

    // Get coin transaction history
    const { data: transactions, error: transError } = await supabase
      .from("coin_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50)

    if (transError) {
      console.error("[GET /api/wallet] Error fetching transactions:", transError)
      throw transError
    }

    // Get referral bonuses earned
    const { data: referrals, error: refError } = await supabase
      .from("referral_bonuses")
      .select(
        `
        id,
        referred_user_id,
        bonus_amount,
        bonus_coins,
        claimed,
        created_at,
        users!referral_bonuses_referred_user_id_fkey(id, display_name, email, profile_picture)
      `
      )
      .eq("referrer_id", userId)
      .order("created_at", { ascending: false })

    if (refError) {
      console.error("[GET /api/wallet] Error fetching referrals:", refError)
      // Don't throw, referral data is optional
    }

    // Get pending premium subscription payments
    const { data: pendingTransactions, error: pendingError } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    if (pendingError) {
      console.error("[GET /api/wallet] Error fetching pending transactions:", pendingError)
      // Don't throw, pending data is optional
    }

    const walletData = {
      balance: {
        coins: user?.coins_balance || 0,
        coinsEarned: user?.coins_earned || 0,
        coinsSpent: user?.coins_spent || 0,
      },
      transactions: transactions || [],
      referrals: {
        total: referrals?.length || 0,
        earned: referrals?.filter((r) => r.claimed).length || 0,
        pending: referrals?.filter((r) => !r.claimed).length || 0,
        list: (referrals || []).map((r) => ({
          id: r.id,
          userId: r.referred_user_id,
          userName: r.users?.display_name || "Unknown",
          amount: r.bonus_coins,
          claimed: r.claimed,
          date: r.created_at,
        })),
      },
      pending: {
        total: pendingTransactions?.length || 0,
        transactions: (pendingTransactions || []).map((t) => ({
          id: t.id,
          type: t.type,
          amount: t.amount / 100, // Convert from cents
          status: t.status,
          date: t.created_at,
        })),
      },
    }

    console.log(
      `[GET /api/wallet] Wallet loaded - balance: ${walletData.balance.coins}, transactions: ${transactions?.length || 0}`
    )

    return NextResponse.json({
      success: true,
      wallet: walletData,
    })
  } catch (error) {
    console.error("[GET /api/wallet] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
