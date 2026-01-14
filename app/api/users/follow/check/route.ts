import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    if (userId === session.user.id) {
      return NextResponse.json({ following: false })
    }

    const supabase = await createClient()

    // Check if following
    const { data: existingFollow } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", session.user.id)
      .eq("following_id", userId)
      .single()

    return NextResponse.json({ following: !!existingFollow })
  } catch (error) {
    console.error("Follow check error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
