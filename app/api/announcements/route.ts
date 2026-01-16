import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import jwt from "jsonwebtoken"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function GET(request: NextRequest) {
  try {
    console.log("[API /announcements] Fetching active announcements")

    // Get active announcements that haven't expired
    const { data: announcements, error } = await supabase
      .from("announcements")
      .select("*")
      .eq("is_active", true)
      .eq("is_published", true)
      .or("expires_at.is.null,expires_at.gt." + new Date().toISOString())
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[API /announcements] Database error:", error)
      return NextResponse.json(
        { error: "Failed to fetch announcements" },
        { status: 500 }
      )
    }

    console.log(`[API /announcements] Found ${announcements?.length || 0} active announcements`)

    return NextResponse.json({
      announcements: announcements || [],
      success: true
    })

  } catch (error) {
    console.error("[API /announcements] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/announcements
 * Create announcement (admin only)
 */
export async function POST(request: NextRequest) {
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

    const {
      title,
      message,
      description,
      type,
      priority,
      backgroundColor,
      textColor,
      icon,
      imageUrl,
      actionUrl,
      actionLabel,
      isActive,
      isPublished,
      scheduledAt,
      expiresAt,
    } = await request.json()

    if (!title || !message) {
      return NextResponse.json(
        { error: "Title and message are required" },
        { status: 400 }
      )
    }

    // Get admin user ID from token
    const decoded = jwt.verify(token, JWT_SECRET) as any
    const adminId = decoded.id

    // Create announcement with proper null handling
    const { data: announcement, error: createError } = await supabase
      .from("announcements")
      .insert({
        admin_id: adminId,
        title,
        message,
        description: description ?? null,
        type: type || "general",
        priority: priority || "normal",
        background_color: backgroundColor || "#6366f1",
        text_color: textColor || "#ffffff",
        icon: icon ?? null,
        image_url: imageUrl ?? null,
        action_url: actionUrl ?? null,
        action_label: actionLabel ?? null,
        is_active: isActive !== false,
        is_published: isPublished !== false,
        scheduled_at: scheduledAt ?? null,
        expires_at: expiresAt ?? null,
      })
      .select()
      .single()

    if (createError) {
      console.error("[POST /api/announcements] Error creating announcement:", createError)
      throw createError
    }

    return NextResponse.json(
      {
        success: true,
        message: "Announcement created successfully",
        announcement,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[POST /api/announcements] Unexpected error:", error)
    return NextResponse.json(
      { error: "Failed to create announcement" },
      { status: 500 }
    )
  }
}