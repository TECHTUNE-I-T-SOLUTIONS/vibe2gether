import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

/**
 * POST /api/announcements/[id]/track
 * Track announcement views and clicks
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { isClick } = await request.json()

    if (isClick) {
      // Increment clicks_count
      const { data: current } = await supabase
        .from("announcements")
        .select("clicks_count")
        .eq("id", id)
        .single()

      await supabase
        .from("announcements")
        .update({ clicks_count: (current?.clicks_count || 0) + 1 })
        .eq("id", id)
    } else {
      // Increment views_count
      const { data: current } = await supabase
        .from("announcements")
        .select("views_count")
        .eq("id", id)
        .single()

      await supabase
        .from("announcements")
        .update({ views_count: (current?.views_count || 0) + 1 })
        .eq("id", id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[POST /api/announcements/[id]/track] Error:", error)
    return NextResponse.json(
      { error: "Failed to track announcement" },
      { status: 500 }
    )
  }
}
