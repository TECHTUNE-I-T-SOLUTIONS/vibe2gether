import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function POST(request: NextRequest) {
  try {
    // Verify admin auth
    const token = request.cookies.get("admin_token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
      jwt.verify(token, JWT_SECRET)
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { userId, status, decisionReason } = await request.json()

    if (!userId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!["approved", "rejected", "pending"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Update verification status
    const updateData: any = {
      status,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (decisionReason) {
      updateData.decision_reason = decisionReason
    }

    const { error: updateError } = await supabase
      .from("user_verifications")
      .update(updateData)
      .eq("user_id", userId)

    if (updateError) {
      console.error("Error updating verification:", updateError)
      return NextResponse.json({ error: "Failed to update verification" }, { status: 500 })
    }

    // If approved, also update the user's is_verified status
    if (status === "approved") {
      const { error: userUpdateError } = await supabase
        .from("users")
        .update({ is_verified: true, updated_at: new Date().toISOString() })
        .eq("id", userId)

      if (userUpdateError) {
        console.error("Error updating user verification status:", userUpdateError)
        // Don't fail the request, just log the error
      }
    } else if (status === "rejected") {
      // If rejected, ensure is_verified is false
      const { error: userUpdateError } = await supabase
        .from("users")
        .update({ is_verified: false, updated_at: new Date().toISOString() })
        .eq("id", userId)

      if (userUpdateError) {
        console.error("Error updating user verification status:", userUpdateError)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Verification ${status} successfully`
    })
  } catch (error) {
    console.error("Update verification error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}