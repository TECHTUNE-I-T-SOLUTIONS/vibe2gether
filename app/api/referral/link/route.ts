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

    // Get user's referral code
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("referral_code")
      .eq("email", session.user.email)
      .single()

    if (userError || !user) {
      return Response.json({ error: "User not found" }, { status: 404 })
    }

    const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000"
    const referralLink = `${baseUrl}/signup?ref=${user.referral_code}`

    return Response.json({
      referralCode: user.referral_code,
      referralLink,
    })
  } catch (error) {
    console.error("Get referral link error:", error)
    return Response.json(
      { error: "Failed to get referral link" },
      { status: 500 }
    )
  }
}
