import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { awardCoins } from "@/lib/coins"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error("[POST /api/posts/like] Unauthorized - no session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Validate that user_id is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(session.user.id)) {
      console.error("[POST /api/posts/like] Invalid user ID format:", session.user.id)
      return NextResponse.json({ error: "Invalid user session" }, { status: 401 })
    }

    const { postId } = await request.json()
    if (!postId) {
      console.error("[POST /api/posts/like] Post ID required")
      return NextResponse.json({ error: "Post ID required" }, { status: 400 })
    }

    console.log(`[POST /api/posts/like] User ${session.user.id} toggling like on post ${postId}`)

    const supabase = await createClient()

    // Check if already liked
    const { data: existingLikes, error: checkError } = await supabase
      .from("likes")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("post_id", postId)
      .limit(1)

    if (checkError && checkError.code !== 'PGRST116') {
      console.error("[POST /api/posts/like] Error checking existing likes:", checkError)
      throw checkError
    }

    const existingLike = existingLikes?.[0]

    if (existingLike) {
      // Unlike - delete the like
      console.log(`[POST /api/posts/like] Removing like for user ${session.user.id} on post ${postId}`)
      
      const { error: deleteError } = await supabase
        .from("likes")
        .delete()
        .eq("id", existingLike.id)

      if (deleteError) {
        console.error("[POST /api/posts/like] Error deleting like:", deleteError)
        throw deleteError
      }

      // Wait for trigger to fire - increased to 500ms
      console.log("[POST /api/posts/like] Waiting 500ms for trigger to execute...")
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const { data: postData, error: postError } = await supabase
        .from("posts")
        .select("likes_count")
        .eq("id", postId)
        .limit(1)

      if (postError) {
        console.error("[POST /api/posts/like] Error fetching updated likes count:", postError)
        throw postError
      }

      if (!postData || postData.length === 0) {
        console.error("[POST /api/posts/like] Post not found after delete")
        return NextResponse.json({ error: "Post not found" }, { status: 404 })
      }

      const likesCount = postData[0].likes_count || 0
      console.log(`[POST /api/posts/like] Unlike successful - new count: ${likesCount}`)
      
      if (likesCount < 0) {
        console.error(`[POST /api/posts/like] WARNING: Negative count detected: ${likesCount}`)
      }
      
      return NextResponse.json({ liked: false, likesCount })
    }

    // Like - insert new like
    console.log(`[POST /api/posts/like] Adding like for user ${session.user.id} on post ${postId}`)
    
    const { error: insertError } = await supabase.from("likes").insert({
      user_id: session.user.id,
      post_id: postId,
    })

    if (insertError) {
      console.error("[POST /api/posts/like] Error inserting like:", insertError)
      throw insertError
    }

    // Wait for trigger to fire - increased to 500ms
    console.log("[POST /api/posts/like] Waiting 500ms for trigger to execute...")
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const { data: countData, error: countError } = await supabase
      .from("posts")
      .select("likes_count")
      .eq("id", postId)
      .limit(1)

    if (countError) {
      console.error("[POST /api/posts/like] Error fetching updated likes count:", countError)
      throw countError
    }

    if (!countData || countData.length === 0) {
      console.error("[POST /api/posts/like] Post not found after insert")
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    const likesCount = countData[0].likes_count || 0
    console.log(`[POST /api/posts/like] Like successful - new count: ${likesCount}`)
    
    if (likesCount < 1) {
      console.error(`[POST /api/posts/like] WARNING: Count did not increment. Expected >= 1, got: ${likesCount}`)
    }

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
