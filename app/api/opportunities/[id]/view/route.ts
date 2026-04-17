import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // We'll use an RPC for atomic increment if available, or just update
    // For now, let's just update views_count
    const { data: current } = await supabase
      .from("opportunities")
      .select("views_count")
      .eq("id", id)
      .single()
    
    if (current) {
      await supabase
        .from("opportunities")
        .update({ views_count: (current.views_count || 0) + 1 })
        .eq("id", id)
      
      // Also record in opportunity_views if needed (for analytics)
      const ip = request.headers.get("x-forwarded-for") || "unknown"
      await supabase.from("opportunity_views").insert({
        opportunity_id: id,
        viewer_ip: ip
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Record view error:", error)
    return NextResponse.json({ error: "Failed to record view" }, { status: 500 })
  }
}
