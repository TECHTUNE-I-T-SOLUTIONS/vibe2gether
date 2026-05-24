import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { requireMobileUser } from "../_lib/auth"

function seedRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function seededShuffle(array: any[], seed: number) {
  const shuffled = [...array]

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seedRandom(seed + i) * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  return shuffled
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    const url = new URL(request.url)
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100)

    let mobileUserId: string | null = null

    try {
      const authenticated = await requireMobileUser(request)
      mobileUserId = authenticated.user.id
    } catch {
      mobileUserId = null
    }

    const timestamp = Math.floor(Date.now() / 1000)
    const shuffleSeed = ((mobileUserId ? parseInt(mobileUserId.slice(-8), 16) : 0) + timestamp) % 10000
    const fetchLimit = Math.min(limit * 5, 200)

    const { data: posts, error } = await supabase
      .from("posts")
      .select(`
        id,
        user_id,
        content,
        media,
        tags,
        location_name,
        created_at,
        likes_count,
        comments_count,
        saves_count,
        views_count,
        users!inner (
          id,
          display_name,
          full_name,
          profile_picture
        )
      `)
      .order("created_at", { ascending: false })
      .limit(fetchLimit)

    if (error) {
      console.error("Mobile feed fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch feed" }, { status: 500 })
    }

    const shuffledPosts = seededShuffle(posts || [], shuffleSeed).slice(0, limit)
    const postIds = shuffledPosts.map((post) => post.id)

    let likedPosts = new Set<string>()
    let savedPosts = new Set<string>()

    if (mobileUserId && postIds.length > 0) {
      const [likesResult, savesResult] = await Promise.all([
        supabase.from("likes").select("post_id").eq("user_id", mobileUserId).in("post_id", postIds),
        supabase.from("saved_posts").select("post_id").eq("user_id", mobileUserId).in("post_id", postIds),
      ])

      likedPosts = new Set(likesResult.data?.map((like: any) => like.post_id) || [])
      savedPosts = new Set(savesResult.data?.map((save: any) => save.post_id) || [])
    }

    const enrichedPosts = shuffledPosts.map((post: any) => ({
      ...post,
      user: post.users,
      isLiked: likedPosts.has(post.id),
      isSaved: savedPosts.has(post.id),
    }))

    return NextResponse.json({ posts: enrichedPosts }, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    console.error("Mobile feed error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}