import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import jwt from "jsonwebtoken"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin auth with JWT token
    const token = request.cookies.get("admin_token")?.value
    if (!token) {
      console.log("[DELETE /api/admin/users] Admin token not found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
      jwt.verify(token, JWT_SECRET)
    } catch {
      console.log("[DELETE /api/admin/users] Invalid admin token")
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { id: userId } = await params

    // Verify user exists
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, full_name")
      .eq("id", userId)
      .single()

    if (userError || !userData) {
      console.log("[DELETE /api/admin/users] User not found")
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log(`[DELETE /api/admin/users] Admin deleting user ${userId} (${userData.email})`)

    // First, clear any referral relationships where this user is the referred_by
    // This removes the foreign key constraint
    const { error: referralError } = await supabase
      .from("users")
      .update({ referred_by: null })
      .eq("referred_by", userId)

    if (referralError) {
      console.warn("Warning: Could not clear referral relationships:", referralError)
      // Continue anyway as this is not critical
    }

    // Delete the user
    const { error: deleteError } = await supabase
      .from("users")
      .delete()
      .eq("id", userId)

    if (deleteError) {
      console.error("[DELETE /api/admin/users] Error deleting user:", deleteError)
      throw deleteError
    }

    console.log(`[DELETE /api/admin/users] User ${userId} deleted successfully`)

    return NextResponse.json({
      success: true,
      message: `User ${userData.email} has been permanently deleted`,
      deletedUser: {
        id: userId,
        email: userData.email,
      },
    })
  } catch (error) {
    console.error("[DELETE /api/admin/users] Unexpected error:", error)
    const errorMsg = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json(
      {
        error: "Failed to delete user",
        details: errorMsg,
      },
      { status: 500 }
    )
  }
}
