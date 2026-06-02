import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

// GET - Fetch all approved opportunities
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
      .from("opportunities")
      .select(`
        *,
        user:users(id, display_name, full_name, profile_picture, is_verified),
        admin:admins!opportunities_admin_id_fkey(id, full_name, profile_picture)
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    query = query.in("status", ["approved", "rejected"])

    if (category && category !== "All") {
      query = query.eq("category", category)
    }

    const { data: opportunities, error } = await query
    if (error) throw error

    // Get bookmark status if logged in
    let bookmarkedIds: string[] = []
    if (session?.user?.id && opportunities?.length) {
      const oppIds = opportunities.map(o => o.id)
      const { data: bookmarks } = await supabase
        .from("opportunity_bookmarks")
        .select("opportunity_id")
        .eq("user_id", session.user.id)
        .in("opportunity_id", oppIds)
      
      bookmarkedIds = bookmarks?.map(b => b.opportunity_id) || []
    }

    const formatted = opportunities?.map(opp => ({
      ...opp,
      isBookmarked: bookmarkedIds.includes(opp.id)
    }))

    return NextResponse.json({ success: true, opportunities: formatted })
  } catch (error) {
    console.error("Fetch opportunities error:", error)
    return NextResponse.json({ error: "Failed to fetch opportunities" }, { status: 500 })
  }
}

// POST - Create new opportunity
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, content, image_url, link_url, category, location } = body

    if (!title || !description || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: opportunity, error } = await supabase
      .from("opportunities")
      .insert({
        user_id: session.user.id,
        title,
        description,
        content,
        image_url,
        link_url,
        category,
        location,
        status: "pending"
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, opportunity })
  } catch (error) {
    console.error("Create opportunity error:", error)
    return NextResponse.json({ error: "Failed to create opportunity" }, { status: 500 })
  }
}
