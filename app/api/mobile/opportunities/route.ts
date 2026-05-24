import { NextResponse } from "next/server"
import { requireMobileUser } from "../_lib/auth"

export async function GET(request: Request) {
  try {
    const { supabase } = await requireMobileUser(request)
    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get("page") || "1")
    const limit = Number(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit
    const search = searchParams.get("search") || ""
    const category = searchParams.get("category") || ""

    let query = supabase
      .from("opportunities")
      .select("id, title, description, category, location, image, price")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (search) {
      query = query.ilike("title", `%${search}%`)
    }

    if (category && category !== "All") {
      query = query.eq("category", category)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({ opportunities: data || [] })
  } catch (error) {
    console.error("Mobile opportunities error:", error)
    return NextResponse.json({ error: "Failed to fetch opportunities" }, { status: 500 })
  }
}
