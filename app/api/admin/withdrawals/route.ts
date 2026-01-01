import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is admin
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: adminUser } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (adminUser?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
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
