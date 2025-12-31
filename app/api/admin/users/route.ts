import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function GET(request: NextRequest) {
  try {
    // Verify admin auth
    const token = request.cookies.get("admin_token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
      jwt.verify(token, JWT_SECRET)
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Get query parameters
    const url = new URL(request.url)
    const status = url.searchParams.get("status") || "all"
    const search = url.searchParams.get("search") || ""
    const page = parseInt(url.searchParams.get("page") || "1")
    const limit = parseInt(url.searchParams.get("limit") || "20")

    // Fetch user profiles
    let query = supabase.from("users").select("*", { count: "exact" })

    // Apply search filter
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Apply status filter
    if (status === "active") {
      query = query.eq("is_active", true)
    } else if (status === "inactive") {
      query = query.eq("is_active", false)
    }

    // Apply pagination
    const { data: users, error, count } = await query
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch users: ${error.message}` },
        { status: 400 }
      )
    }

    // Fetch premium subscriptions
    const { data: premiumSubs } = await supabase
      .from("premium_subscriptions")
      .select("user_id")
    const premiumUserIds = new Set(premiumSubs?.map((s: any) => s.user_id) ?? [])

    // Fetch user verifications
    const { data: verifications } = await supabase
      .from("user_verifications")
      .select("user_id, status")
    const verificationMap = new Map(
      verifications?.map((v: any) => [v.user_id, v.status]) ?? []
    )

    // Check which users are banned
    const { data: bannedUsers } = await supabase
      .from("banned_users")
      .select("id")
    const bannedUserIds = new Set(bannedUsers?.map((b: any) => b.id) ?? [])

    // Enrich users with premium status, verification details, and ban status
    const enrichedUsers = (users || []).map((user: any) => ({
      ...user,
      is_premium: premiumUserIds.has(user.id),
      is_verified: verificationMap.get(user.id) === "approved",
      verification_status: verificationMap.get(user.id) || null,
      is_banned: bannedUserIds.has(user.id),
    }))

    // Get stats
    const { data: allUsers } = await supabase.from("users").select("id, is_active, created_at")

    const totalUsers = count || 0
    const activeUsers = allUsers?.filter((u: any) => u.is_active).length || 0
    const premiumUsers = Array.from(premiumUserIds).length
    const newThisWeek = allUsers?.filter((u: any) => {
      const createdDate = new Date(u.created_at)
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return createdDate > oneWeekAgo
    }).length || 0

    return NextResponse.json({
      users: enrichedUsers,
      pagination: {
        total: totalUsers,
        page,
        limit,
        pages: Math.ceil(totalUsers / limit),
      },
      stats: {
        total: totalUsers,
        active: activeUsers,
        premium: premiumUsers,
        newThisWeek,
      },
    })
  } catch (error) {
    console.error("Fetch users error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
