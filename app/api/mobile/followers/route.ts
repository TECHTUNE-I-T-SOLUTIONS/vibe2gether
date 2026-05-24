import { NextResponse } from "next/server"
import { requireMobileUser } from "../_lib/auth"

export async function GET(request: Request) {
  try {
    const { supabase, user } = await requireMobileUser(request)

    const { data, error } = await supabase
      .from("follows")
      .select(`
        id,
        follower:users!follows_follower_id_fkey(
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
      .eq("following_id", user.id)
      .range(0, 50)

    if (error) throw error

    return NextResponse.json({ followers: (data || []).map((item: any) => item.follower) })
  } catch (error) {
    console.error("Mobile followers error:", error)
    return NextResponse.json({ error: "Failed to fetch followers" }, { status: 500 })
  }
}