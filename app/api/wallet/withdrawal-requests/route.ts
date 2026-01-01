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

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get withdrawal requests for the user
    const { data, error } = await supabase
      .from("withdraw_requests")
      .select("*")
      .eq("user_id", session.user.id)
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
      requests: data || [],
    })
  } catch (error) {
    console.error("Withdrawal requests fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
