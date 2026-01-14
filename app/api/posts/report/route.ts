import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import jwt from "jsonwebtoken"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function POST(request: NextRequest) {
  try {
    // Get user ID from session cookie
    const sessionCookie = request.cookies.get("session")?.value
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let userId: string
    try {
      const decoded = jwt.verify(sessionCookie, JWT_SECRET) as any
      userId = decoded.userId
    } catch {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    const { postId, reason, description } = await request.json()

    if (!postId || !reason) {
      return NextResponse.json(
        { error: "Post ID and reason are required" },
        { status: 400 }
      )
    }

    // Check if post exists
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("id, user_id")
      .eq("id", postId)
      .single()

    if (postError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Check if user already reported this post
    const { data: existingReport } = await supabase
      .from("post_reports")
      .select("id")
      .eq("post_id", postId)
      .eq("reporter_id", userId)
      .single()

    if (existingReport) {
      return NextResponse.json(
        { error: "You have already reported this post" },
        { status: 400 }
      )
    }

    // Create report
    const { data: report, error: createError } = await supabase
      .from("post_reports")
      .insert({
        post_id: postId,
        reporter_id: userId,
        reason: reason,
        description: description || null,
        status: "pending",
        priority: "low",
      })
      .select()
      .single()

    if (createError) {
      console.error("[POST /api/posts/report] Error creating report:", createError)
      throw createError
    }

    console.log(`[POST /api/posts/report] Report created: ${report.id}`)

    return NextResponse.json({
      success: true,
      message: "Report submitted successfully",
      reportId: report.id,
    })
  } catch (error) {
    console.error("[POST /api/posts/report] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const priority = searchParams.get("priority")
    const search = searchParams.get("search")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    let query = supabase
      .from("post_reports")
      .select(
        `id, post_id, reporter_id, reason, description, status, priority, 
         handled_by, action_taken, admin_notes, handled_at, created_at, updated_at,
         posts(id, user_id, content)`,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })

    if (status) {
      query = query.eq("status", status)
    }

    if (priority) {
      query = query.eq("priority", priority)
    }

    if (search) {
      query = query.or(
        `reason.ilike.%${search}%,description.ilike.%${search}%,posts.content.ilike.%${search}%`
      )
    }

    const { data: reports, error, count } = await query.range(offset, offset + limit - 1)

    if (error) {
      console.error("[GET /api/posts/report] Error fetching reports:", error)
      throw error
    }

    const stats = {
      total: count || 0,
      pending: 0,
      resolved: 0,
      high: 0,
      medium: 0,
      low: 0,
    }

    // Fetch stats
    const { data: allReports } = await supabase
      .from("post_reports")
      .select("status, priority")

    if (allReports) {
      allReports.forEach((report) => {
        if (report.status === "pending") stats.pending++
        if (report.status === "resolved") stats.resolved++
        if (report.priority === "high") stats.high++
        if (report.priority === "medium") stats.medium++
        if (report.priority === "low") stats.low++
      })
    }

    return NextResponse.json({
      success: true,
      reports: reports || [],
      stats,
      total: count || 0,
    })
  } catch (error) {
    console.error("[GET /api/posts/report] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
