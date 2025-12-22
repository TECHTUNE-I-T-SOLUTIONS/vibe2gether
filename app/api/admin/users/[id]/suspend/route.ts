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

    // Update user's is_active to false
    const { error: updateError } = await supabase
      .from("users")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (updateError) throw updateError

    return NextResponse.json({ success: true, message: "User suspended successfully" })
  } catch (error) {
    console.error("Error suspending user:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to suspend user" },
      { status: 500 }
    )
  }
}
