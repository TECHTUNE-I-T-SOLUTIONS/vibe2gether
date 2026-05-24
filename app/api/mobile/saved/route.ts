import { NextResponse } from "next/server"
import { requireMobileUser } from "../_lib/auth"

export async function GET(request: Request) {
  try {
    const { supabase, user } = await requireMobileUser(request)

    const { data, error } = await supabase
      .from("saved_posts")
      .select(`
        id,
        created_at,
        post:post_id(
          id,
          content,
          media,
          created_at,
          likes_count,
          comments_count,
          location_name,
          user_id,
          user:user_id(id, display_name, full_name, profile_picture)
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      throw error
    }

    return NextResponse.json({
      savedPosts: data || [],
    })
  } catch (error) {
    console.error("Mobile saved posts error:", error)
    return NextResponse.json({ error: "Failed to fetch saved posts" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { supabase, user } = await requireMobileUser(request)
    const { postId } = await request.json()

    if (!postId) {
      return NextResponse.json({ error: "Post ID required" }, { status: 400 })
    }

    const { error } = await supabase
      .from("saved_posts")
      .delete()
      .eq("user_id", user.id)
      .eq("post_id", postId)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Mobile unsave error:", error)
    return NextResponse.json({ error: "Failed to update saved posts" }, { status: 500 })
  }
}
