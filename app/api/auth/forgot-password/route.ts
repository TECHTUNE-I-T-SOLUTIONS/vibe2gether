import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email-service"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if user exists
    const { data: user } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", email.toLowerCase())
      .single()

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true })
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Save token in verification_tokens table
    await supabase.from("verification_tokens").insert({
      user_id: user.id,
      token,
      token_type: "password_reset",
      expires_at: expiresAt.toISOString(),
    })

    // Build links — declared outside the email try so they can be logged below
    const baseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL || "http://localhost:3000"

    // Web link: opens the /reset-password page on the website
    const resetLink = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`

    // Mobile deep link: after password is reset on web, the email also contains a
    // "Open App" button that takes the user straight to the LOGIN screen.
    const loginDeepLink = `com.princetechtune.vibe2gether://login?passwordReset=true`

    // Send the password reset email
    try {
      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Reset your Vibe2Gether password</title>
          </head>
          <body style="margin:0;padding:0;background:#0f0f0f;font-family:Arial,sans-serif;color:#ffffff;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 0;">
              <tr>
                <td align="center">
                  <table width="560" cellpadding="0" cellspacing="0" style="background:#181818;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
                    <!-- Header -->
                    <tr>
                      <td style="padding:32px 40px 24px;background:linear-gradient(135deg,#7c3aed,#4f46e5);text-align:center;">
                        <h1 style="margin:0;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Vibe2Gether</h1>
                        <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.8);">Password Reset Request</p>
                      </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                      <td style="padding:40px;">
                        <p style="margin:0 0 16px;font-size:16px;color:#e5e7eb;">Hello,</p>
                        <p style="margin:0 0 24px;font-size:15px;color:#9ca3af;line-height:1.6;">
                          We received a request to reset the password for your Vibe2Gether account.
                          Click the button below to set a new password. This link will expire in <strong style="color:#ffffff;">1 hour</strong>.
                        </p>

                        <!-- Reset Password CTA -->
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="padding:8px 0 24px;">
                              <a href="${resetLink}"
                                style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#ffffff;border-radius:10px;text-decoration:none;font-size:16px;font-weight:700;letter-spacing:0.3px;">
                                Reset Password
                              </a>
                            </td>
                          </tr>
                        </table>

                        <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:0 0 24px;" />

                        <!-- Open App CTA (deep link → login screen) -->
                        <p style="margin:0 0 12px;font-size:14px;color:#9ca3af;">
                          Already reset your password on another device? Open the Vibe2Gether app and log in:
                        </p>
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="padding:0 0 24px;">
                              <a href="${loginDeepLink}"
                                style="display:inline-block;padding:12px 28px;background:rgba(124,58,237,0.15);color:#a78bfa;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600;border:1px solid rgba(124,58,237,0.4);">
                                Open App → Login
                              </a>
                            </td>
                          </tr>
                        </table>

                        <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">
                          If you did not request a password reset, you can safely ignore this email.
                          Your password will not change unless you click the button above.
                        </p>
                      </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                      <td style="padding:20px 40px;background:#111111;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
                        <p style="margin:0;font-size:12px;color:#4b5563;">© ${new Date().getFullYear()} Vibe2Gether. All rights reserved.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `

      await sendEmail({
        to: email,
        subject: "Reset your Vibe2Gether password",
        html: emailHtml,
      })
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError)
      // Don't expose email errors to the client
    }

    // Dev logging (safe — variables are in scope here)
    if (process.env.NODE_ENV === "development") {
      console.log(`[ForgotPassword] Reset link: ${resetLink}`)
      console.log(`[ForgotPassword] Mobile login deep-link: ${loginDeepLink}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
