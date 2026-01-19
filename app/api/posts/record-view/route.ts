import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { postId } = await request.json()
    if (!postId) {
      console.error("[POST /api/posts/record-view] Post ID required")
      return NextResponse.json({ error: "Post ID required" }, { status: 400 })
    }

    console.log(`[POST /api/posts/record-view] Recording view for post ${postId}`)

    const supabase = await createClient()
    const session = await getServerSession(authOptions)

    // Check if the viewer is the post creator - if so, don't count as a view
    const { data: postData, error: postError } = await supabase
      .from("posts")
      .select("user_id")
      .eq("id", postId)
      .limit(1)

    if (postError || !postData || postData.length === 0) {
      console.error("[POST /api/posts/record-view] Post not found:", postError)
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    const postCreatorId = postData[0].user_id
    const viewerUserId = session?.user?.id

    // Don't count views from the post creator
    if (viewerUserId && viewerUserId === postCreatorId) {
      console.log(`[POST /api/posts/record-view] Post creator ${viewerUserId} viewing their own post - not counting as view`)
      
      // Still return current view count
      const { data: currentPost } = await supabase
        .from("posts")
        .select("views_count")
        .eq("id", postId)
        .limit(1)
      
      const viewsCount = currentPost?.[0]?.views_count || 0
      return NextResponse.json({ success: false, isOwnPost: true, viewsCount })
    }

    // Get viewer IP
    const headersList = await headers()
    const forwardedFor = headersList.get("x-forwarded-for")
    const viewerIp = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown"

    console.log(`[POST /api/posts/record-view] Viewer IP: ${viewerIp}`)

    // Check if this IP has already viewed this post in the last 24 hours (abuse prevention)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    const { data: existingView, error: checkError } = await supabase
      .from("post_views")
      .select("id")
      .eq("post_id", postId)
      .eq("viewer_ip", viewerIp)
      .gte("created_at", twentyFourHoursAgo)
      .limit(1)

    if (checkError) {
      console.error("[POST /api/posts/record-view] Error checking existing views:", checkError)
      throw checkError
    }

    // If IP already viewed this post recently, don't count it again (prevent abuse)
    if (existingView && existingView.length > 0) {
      console.log(`[POST /api/posts/record-view] IP ${viewerIp} already viewed this post within 24 hours - skipping count`)
      
      // Still fetch and return current view count
      const { data: currentPost } = await supabase
        .from("posts")
        .select("views_count")
        .eq("id", postId)
        .limit(1)

      const viewsCount = currentPost?.[0]?.views_count || 0
      return NextResponse.json({ success: false, alreadyViewed: true, viewsCount })
    }

    // Insert view record (new IP or first view from this IP)
    const { error: insertError } = await supabase.from("post_views").insert({
      post_id: postId,
      user_id: viewerUserId || null,
      viewer_ip: viewerIp,
    })

    if (insertError) {
      console.error("[POST /api/posts/record-view] Error recording view:", insertError)
      throw insertError
    }

    console.log(`[POST /api/posts/record-view] New view recorded from IP ${viewerIp}`)

    // Wait for trigger to fire - increased to 500ms
    console.log("[POST /api/posts/record-view] Waiting 500ms for trigger to execute...")
    await new Promise(resolve => setTimeout(resolve, 500))

    // Fetch updated view count from posts table
    const { data: updatedPost, error: updatePostError } = await supabase
      .from("posts")
      .select("views_count")
      .eq("id", postId)
      .limit(1)

    if (updatePostError) {
      console.error("[POST /api/posts/record-view] Error fetching updated views count:", updatePostError)
      throw updatePostError
    }

    if (!updatedPost || updatedPost.length === 0) {
      console.error("[POST /api/posts/record-view] Post not found after insert")
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    const viewsCount = updatedPost[0].views_count || 0
    console.log(`[POST /api/posts/record-view] View recorded successfully - new count: ${viewsCount}`)

    if (viewsCount < 1) {
      console.error(`[POST /api/posts/record-view] WARNING: View count did not increment. Expected >= 1, got: ${viewsCount}`)
    }

    return NextResponse.json({ success: true, viewsCount })
  } catch (error) {
    console.error("[POST /api/posts/record-view] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
