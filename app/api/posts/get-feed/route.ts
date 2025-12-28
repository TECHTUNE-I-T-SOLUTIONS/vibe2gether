import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    console.log(`[GET /api/posts/get-feed] Fetching feed - page: ${page}, limit: ${limit}, offset: ${offset}`)

    const supabase = await createClient()
    const session = await getServerSession(authOptions)

    // Fetch public posts with all engagement counts
    const { data: posts, error: postsError, count } = await supabase
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
      `,
        { count: "exact" }
      )
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (postsError) {
      console.error("[GET /api/posts/get-feed] Error fetching posts:", postsError)
      return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
    }

    console.log(`[GET /api/posts/get-feed] Fetched ${posts?.length || 0} posts`)

    // If user is logged in, get their interaction status
    let userInteractions: {
      [postId: string]: { liked: boolean; saved: boolean }
    } = {}

    if (session?.user?.id && posts?.length) {
      const postIds = posts.map((p) => p.id)
      console.log(`[GET /api/posts/get-feed] Checking interactions for user ${session.user.id}`)

      // Get likes
      const { data: likes, error: likesError } = await supabase
        .from("likes")
        .select("post_id")
        .eq("user_id", session.user.id)
        .in("post_id", postIds)

      // Get saves
      const { data: saves, error: savesError } = await supabase
        .from("saved_posts")
        .select("post_id")
        .eq("user_id", session.user.id)
        .in("post_id", postIds)

      if (likesError) console.error("[GET /api/posts/get-feed] Error fetching likes:", likesError)
      if (savesError) console.error("[GET /api/posts/get-feed] Error fetching saves:", savesError)

      // Build interactions map
      likes?.forEach((l) => {
        if (!userInteractions[l.post_id]) userInteractions[l.post_id] = { liked: false, saved: false }
        userInteractions[l.post_id].liked = true
      })

      saves?.forEach((s) => {
        if (!userInteractions[s.post_id]) userInteractions[s.post_id] = { liked: false, saved: false }
        userInteractions[s.post_id].saved = true
      })

      console.log(`[GET /api/posts/get-feed] User interactions found: ${Object.keys(userInteractions).length}`)
    }

    const formattedPosts = posts?.map((post) => ({
      ...post,
      userLiked: userInteractions[post.id]?.liked || false,
      userSaved: userInteractions[post.id]?.saved || false,
    })) || []

    return NextResponse.json({
      success: true,
      data: formattedPosts,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error("[GET /api/posts/get-feed] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
