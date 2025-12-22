import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    // Verify user is admin
    const {
      data: { user: adminUser },
    } = await supabase.auth.getUser()
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = params.id
    const { role = "moderator" } = await request.json()

    // Get user details
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single()

    if (userError) throw userError

    // Insert into admins table
    const { error: adminInsertError } = await supabase.from("admins").insert([
      {
        id: userId,
        email: user.email,
        full_name: user.full_name,
        role: role,
        created_by: adminUser.id,
        created_at: new Date().toISOString(),
      },
    ])

    if (adminInsertError) throw adminInsertError

    // Delete from users table
    const { error: userDeleteError } = await supabase
      .from("users")
      .delete()
      .eq("id", userId)

    if (userDeleteError) throw userDeleteError

    return NextResponse.json({
      success: true,
      message: `User promoted to ${role} successfully`,
    })
  } catch (error) {
    console.error("Error making user admin:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to make user admin" },
      { status: 500 }
    )
  }
}
