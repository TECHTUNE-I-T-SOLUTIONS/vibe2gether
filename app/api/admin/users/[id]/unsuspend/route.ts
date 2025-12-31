import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verify admin auth with JWT token
    const token = request.cookies.get("admin_token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
      jwt.verify(token, JWT_SECRET)
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { id: userId } = await params

    // Update user's is_active to true
    const { error: updateError } = await supabase
      .from("users")
      .update({
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (updateError) throw updateError

    return NextResponse.json({ success: true, message: "User reactivated successfully" })
  } catch (error) {
    console.error("Error unsuspending user:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to unsuspend user" },
      { status: 500 }
    )
  }
}
