import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "10", 10)
    const offset = (page - 1) * limit

    const supabase = await createClient()

    // Get user ID first
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Fetch user's posts with user details
    const { data: posts, error: postsError, count } = await supabase
      .from("posts")
      .select(
        `
        *,
        user:users(id, display_name, profile_picture, followers_count)
      `,
        { count: "exact" }
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (postsError) {
      console.error("Error fetching posts:", postsError)
      return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      posts: posts || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error("Posts fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
  }
}
