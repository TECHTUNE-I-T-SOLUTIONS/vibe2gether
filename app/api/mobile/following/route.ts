import { NextResponse } from "next/server"
import { requireMobileUser } from "../_lib/auth"

export async function GET(request: Request) {
  try {
    const { supabase, user } = await requireMobileUser(request)

    const { data, error } = await supabase
      .from("follows")
      .select(`
        id,
        following:users!follows_following_id_fkey(
          id,
          display_name,
          profile_picture,
          bio,
          is_premium,
          is_verified,
          city,
          country
        )
      `)
      .eq("follower_id", user.id)
      .range(0, 50)

    if (error) throw error

    return NextResponse.json({ following: (data || []).map((item: any) => item.following) })
  } catch (error) {
    console.error("Mobile following error:", error)
    return NextResponse.json({ error: "Failed to fetch following" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { supabase, user } = await requireMobileUser(request)
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", userId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Mobile unfollow error:", error)
    return NextResponse.json({ error: "Failed to unfollow user" }, { status: 500 })
  }
}