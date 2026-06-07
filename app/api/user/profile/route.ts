import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { reconcileExpiredPremiumSubscriptions } from "@/lib/premium-expiry"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()
    await reconcileExpiredPremiumSubscriptions()

    // Fetch user profile data
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", session.user.email)
      .single()

    if (error || !user) {
      console.error("Error fetching user profile:", error)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user,
    })
  } catch (error) {
    console.error("Profile fetch error:", error)
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json(
      {
        error: "Failed to fetch profile",
        details: message,
      },
      { status: 500 }
    )
  }
}
