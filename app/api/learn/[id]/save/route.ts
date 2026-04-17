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

    // Check if already saved
    const { data: existing } = await supabase
      .from("learn_resource_saves")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("resource_id", id)
      .single()

    if (existing) {
      await supabase
        .from("learn_resource_saves")
        .delete()
        .eq("id", existing.id)
      
      return NextResponse.json({ success: true, saved: false })
    } else {
      await supabase
        .from("learn_resource_saves")
        .insert({
          user_id: session.user.id,
          resource_id: id
        })
      
      return NextResponse.json({ success: true, saved: true })
    }
  } catch (error) {
    console.error("Toggle save error:", error)
    return NextResponse.json({ error: "Failed to update save" }, { status: 500 })
  }
}
