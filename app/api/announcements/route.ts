import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    console.log("[API /announcements] Fetching active announcements")

    const supabase = await createClient()

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