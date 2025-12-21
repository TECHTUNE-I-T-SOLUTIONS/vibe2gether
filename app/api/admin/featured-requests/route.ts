import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

/**
 * GET /api/admin/featured-requests
 * Fetch featured requests with filtering and pagination
 */
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
    const type = url.searchParams.get("type") || "all"
    const page = parseInt(url.searchParams.get("page") || "1")
    const limit = parseInt(url.searchParams.get("limit") || "10")

    let query = supabase.from("featured_requests").select("*", { count: "exact" })

    // Apply filters
    if (status !== "all") {
      query = query.eq("status", status)
    }
    if (type !== "all") {
      query = query.eq("type", type)
    }

    // Apply pagination
    const { data: requests, error, count } = await query
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (error) {
      console.error("Featured requests query error:", error)
      return NextResponse.json({ error: "Failed to fetch featured requests", details: error.message }, { status: 400 })
    }

    // Fetch user data separately
    const enrichedRequests = await Promise.all(
      (requests || []).map(async (req: any) => {
        const { data: userProfile } = await supabase
          .from("users")
          .select("id, full_name, avatar_url")
          .eq("id", req.user_id)
          .single()

        return {
          ...req,
          user: {
            id: req.user_id,
            full_name: userProfile?.full_name || "Unknown",
            email: "", // Email not in user_profiles, would need separate users table query if needed
            avatar_url: userProfile?.avatar_url,
          },
        }
      })
    )

    const total = count || 0

    return NextResponse.json({
      requests: enrichedRequests || [],
      count: total,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Fetch featured requests error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * PUT /api/admin/featured-requests/:id
 * Update featured request status
 */
export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Extract ID from URL path
    const pathMatch = request.nextUrl.pathname.match(/\/api\/admin\/featured-requests\/(.+)/)
    const id = pathMatch?.[1]

    if (!id) {
      return NextResponse.json({ error: "Missing featured request ID" }, { status: 400 })
    }

    const { error } = await supabase
      .from("featured_requests")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      console.error("Update error:", error)
      return NextResponse.json({ error: `Update failed: ${error.message}` }, { status: 400 })
    }

    return NextResponse.json({ message: "Updated successfully" })
  } catch (error) {
    console.error("Update featured request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/featured-requests/:id
 * Delete a featured request
 */
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get("admin_token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
      jwt.verify(token, JWT_SECRET)
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Extract ID from URL path
    const pathMatch = request.nextUrl.pathname.match(/\/api\/admin\/featured-requests\/(.+)/)
    const id = pathMatch?.[1]

    if (!id) {
      return NextResponse.json({ error: "Missing featured request ID" }, { status: 400 })
    }

    const { error } = await supabase.from("featured_requests").delete().eq("id", id)

    if (error) {
      return NextResponse.json({ error: `Delete failed: ${error.message}` }, { status: 400 })
    }

    return NextResponse.json({ message: "Deleted successfully" })
  } catch (error) {
    console.error("Delete featured request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
