import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { awardCoins } from "@/lib/coins"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId } = await request.json()
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    if (userId === session.user.id) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if already following
    const { data: existingFollow } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", session.user.id)
      .eq("following_id", userId)
      .single()

    if (existingFollow) {
      // Unfollow
      await supabase.from("follows").delete().eq("id", existingFollow.id)

      // Update counts
      await supabase.rpc("decrement_followers", { user_id: userId })
      await supabase.rpc("decrement_following", { user_id: session.user.id })

      return NextResponse.json({ following: false })
    }

    // Follow
    await supabase.from("follows").insert({
      follower_id: session.user.id,
      following_id: userId,
    })

    // Update counts
    await supabase.rpc("increment_followers", { user_id: userId })
    await supabase.rpc("increment_following", { user_id: session.user.id })

    // Award coins to followed user
    await awardCoins(userId, "follow_received", session.user.id, "user")

    // Create notification
    await supabase.from("notifications").insert({
      user_id: userId,
      type: "follow",
      title: "New follower",
      message: `${session.user.name} started following you`,
      actor_id: session.user.id,
      reference_id: session.user.id,
      reference_type: "user",
      action_url: `/profile/${session.user.id}`,
    })

    return NextResponse.json({ following: true })
  } catch (error) {
    console.error("Follow error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
