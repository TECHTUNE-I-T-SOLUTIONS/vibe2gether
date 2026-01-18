import { createClient } from "@/lib/supabase/client"
import { getSession } from "next-auth/react"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "approved"

    // Get approved testimonies only or all testimonies for admin
    const query = supabase
      .from("testimonies")
      .select("*")
      .order("created_at", { ascending: false })

    if (status === "approved") {
      query.eq("status", "approved")
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Failed to fetch testimonies:", error)
    return NextResponse.json(
      { error: "Failed to fetch testimonies" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      user_name,
      user_location,
      user_avatar_url,
      rating,
      title,
      content,
      user_id,
    } = body

    // Validate required fields
    if (!user_id || !user_name || !rating || !title || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      )
    }

    const supabase = createClient()

    const { data, error } = await supabase
      .from("testimonies")
      .insert([
        {
          user_id,
          user_name,
          user_location,
          user_avatar_url,
          rating,
          title,
          content,
          status: "pending",
        },
      ])
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(
      { data: data?.[0], message: "Testimony submitted for approval" },
      { status: 201 }
    )
  } catch (error) {
    console.error("Failed to create testimony:", error)
    return NextResponse.json(
      { error: "Failed to create testimony" },
      { status: 500 }
    )
  }
}
