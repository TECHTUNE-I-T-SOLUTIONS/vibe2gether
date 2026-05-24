import { NextResponse } from "next/server"
import { requireMobileUser } from "../_lib/auth"

export async function GET(request: Request) {
  try {
    const { user } = await requireMobileUser(request)
    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error("Mobile profile error:", error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { supabase, user } = await requireMobileUser(request)
    const body = await request.json()

    const updateData: Record<string, unknown> = {}
    for (const key of ["display_name", "bio", "city", "country", "mobile_number", "looking_for", "language"]) {
      if (body[key] !== undefined) updateData[key] = body[key]
    }
    if (body.interests !== undefined) updateData.interests = body.interests

    const { data, error } = await supabase
      .from("users")
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq("id", user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, user: data })
  } catch (error) {
    console.error("Mobile profile update error:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}