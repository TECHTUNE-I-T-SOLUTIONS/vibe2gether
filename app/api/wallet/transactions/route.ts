import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get user
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .single()

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 })
    }

    // Get coin transactions
    const { data: transactions } = await supabase
      .from("coin_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)

    // Get coin rates
    const { data: coinRates } = await supabase
      .from("coin_rates")
      .select("*")
      .eq("is_active", true)

    // Calculate stats
    const earned = transactions
      ?.filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0) || 0

    const spent = transactions
      ?.filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0

    return Response.json({
      transactions: transactions?.map(t => ({
        id: t.id,
        type: t.transaction_type,
        description: t.description,
        amount: t.amount,
        balanceAfter: t.balance_after,
        referenceId: t.reference_id,
        referenceType: t.reference_type,
        date: t.created_at,
      })) || [],
      stats: {
        totalEarned: earned,
        totalSpent: spent,
      },
      coinRates: coinRates?.map(r => ({
        actionType: r.action_type,
        coinsAmount: r.coins_amount,
        description: r.description,
      })) || [],
    })
  } catch (error) {
    console.error("Wallet transactions fetch error:", error)
    return Response.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    )
  }
}
