import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { token, email, newPassword } = await request.json()

    if (!token || !email || !newPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: tokenRow, error: tokenError } = await supabase
      .from("verification_tokens")
      .select("id, user_id, token, token_type, expires_at")
      .eq("token", token)
      .eq("token_type", "password_reset")
      .single()

    if (tokenError || !tokenRow) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 })
    }

    if (tokenRow.expires_at && new Date(tokenRow.expires_at).getTime() < Date.now()) {
      await supabase.from("verification_tokens").delete().eq("id", tokenRow.id)
      return NextResponse.json({ error: "Reset token has expired" }, { status: 400 })
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email")
      .eq("id", tokenRow.user_id)
      .eq("email", email.toLowerCase())
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "Invalid reset request" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12)

    const { error: updateError } = await supabase
      .from("users")
      .update({
        password_hash: hashedPassword,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      return NextResponse.json({ error: "Failed to reset password" }, { status: 500 })
    }

    await supabase
      .from("verification_tokens")
      .delete()
      .eq("user_id", user.id)
      .eq("token_type", "password_reset")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}