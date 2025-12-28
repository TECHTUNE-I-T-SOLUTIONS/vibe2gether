import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const { postId } = await params

    console.log(`[GET /api/posts/get-post/${postId}] Fetching post details`)

    const supabase = await createClient()
    const session = await getServerSession(authOptions)

    // Fetch the specific post with all counts
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select(
        `
        id,
        content,
        tags,
        media,
        likes_count,
        comments_count,
        saves_count,
        views_count,
        created_at,
        updated_at,
        user_id,
        is_public,
        allow_comments,
        location_name,
        latitude,
        longitude,
        user:users(
          id,
          display_name,
          profile_picture,
          bio,
          followers_count
        )
      `
      )
      .eq("id", postId)
      .single()

    if (postError || !post) {
      console.error(`[GET /api/posts/get-post/${postId}] Post not found:`, postError)
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    console.log(`[GET /api/posts/get-post/${postId}] Post found with counts - likes: ${post.likes_count}, saves: ${post.saves_count}, views: ${post.views_count}`)

    // Check user interactions if logged in
    let userLiked = false
    let userSaved = false

    if (session?.user?.id) {
      console.log(`[GET /api/posts/get-post/${postId}] Checking interactions for user ${session.user.id}`)

      const [likeCheck, saveCheck] = await Promise.all([
        supabase
          .from("likes")
          .select("id")
          .eq("user_id", session.user.id)
          .eq("post_id", postId)
          .limit(1),
        supabase
          .from("saved_posts")
          .select("id")
          .eq("user_id", session.user.id)
          .eq("post_id", postId)
          .limit(1),
      ])

      userLiked = (likeCheck.data?.length || 0) > 0
      userSaved = (saveCheck.data?.length || 0) > 0

      console.log(`[GET /api/posts/get-post/${postId}] User interactions - liked: ${userLiked}, saved: ${userSaved}`)
    }

    return NextResponse.json({
      success: true,
      data: {
        ...post,
        userLiked,
        userSaved,
      },
    })
  } catch (error) {
    console.error(`[GET /api/posts/get-post] Unexpected error:`, error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
