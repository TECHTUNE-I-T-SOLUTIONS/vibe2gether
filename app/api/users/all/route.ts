import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || null

    const supabase = await createClient()

    // Get query parameters for filtering and pagination
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""
    const country = searchParams.get("country") || ""
    const gender = searchParams.get("gender") || ""

    const offset = (page - 1) * limit

    console.log(`[GET /api/users/all] Fetching users${userId ? ` for user ${userId}` : " (public)"}`)

    let query = supabase
      .from("users")
      .select(
        `
        id,
        email,
        full_name,
        display_name,
        profile_picture,
        bio,
        gender,
        country,
        city,
        interests,
        followers_count,
        following_count,
        is_verified,
        is_premium,
        created_at
      `,
        { count: "exact" }
      )
      .eq("is_active", true) // Only active users

    // Exclude current user if logged in
    if (userId) {
      query = query.neq("id", userId)
    }

    query = query.order("created_at", { ascending: false })

    // Apply filters
    if (search) {
      query = query.or(
        `display_name.ilike.%${search}%,full_name.ilike.%${search}%,bio.ilike.%${search}%`
      )
    }

    if (country) {
      query = query.eq("country", country)
    }

    if (gender) {
      query = query.eq("gender", gender)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: users, error, count } = await query

    if (error) {
      console.error("[GET /api/users/all] Error fetching users:", error)
      throw error
    }

    let enrichedUsers = (users || []).map((user) => ({
      ...user,
      isFollowing: false,
    }))

    // Get following status if user is logged in
    if (userId) {
      const { data: followings } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", userId)

      const followingIds = new Set(followings?.map((f) => f.following_id) || [])

      enrichedUsers = enrichedUsers.map((user) => ({
        ...user,
        isFollowing: followingIds.has(user.id),
      }))
    }

    console.log(`[GET /api/users/all] Fetched ${enrichedUsers.length} users`)

    return NextResponse.json({
      users: enrichedUsers,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    console.error("[GET /api/users/all] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
