import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

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

    // Check if already saved
    const { data: existingSaves, error: checkError } = await supabase
      .from("saved_posts")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("post_id", postId)
      .limit(1)

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }

    const existingSave = existingSaves?.[0]

    if (existingSave) {
      // Unsave
      const { error: deleteError } = await supabase
        .from("saved_posts")
        .delete()
        .eq("id", existingSave.id)

      if (deleteError) throw deleteError

      // Wait a moment for trigger to fire, then fetch actual count from posts table
      await new Promise(resolve => setTimeout(resolve, 100))
      const { data: countData, error: countError } = await supabase
        .from("posts")
        .select("saves_count")
        .eq("id", postId)
        .limit(1)

      const savesCount = countData?.[0]?.saves_count || 0
      return NextResponse.json({ saved: false, savesCount })
    }

    // Save
    const { error: insertError } = await supabase.from("saved_posts").insert({
      user_id: session.user.id,
      post_id: postId,
    })

    if (insertError) throw insertError

    // Wait a moment for trigger to fire, then fetch actual count from posts table
    await new Promise(resolve => setTimeout(resolve, 100))
    const { data: countData2, error: countError2 } = await supabase
      .from("posts")
      .select("saves_count")
      .eq("id", postId)
      .limit(1)

    const savesCount = countData2?.[0]?.saves_count || 0

    return NextResponse.json({ saved: true, savesCount })
  } catch (error) {
    console.error("Save error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
