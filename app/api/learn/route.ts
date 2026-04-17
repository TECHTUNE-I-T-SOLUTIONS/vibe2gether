import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

// GET - Fetch all approved resources
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const offset = (page - 1) * limit

    const supabase = await createClient()
    const session = await getServerSession(authOptions)

    let query = supabase
      .from("learn_resources")
      .select(`
        *,
        user:users(id, display_name, full_name, profile_picture, is_verified),
        admin:admins!learn_resources_admin_id_fkey(id, full_name, profile_picture)
      `)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (category && category !== "All") {
      query = query.eq("category", category)
    }

    const { data: resources, error } = await query
    if (error) throw error

    // Get save status if logged in
    let savedIds: string[] = []
    if (session?.user?.id && resources?.length) {
      const resIds = resources.map(r => r.id)
      const { data: saves } = await supabase
        .from("learn_resource_saves")
        .select("resource_id")
        .eq("user_id", session.user.id)
        .in("resource_id", resIds)
      
      savedIds = saves?.map(s => s.resource_id) || []
    }

    const formatted = resources?.map(res => ({
      ...res,
      isSaved: savedIds.includes(res.id)
    }))

    return NextResponse.json({ success: true, resources: formatted })
  } catch (error) {
    console.error("Fetch resources error:", error)
    return NextResponse.json({ error: "Failed to fetch resources" }, { status: 500 })
  }
}

// POST - Create new resource
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, content, image_url, link_url, category } = body

    if (!title || !description || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: resource, error } = await supabase
      .from("learn_resources")
      .insert({
        user_id: session.user.id,
        title,
        description,
        content,
        image_url,
        link_url,
        category,
        status: "pending"
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, resource })
  } catch (error) {
    console.error("Create resource error:", error)
    return NextResponse.json({ error: "Failed to create resource" }, { status: 500 })
  }
}
