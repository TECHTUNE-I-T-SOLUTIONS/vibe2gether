import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if user exists
    const { data: user } = await supabase.from("users").select("id, email").eq("email", email.toLowerCase()).single()

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true })
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Save token
    await supabase.from("verification_tokens").insert({
      user_id: user.id,
      token,
      token_type: "password_reset",
      expires_at: expiresAt.toISOString(),
    })

    // In production, send email here
    // For now, just log it
    console.log(`Password reset link: /reset-password?token=${token}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
