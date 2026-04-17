import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const supabase = await createClient()

    // Check if already bookmarked
    const { data: existing } = await supabase
      .from("opportunity_bookmarks")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("opportunity_id", id)
      .single()

    if (existing) {
      // Remove bookmark
      await supabase
        .from("opportunity_bookmarks")
        .delete()
        .eq("id", existing.id)
      
      return NextResponse.json({ success: true, bookmarked: false })
    } else {
      // Add bookmark
      await supabase
        .from("opportunity_bookmarks")
        .insert({
          user_id: session.user.id,
          opportunity_id: id
        })
      
      return NextResponse.json({ success: true, bookmarked: true })
    }
  } catch (error) {
    console.error("Toggle bookmark error:", error)
    return NextResponse.json({ error: "Failed to update bookmark" }, { status: 500 })
  }
}
