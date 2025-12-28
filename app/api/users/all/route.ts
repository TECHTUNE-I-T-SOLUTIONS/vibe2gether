import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      console.log("[GET /api/users/all] User not authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()
    const userId = session.user.id

    // Get query parameters for filtering and pagination
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""
    const country = searchParams.get("country") || ""
    const gender = searchParams.get("gender") || ""

    const offset = (page - 1) * limit

    console.log(`[GET /api/users/all] Fetching users for user ${userId}, page: ${page}`)

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
      .neq("id", userId) // Exclude current user
      .eq("is_active", true) // Only active users
      .order("created_at", { ascending: false })

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

    // Get following status for each user
    const { data: followings } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", userId)

    const followingIds = new Set(followings?.map((f) => f.following_id) || [])

    // Enrich users with following status
    const enrichedUsers = (users || []).map((user) => ({
      ...user,
      isFollowing: followingIds.has(user.id),
    }))

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
