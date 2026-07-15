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
    const limit = parseInt(url.searchParams.get("limit") || "50")

    // Check if user is premium using the premium check API
    const premiumCheckResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/premium/check`, {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    })

    let isPremium = false
    if (premiumCheckResponse.ok) {
      const premiumData = await premiumCheckResponse.json()
      isPremium = premiumData.isPremium || false
    }

    // Generate a seed for shuffling that changes on each request
    const timestamp = Math.floor(Date.now() / 1000) // Change every second for fresh shuffling
    const sessionSeed = parseInt(session.user.id.slice(-8), 16)
    const shuffleSeed = (sessionSeed + timestamp) % 10000

    let allPosts: any[] = []

    // Get all posts (user's own + others) - fetch more than needed for shuffling
    const fetchLimit = Math.min(limit * 5, 200) // Fetch up to 5x or 200 posts max for good shuffling
    
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

    const { data: otherPosts, error: postsError } = await otherPostsQuery.limit(fetchLimit)

    if (postsError) {
      console.error("Error fetching posts:", postsError)
    } else if (otherPosts) {
      allPosts = [...otherPosts]
    }

    // Add user's own posts (always show own posts regardless of premium status)
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

    if (userPostsError) {
      console.error("Error fetching user posts:", userPostsError)
    } else if (userPosts) {
      allPosts = [...allPosts, ...userPosts]
    }

    // Shuffle all posts together using seeded shuffle for fresh randomization on each load
    const seededShuffle = (array: any[], seed: number) => {
      const shuffled = [...array]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor((seedRandom(seed + i) * (i + 1)))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      return shuffled
    }

    const seedRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000
      return x - Math.floor(x)
    }

    const shuffledPosts = seededShuffle(allPosts, shuffleSeed)

    // Take only the requested number of posts
    const paginatedPosts = shuffledPosts.slice(0, limit)

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