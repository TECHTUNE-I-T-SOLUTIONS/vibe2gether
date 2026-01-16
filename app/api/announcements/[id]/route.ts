import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import jwt from "jsonwebtoken"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

/**
 * PATCH /api/announcements/[id]
 * Update announcement (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

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

    // Update announcement with proper null handling
    const { data: announcement, error: updateError } = await supabase
      .from("announcements")
      .update({
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
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (updateError) {
      console.error("[PATCH /api/announcements] Error updating announcement:", updateError)
      throw updateError
    }

    return NextResponse.json(
      {
        success: true,
        message: "Announcement updated successfully",
        announcement,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[PATCH /api/announcements] Unexpected error:", error)
    return NextResponse.json(
      { error: "Failed to update announcement" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/announcements/[id]
 * Delete announcement (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Delete announcement
    const { error: deleteError } = await supabase
      .from("announcements")
      .delete()
      .eq("id", id)

    if (deleteError) {
      console.error("[DELETE /api/announcements] Error deleting announcement:", deleteError)
      throw deleteError
    }

    return NextResponse.json(
      {
        success: true,
        message: "Announcement deleted successfully",
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[DELETE /api/announcements] Unexpected error:", error)
    return NextResponse.json(
      { error: "Failed to delete announcement" },
      { status: 500 }
    )
  }
}
