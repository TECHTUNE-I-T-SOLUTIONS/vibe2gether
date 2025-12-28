import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    const unwrappedParams = await params
    const userId = unwrappedParams.userId

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get user data
    const { data: user, error: userError } = await supabase
      .from("users")
      .select(
        `
        id,
        email,
        full_name,
        display_name,
        profile_picture,
        bio,
        city,
        country,
        followers_count,
        following_count,
        is_verified,
        is_premium,
        created_at
      `
      )
      .eq("id", userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if current user is following this user
    let isFollowing = false
    if (session?.user?.id) {
      const { data: followData } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", session.user.id)
        .eq("following_id", userId)
        .single()

      isFollowing = !!followData
    }

    return NextResponse.json({
      user,
      isFollowing,
    })
  } catch (error) {
    console.error("[GET /api/user/[userId]] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
