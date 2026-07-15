import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { awardCoins } from "@/lib/coins"

// GET - Fetch posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    const supabase = await createClient()
    const session = await getServerSession(authOptions)

    // Check if current user is premium using the premium check API
    let isViewerPremium = false
    if (session?.user?.id) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'
      const premiumCheckResponse = await fetch(`${baseUrl}/api/premium/check`, {
        headers: {
          cookie: request.headers.get('cookie') || '',
        },
      })

      if (premiumCheckResponse.ok) {
        const premiumData = await premiumCheckResponse.json()
        isViewerPremium = premiumData.isPremium || false
      }
    }

    let query = supabase
      .from("posts")
      .select(
        `
        *,
        user:users(id, display_name, full_name, profile_picture, is_verified)
      `,
      )
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (userId) {
      query = query.eq("user_id", userId)
      
      // Filter premium posts if viewer is not premium and not viewing own profile
      if (!isViewerPremium && session?.user?.id !== userId) {
        query = query.eq("is_premium", false)
      }
    }

    const { data: posts, error } = await query

    if (error) throw error

    // Get like and save status for current user
    let likedPosts: string[] = []
    let savedPosts: string[] = []

    if (session?.user?.id && posts?.length) {
      const postIds = posts.map((p) => p.id)

      const [likesResult, savesResult] = await Promise.all([
        supabase.from("likes").select("post_id").eq("user_id", session.user.id).in("post_id", postIds),
        supabase.from("saved_posts").select("post_id").eq("user_id", session.user.id).in("post_id", postIds),
      ])

      likedPosts = likesResult.data?.map((l) => l.post_id) || []
      savedPosts = savesResult.data?.map((s) => s.post_id) || []
    }

    const formattedPosts = posts?.map((post) => ({
      id: post.id,
      author: {
        id: post.user?.id,
        name: post.user?.display_name || post.user?.full_name,
        username: post.user?.display_name?.toLowerCase().replace(/\s+/g, "") || "user",
        avatar: post.user?.profile_picture,
        verified: post.user?.is_verified,
        online: false,
      },
      content: post.content,
      media: post.media || [],
      likes: post.likes_count,
      comments: post.comments_count,
      views: post.views_count,
      shares: post.shares_count,
      coinsEarned: Math.floor(post.views_count / 10) + post.likes_count * 5,
      timestamp: formatTimestamp(post.created_at),
      isLiked: likedPosts.includes(post.id),
      isSaved: savedPosts.includes(post.id),
    }))

    return NextResponse.json({ posts: formattedPosts })
  } catch (error) {
    console.error("Fetch posts error:", error)
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
  }
}

// POST - Create new post
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { content, media, locationName, latitude, longitude, isPublic = true, allowComments = true } = body

    if (!content?.trim() && (!media || media.length === 0)) {
      return NextResponse.json({ error: "Post must have content or media" }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if this is user's first post
    const { count } = await supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", session.user.id)

    const isFirstPost = count === 0

    // Create post
    const { data: post, error } = await supabase
      .from("posts")
      .insert({
        user_id: session.user.id,
        content: content?.trim() || null,
        media: media || [],
        location_name: locationName || null,
        latitude: latitude || null,
        longitude: longitude || null,
        is_public: isPublic,
        allow_comments: allowComments,
      })
      .select()
      .single()

    if (error) throw error

    // Award first post bonus
    if (isFirstPost) {
      await awardCoins(session.user.id, "first_post", post.id, "post", "Bonus for your first post!")
    }

    return NextResponse.json({ post })
  } catch (error) {
    console.error("Create post error:", error)
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
  }
}

// DELETE - Delete post
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const postId = searchParams.get("id")

    if (!postId) {
      return NextResponse.json({ error: "Post ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify ownership
    const { data: post } = await supabase.from("posts").select("user_id").eq("id", postId).single()

    if (!post || post.user_id !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Delete post
    await supabase.from("posts").delete().eq("id", postId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete post error:", error)
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 })
  }
}

function formatTimestamp(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
