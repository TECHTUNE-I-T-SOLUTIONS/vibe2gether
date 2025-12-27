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

    // Check if user liked this post
    const { count: likeCount, error: likeError } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", session.user.id)
      .eq("post_id", postId)

    // Check if user saved this post
    const { count: saveCount, error: saveError } = await supabase
      .from("saved_posts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", session.user.id)
      .eq("post_id", postId)

    if (likeError) {
      console.error("Like check error:", likeError)
    }
    if (saveError) {
      console.error("Save check error:", saveError)
    }

    return NextResponse.json({
      liked: (likeCount || 0) > 0,
      saved: (saveCount || 0) > 0,
    })
  } catch (error) {
    console.error("Check interaction error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
