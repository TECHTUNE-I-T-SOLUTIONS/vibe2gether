import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data: user, error } = await supabase
      .from("users")
      .select(
        `
        id,
        display_name,
        full_name,
        profile_picture,
        cover_picture,
        bio,
        city,
        country,
        date_of_birth,
        gender,
        interests,
        is_verified,
        created_at
      `
      )
      .eq("id", userId)
      .single()

    if (error) {
      console.error("Error fetching user:", error)
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Fetch user error:", error)
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    )
  }
}
