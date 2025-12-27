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

    // Validate that user_id is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(session.user.id)) {
      console.error("Invalid user ID format:", session.user.id)
      return NextResponse.json({ error: "Invalid user session" }, { status: 401 })
    }

    const { postId } = await request.json()
    if (!postId) {
      return NextResponse.json({ error: "Post ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if already liked
    const { data: existingLikes, error: checkError } = await supabase
      .from("likes")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("post_id", postId)
      .limit(1)

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }

    const existingLike = existingLikes?.[0]

    if (existingLike) {
      // Unlike - delete the like
      const { error: deleteError } = await supabase
        .from("likes")
        .delete()
        .eq("id", existingLike.id)

      if (deleteError) throw deleteError

      // Wait a moment for trigger to fire, then fetch actual count from posts table
      await new Promise(resolve => setTimeout(resolve, 100))
      const { data: postData, error: postError } = await supabase
        .from("posts")
        .select("likes_count")
        .eq("id", postId)
        .limit(1)

      const likesCount = postData?.[0]?.likes_count || 0
      return NextResponse.json({ liked: false, likesCount })
    }

    // Like - insert new like
    const { error: insertError } = await supabase.from("likes").insert({
      user_id: session.user.id,
      post_id: postId,
    })

    if (insertError) throw insertError

    // Wait a moment for trigger to fire, then fetch actual count from posts table
    await new Promise(resolve => setTimeout(resolve, 100))
    const { data: countData, error: countError } = await supabase
      .from("posts")
      .select("likes_count")
      .eq("id", postId)
      .limit(1)

    const likesCount = countData?.[0]?.likes_count || 0

    // Get post owner and award coins
    const { data: posts, error: postError } = await supabase
      .from("posts")
      .select("user_id")
      .eq("id", postId)
      .limit(1)

    const post = posts?.[0]
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

    return NextResponse.json({ liked: true, likesCount })
  } catch (error) {
    console.error("Like error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
