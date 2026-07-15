import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get("limit") || "10") // Reduced default from 50 to 10
    const page = parseInt(url.searchParams.get("page") || "1")
    const offset = (page - 1) * limit

    // Check if user is premium using direct database query for better performance
    const { data: activeSubscriptions } = await supabase
      .from("premium_subscriptions")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .order("expires_at", { ascending: false })
      .limit(1)

    const { data: activeCoinSubscriptions } = await supabase
      .from("coin_premium_subscriptions")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .order("expires_at", { ascending: false })
      .limit(1)

    const now = new Date()
    const hasActiveSubscription = activeSubscriptions?.[0] && new Date(activeSubscriptions[0].expires_at) > now
    const hasActiveCoinSubscription = activeCoinSubscriptions?.[0] && new Date(activeCoinSubscriptions[0].expires_at) > now
    const isPremium = hasActiveSubscription || hasActiveCoinSubscription

    let allPosts: any[] = []

    // For pagination, we need consistent ordering - no shuffling
    // Fetch smaller batches for better performance
    const fetchLimit = limit
    
    // Build query for other users' posts
    let otherPostsQuery = supabase
      .from("posts")
      .select(`
        id,
        content,
        media,
        tags,
        location_name,
        created_at,
        user_id,
        likes_count,
        comments_count,
        saves_count,
        views_count,
        is_premium,
        users!inner (
          id,
          display_name,
          full_name,
          profile_picture
        )
      `)
      .neq("user_id", session.user.id) // Start with other users' posts
      .order("created_at", { ascending: false })

    // Filter out premium posts for non-premium users
    if (!isPremium) {
      otherPostsQuery = otherPostsQuery.eq("is_premium", false)
    }

    const { data: otherPosts, error: postsError } = await otherPostsQuery.range(offset, offset + fetchLimit - 1)

    if (postsError) {
      console.error("Error fetching posts:", postsError)
    } else if (otherPosts) {
      allPosts = [...otherPosts]
    }

    // Add user's own posts (always show own posts regardless of premium status)
    // Only add user posts on first page to avoid duplicates
    if (page === 1) {
      const { data: userPosts, error: userPostsError } = await supabase
        .from("posts")
        .select(`
          id,
          content,
          media,
          tags,
          location_name,
          created_at,
          user_id,
          likes_count,
          comments_count,
          saves_count,
          views_count,
          is_premium,
          users!inner (
            id,
            display_name,
            full_name,
            profile_picture
          )
        `)
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(5) // Limit user posts to 5 on first page

      if (userPostsError) {
        console.error("Error fetching user posts:", userPostsError)
      } else if (userPosts) {
        allPosts = [...allPosts, ...userPosts]
      }
    }

    // Remove duplicates by post ID (in case user posts overlap with other posts)
    const uniquePosts = Array.from(
      new Map(allPosts.map(post => [post.id, post])).values()
    )

    // Sort by created_at to maintain consistent order
    uniquePosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    const paginatedPosts = uniquePosts

    // Get post IDs for batch interaction check
    const postIds = paginatedPosts.map(post => post.id)

    // Batch check user interactions (likes and saves)
    const [likesResult, savesResult] = await Promise.all([
      supabase
        .from("likes")
        .select("post_id")
        .eq("user_id", session.user.id)
        .in("post_id", postIds),
      supabase
        .from("saved_posts")
        .select("post_id")
        .eq("user_id", session.user.id)
        .in("post_id", postIds)
    ])

    const likedPosts = new Set(likesResult.data?.map(like => like.post_id) || [])
    const savedPosts = new Set(savesResult.data?.map(save => save.post_id) || [])

    // Combine data
    const enrichedPosts = paginatedPosts.map(post => ({
      ...post,
      user: post.users,
      isLiked: likedPosts.has(post.id),
      isSaved: savedPosts.has(post.id),
    }))

    return NextResponse.json({
      posts: enrichedPosts
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })

  } catch (error) {
    console.error("Error in new-feed posts API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}