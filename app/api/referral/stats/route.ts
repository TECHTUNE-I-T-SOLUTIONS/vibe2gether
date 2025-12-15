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
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, referral_code, email")
      .eq("email", session.user.email)
      .single()

    if (userError || !user) {
      return Response.json({ error: "User not found" }, { status: 404 })
    }

    // Get referral stats
    const { data: referralBonuses } = await supabase
      .from("referral_bonuses")
      .select("*")
      .eq("referrer_id", user.id)

    const totalReferred = referralBonuses?.length || 0
    const bonusesClaimed = referralBonuses?.filter(b => b.referrer_bonus_claimed).length || 0
    const totalBonusEarned = (referralBonuses || []).reduce((sum, b) => sum + (b.referrer_bonus_claimed ? b.referrer_bonus_amount : 0), 0)

    return Response.json({
      referralCode: user.referral_code,
      totalReferred,
      bonusesClaimed,
      totalBonusEarned,
      referralBonuses: referralBonuses || [],
    })
  } catch (error) {
    console.error("Referral stats fetch error:", error)
    return Response.json(
      { error: "Failed to fetch referral stats" },
      { status: 500 }
    )
  }
}
