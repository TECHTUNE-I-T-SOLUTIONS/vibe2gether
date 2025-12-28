import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      console.log("[GET /api/user/verification-status] User not authenticated")
      return NextResponse.json({ verified: false, verification: null }, { status: 200 })
    }

    const supabase = await createClient()

    console.log(`[GET /api/user/verification-status] Checking verification for user ${session.user.id}`)

    // Get user's verification status
    const { data: verification, error } = await supabase
      .from("user_verifications")
      .select("*")
      .eq("user_id", session.user.id)
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows found (not an error)
      console.error("[GET /api/user/verification-status] Error fetching verification:", error)
      throw error
    }

    if (!verification) {
      console.log(`[GET /api/user/verification-status] No verification record for user ${session.user.id}`)
      return NextResponse.json({ verified: false, verification: null }, { status: 200 })
    }

    const isVerified = verification.status === "approved"
    console.log(`[GET /api/user/verification-status] User verification status: ${verification.status}`)

    return NextResponse.json({
      verified: isVerified,
      verification: {
        id: verification.id,
        status: verification.status,
        idType: verification.id_type,
        decisionReason: verification.decision_reason,
        reviewedAt: verification.reviewed_at,
        createdAt: verification.created_at,
      },
    })
  } catch (error) {
    console.error("[GET /api/user/verification-status] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
