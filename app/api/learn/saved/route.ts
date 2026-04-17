import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("learn_resource_saves")
      .select(`
        resource_id,
        resource:learn_resources(
          *,
          user:users(id, display_name, full_name, profile_picture, is_verified)
        )
      `)
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    const formatted = data?.map(item => ({
      ...item.resource,
      isSaved: true
    }))

    return NextResponse.json({ success: true, resources: formatted })
  } catch (error) {
    console.error("Fetch saved resources error:", error)
    return NextResponse.json({ error: "Failed to fetch saved resources" }, { status: 500 })
  }
}
