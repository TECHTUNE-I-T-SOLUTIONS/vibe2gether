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

    const { postId } = await request.json()
    if (!postId) {
      return NextResponse.json({ error: "Post ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if already liked
    const { data: existingLike } = await supabase
      .from("likes")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("post_id", postId)
      .single()

    if (existingLike) {
      // Unlike
      await supabase.from("likes").delete().eq("id", existingLike.id)

      // Decrement likes count
      await supabase.rpc("decrement_likes", { post_id: postId })

      return NextResponse.json({ liked: false })
    }

    // Like
    await supabase.from("likes").insert({
      user_id: session.user.id,
      post_id: postId,
    })

    // Increment likes count
    await supabase.rpc("increment_likes", { post_id: postId })

    // Get post owner and award coins
    const { data: post } = await supabase.from("posts").select("user_id").eq("id", postId).single()

    if (post && post.user_id !== session.user.id) {
      await awardCoins(post.user_id, "like_received", postId, "post")

      // Create notification
      await supabase.from("notifications").insert({
        user_id: post.user_id,
        type: "like",
        title: "New like on your post",
        message: `${session.user.name} liked your post`,
        actor_id: session.user.id,
        reference_id: postId,
        reference_type: "post",
        action_url: `/post/${postId}`,
      })
    }

    return NextResponse.json({ liked: true })
  } catch (error) {
    console.error("Like error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
