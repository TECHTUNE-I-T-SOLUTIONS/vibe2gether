import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import jwt from "jsonwebtoken"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function GET(request: NextRequest) {
  try {
    // Verify admin auth using JWT token
    const token = request.cookies.get("admin_token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
      jwt.verify(token, JWT_SECRET)
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Get all withdrawal requests with user details
    const { data, error } = await supabase
      .from("withdraw_requests")
      .select("*, user:user_id(id, display_name, email)")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Failed to fetch withdrawal requests:", error)
      return NextResponse.json(
        { error: "Failed to fetch withdrawal requests" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      withdrawals: data || [],
    })
  } catch (error) {
    console.error("Admin withdrawal fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
