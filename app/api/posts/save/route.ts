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

    const { postId } = await request.json()
    if (!postId) {
      return NextResponse.json({ error: "Post ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if already saved
    const { data: existingSave } = await supabase
      .from("saved_posts")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("post_id", postId)
      .single()

    if (existingSave) {
      // Unsave
      await supabase.from("saved_posts").delete().eq("id", existingSave.id)
      await supabase.rpc("decrement_saves", { post_id: postId })
      return NextResponse.json({ saved: false })
    }

    // Save
    await supabase.from("saved_posts").insert({
      user_id: session.user.id,
      post_id: postId,
    })
    await supabase.rpc("increment_saves", { post_id: postId })

    return NextResponse.json({ saved: true })
  } catch (error) {
    console.error("Save error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
