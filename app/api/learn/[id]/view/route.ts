import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    const { data: current } = await supabase
      .from("learn_resources")
      .select("views_count")
      .eq("id", id)
      .single()
    
    if (current) {
      await supabase
        .from("learn_resources")
        .update({ views_count: (current.views_count || 0) + 1 })
        .eq("id", id)
      
      const ip = request.headers.get("x-forwarded-for") || "unknown"
      await supabase.from("learn_resource_views").insert({
        resource_id: id,
        viewer_ip: ip
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Record resource view error:", error)
    return NextResponse.json({ error: "Failed to record view" }, { status: 500 })
  }
}
