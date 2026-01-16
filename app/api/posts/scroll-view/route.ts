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

    console.log(`[POST /api/posts/scroll-view] Recording scroll view for post ${postId}`)

    const supabase = await createClient()
    const session = await getServerSession(authOptions)

    // Get user ID - filter by account to allow multiple users on same IP
    const userId = session?.user?.id || null

    if (!userId) {
      console.error("[POST /api/posts/scroll-view] User must be authenticated for view tracking")
      return NextResponse.json(
        { error: "Authentication required for view tracking" },
        { status: 401 }
      )
    }

    console.log(
      `[POST /api/posts/scroll-view] Recording view for user: ${userId}, post: ${postId}`
    )

    // Check if this user has already viewed this post in the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    const { data: existingView, error: checkError } = await supabase
      .from("post_views")
      .select("id")
      .eq("user_id", userId)
      .eq("post_id", postId)
      .gte("created_at", twentyFourHoursAgo)
      .limit(1)
      .maybeSingle()

    if (checkError) {
      console.error("[POST /api/posts/scroll-view] Error checking existing view:", checkError)
      throw checkError
    }

    // If already viewed in last 24 hours, don't record again
    if (existingView) {
      console.log(
        `[POST /api/posts/scroll-view] User ${userId} already viewed post ${postId} in last 24h`
      )
      // Still return the current count
      const { data: post } = await supabase
        .from("posts")
        .select("views_count")
        .eq("id", postId)
        .single()

      return NextResponse.json({
        success: true,
        postId: postId,
        newViewCount: post?.views_count || 0,
        message: "View already recorded in last 24 hours"
      })
    }

    // Record view in post_views table (one per user per 24 hours)
    const { data: viewRecord, error: viewError } = await supabase
      .from("post_views")
      .insert({
        user_id: userId,
        post_id: postId,
        viewer_ip: null
      })
      .select("id")
      .single()

    if (viewError) {
      console.error("[POST /api/posts/scroll-view] Error recording view:", viewError)
      throw viewError
    }

    console.log(`[POST /api/posts/scroll-view] View recorded: ${viewRecord.id}`)

    // Increment views_count on posts table
    const { data: post, error: incrementError } = await supabase
      .rpc("increment_post_views", {
        post_id: postId
      })

    if (incrementError) {
      // If RPC doesn't exist, try manual increment
      console.log("[POST /api/posts/scroll-view] RPC not found, using manual increment")

      const { data: currentPost, error: fetchError } = await supabase
        .from("posts")
        .select("views_count")
        .eq("id", postId)
        .single()

      if (fetchError) {
        console.error("[POST /api/posts/scroll-view] Error fetching post:", fetchError)
        throw fetchError
      }

      const { error: updateError } = await supabase
        .from("posts")
        .update({ views_count: (currentPost?.views_count || 0) + 1 })
        .eq("id", postId)

      if (updateError) {
        console.error("[POST /api/posts/scroll-view] Error updating views count:", updateError)
        throw updateError
      }
    }

    console.log(`[POST /api/posts/scroll-view] Post ${postId} views incremented`)

    // Get updated post data
    const { data: updatedPost, error: fetchError } = await supabase
      .from("posts")
      .select("id, views_count")
      .eq("id", postId)
      .single()

    if (fetchError) {
      console.error("[POST /api/posts/scroll-view] Error fetching updated post:", fetchError)
      throw fetchError
    }

    return NextResponse.json({
      success: true,
      viewRecordId: viewRecord.id,
      postId: postId,
      newViewCount: updatedPost?.views_count || 0,
      message: "View recorded successfully"
    })
  } catch (error) {
    console.error("[POST /api/posts/scroll-view] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
