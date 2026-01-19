import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { postId } = await request.json()

    if (!postId) {
      console.error("[POST /api/posts/scroll-view] Post ID required")
      return NextResponse.json({ error: "Post ID required" }, { status: 400 })
    }

    const supabase = await createClient()
    const session = await getServerSession(authOptions)

    // Authenticate user
    const userId = session?.user?.id || null
    if (!userId) {
      console.error("[POST /api/posts/scroll-view] User must be authenticated for view tracking")
      return NextResponse.json(
        { error: "Authentication required for view tracking" },
        { status: 401 }
      )
    }

    console.log(`[POST /api/posts/scroll-view] Recording view for user: ${userId}, post: ${postId}`)

    // STEP 1: Check if this is the post creator - don't count their views
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("user_id, views_count")
      .eq("id", postId)
      .single()

    if (postError || !post) {
      console.error("[POST /api/posts/scroll-view] Post not found:", postError)
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Creator views should never be counted
    if (post.user_id === userId) {
      console.log(`[POST /api/posts/scroll-view] Post creator viewing own post - view not counted`)
      return NextResponse.json({
        success: false,
        isOwnPost: true,
        postId: postId,
        newViewCount: post.views_count || 0,
        message: "Creator views are excluded from count"
      })
    }

    // STEP 2: Check if this user has already viewed this post within last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    const { data: existingView, error: checkError, count: existingCount } = await supabase
      .from("post_views")
      .select("id, created_at", { count: "exact" })
      .eq("user_id", userId)
      .eq("post_id", postId)
      .gte("created_at", twentyFourHoursAgo)
      .limit(1)
      .maybeSingle()

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "no rows" which is fine
      console.error("[POST /api/posts/scroll-view] Error checking existing view:", checkError)
      throw checkError
    }

    // If already viewed in last 24 hours, don't record again
    if (existingView) {
      console.log(`[POST /api/posts/scroll-view] User ${userId} already viewed post ${postId} (view date: ${existingView.created_at})`)
      return NextResponse.json({
        success: true,
        isAlreadyViewed: true,
        postId: postId,
        newViewCount: post.views_count || 0,
        message: "View already counted in the last 24 hours"
      })
    }

    // STEP 3: Record new view in post_views table
    const { data: viewRecord, error: viewError } = await supabase
      .from("post_views")
      .insert({
        user_id: userId,
        post_id: postId,
        viewer_ip: null
      })
      .select("id, created_at")
      .single()

    if (viewError) {
      // Check if error is due to unique constraint (race condition - view was inserted between check and insert)
      if (viewError.code === "23505") {
        console.log(`[POST /api/posts/scroll-view] View already exists (race condition handled) - user: ${userId}, post: ${postId}`)
        
        // Fetch current view count and return
        const { data: currentPost } = await supabase
          .from("posts")
          .select("views_count")
          .eq("id", postId)
          .single()

        return NextResponse.json({
          success: true,
          isAlreadyViewed: true,
          postId: postId,
          newViewCount: currentPost?.views_count || 0,
          message: "View already recorded (race condition handled)"
        })
      }
      
      console.error("[POST /api/posts/scroll-view] Error recording view:", viewError)
      throw viewError
    }

    console.log(`[POST /api/posts/scroll-view] New view recorded for user ${userId} on post ${postId}`)

    // STEP 4: Increment views_count atomically
    const { data: updatedPost, error: updateError } = await supabase
      .rpc("increment_post_views", {
        post_id: postId
      })

    if (updateError) {
      // If RPC doesn't exist, try manual atomic update
      console.log("[POST /api/posts/scroll-view] Using manual increment")

      const { data: currentPost, error: fetchError } = await supabase
        .from("posts")
        .select("views_count")
        .eq("id", postId)
        .single()

      if (fetchError) {
        console.error("[POST /api/posts/scroll-view] Error fetching post:", fetchError)
        throw fetchError
      }

      const newCount = (currentPost?.views_count || 0) + 1
      const { error: updateErr } = await supabase
        .from("posts")
        .update({ views_count: newCount })
        .eq("id", postId)

      if (updateErr) {
        console.error("[POST /api/posts/scroll-view] Error updating views count:", updateErr)
        throw updateErr
      }

      return NextResponse.json({
        success: true,
        viewRecordId: viewRecord.id,
        postId: postId,
        newViewCount: newCount,
        viewedAt: viewRecord.created_at,
        message: "View recorded and counted successfully"
      })
    }

    // RPC succeeded
    const newViewCount = updatedPost || (post.views_count || 0) + 1
    console.log(`[POST /api/posts/scroll-view] Views incremented successfully - new count: ${newViewCount}`)

    return NextResponse.json({
      success: true,
      viewRecordId: viewRecord.id,
      postId: postId,
      newViewCount: newViewCount,
      viewedAt: viewRecord.created_at,
      message: "View recorded and counted successfully"
    })
  } catch (error) {
    console.error("[POST /api/posts/scroll-view] Unexpected error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
