import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error("[POST /api/posts/save] Unauthorized - no session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Validate that user_id is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(session.user.id)) {
      console.error("[POST /api/posts/save] Invalid user ID format:", session.user.id)
      return NextResponse.json({ error: "Invalid user session" }, { status: 401 })
    }

    const { postId } = await request.json()
    if (!postId) {
      console.error("[POST /api/posts/save] Post ID required")
      return NextResponse.json({ error: "Post ID required" }, { status: 400 })
    }

    console.log(`[POST /api/posts/save] User ${session.user.id} toggling save on post ${postId}`)

    const supabase = await createClient()

    // Check if already saved
    const { data: existingSaves, error: checkError } = await supabase
      .from("saved_posts")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("post_id", postId)
      .limit(1)

    if (checkError && checkError.code !== 'PGRST116') {
      console.error("[POST /api/posts/save] Error checking existing saves:", checkError)
      throw checkError
    }

    const existingSave = existingSaves?.[0]

    if (existingSave) {
      // Unsave
      console.log(`[POST /api/posts/save] Removing save for user ${session.user.id} on post ${postId}`)
      
      const { error: deleteError } = await supabase
        .from("saved_posts")
        .delete()
        .eq("id", existingSave.id)

      if (deleteError) {
        console.error("[POST /api/posts/save] Error deleting save:", deleteError)
        throw deleteError
      }

      // Wait for trigger to fire - increased to 500ms
      console.log("[POST /api/posts/save] Waiting 500ms for trigger to execute...")
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const { data: countData, error: countError } = await supabase
        .from("posts")
        .select("saves_count")
        .eq("id", postId)
        .limit(1)

      if (countError) {
        console.error("[POST /api/posts/save] Error fetching updated saves count:", countError)
        throw countError
      }

      if (!countData || countData.length === 0) {
        console.error("[POST /api/posts/save] Post not found after delete")
        return NextResponse.json({ error: "Post not found" }, { status: 404 })
      }

      const savesCount = countData[0].saves_count || 0
      console.log(`[POST /api/posts/save] Unsave successful - new count: ${savesCount}`)
      
      if (savesCount < 0) {
        console.error(`[POST /api/posts/save] WARNING: Negative count detected: ${savesCount}`)
      }
      
      return NextResponse.json({ saved: false, savesCount })
    }

    // Save
    console.log(`[POST /api/posts/save] Adding save for user ${session.user.id} on post ${postId}`)
    
    const { error: insertError } = await supabase.from("saved_posts").insert({
      user_id: session.user.id,
      post_id: postId,
    })

    if (insertError) {
      console.error("[POST /api/posts/save] Error inserting save:", insertError)
      throw insertError
    }

    // Wait for trigger to fire - increased to 500ms
    console.log("[POST /api/posts/save] Waiting 500ms for trigger to execute...")
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const { data: countData2, error: countError2 } = await supabase
      .from("posts")
      .select("saves_count")
      .eq("id", postId)
      .limit(1)

    if (countError2) {
      console.error("[POST /api/posts/save] Error fetching updated saves count:", countError2)
      throw countError2
    }

    if (!countData2 || countData2.length === 0) {
      console.error("[POST /api/posts/save] Post not found after insert")
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    const savesCount = countData2[0].saves_count || 0
    console.log(`[POST /api/posts/save] Save successful - new count: ${savesCount}`)
    
    if (savesCount < 1) {
      console.error(`[POST /api/posts/save] WARNING: Count did not increment. Expected >= 1, got: ${savesCount}`)
    }

    return NextResponse.json({ saved: true, savesCount })

    return NextResponse.json({ saved: true, savesCount })
  } catch (error) {
    console.error("Save error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
