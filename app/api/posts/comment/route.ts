import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { awardCoins } from "@/lib/coins"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    console.log("Session user ID:", session?.user?.id, "Type:", typeof session?.user?.id)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Validate that user_id is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(session.user.id)) {
      console.error("Invalid user ID format:", session.user.id)
      return NextResponse.json({ error: "Invalid user session" }, { status: 401 })
    }

    const { postId, content, parentId } = await request.json()
    if (!postId || !content?.trim()) {
      return NextResponse.json({ error: "Post ID and content required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Create comment
    const { data: comments, error: commentError } = await supabase
      .from("comments")
      .insert({
        user_id: session.user.id,
        post_id: postId,
        content: content.trim(),
        parent_id: parentId || null,
      })
      .select(
        `
        id,
        content,
        created_at,
        user:users(id, display_name, full_name, profile_picture)
      `,
      )
      .limit(1)

    if (commentError) {
      console.error("Comment creation error:", commentError)
      throw commentError
    }

    const comment = comments?.[0]
    if (!comment) {
      throw new Error("Failed to create comment")
    }

    // Wait a moment for trigger to fire, then fetch actual count from posts table
    await new Promise(resolve => setTimeout(resolve, 100))
    const { data: postData, error: postDataError } = await supabase
      .from("posts")
      .select("comments_count")
      .eq("id", postId)
      .limit(1)

    const commentsCount = postData?.[0]?.comments_count || 0

    // Get post owner and award coins
    const { data: posts, error: postError } = await supabase
      .from("posts")
      .select("user_id")
      .eq("id", postId)
      .limit(1)

    const post = posts?.[0]
    if (post && post.user_id !== session.user.id) {
      await awardCoins(post.user_id, "comment_received", postId, "post")

      // Create notification
      await supabase.from("notifications").insert({
        user_id: post.user_id,
        type: "comment",
        title: "New comment on your post",
        message: `${session.user.name}: "${content.substring(0, 50)}${content.length > 50 ? "..." : ""}"`,
        actor_id: session.user.id,
        reference_id: postId,
        reference_type: "post",
        action_url: `/post/${postId}`,
      })
    }

    return NextResponse.json({ comment, commentsCount: commentsCount || 0 })
  } catch (error) {
    console.error("Comment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const commentId = searchParams.get("id")

    if (!commentId) {
      return NextResponse.json({ error: "Comment ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get comment
    const { data: comment } = await supabase.from("comments").select("post_id, user_id").eq("id", commentId).single()

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    if (comment.user_id !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Delete comment
    await supabase.from("comments").delete().eq("id", commentId)

    // Decrement comments count
    await supabase.rpc("decrement_comments", { post_id: comment.post_id })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete comment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
