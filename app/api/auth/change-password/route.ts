import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { currentPassword, newPassword, confirmPassword } = await request.json()

    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "New passwords do not match" },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verify current password by attempting to authenticate
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: session.user.email,
        password: currentPassword,
      })

      if (authError) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 401 }
        )
      }
    } catch (error) {
      console.error("Password verification error:", error)
      return NextResponse.json(
        { error: "Failed to verify current password" },
        { status: 500 }
      )
    }

    // Update password using updateUser
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      console.error("Password update error:", updateError)
      return NextResponse.json(
        { error: "Failed to update password" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: "Password changed successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Password change error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
