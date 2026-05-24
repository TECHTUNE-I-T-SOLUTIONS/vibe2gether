import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { createClient } from "@/lib/supabase/server"

type GoogleUserInfo = {
  sub?: string
  email?: string
  email_verified?: boolean
  name?: string
  picture?: string
}

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json()

    if (!accessToken) {
      return NextResponse.json({ error: "Google access token is required" }, { status: 400 })
    }

    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!profileResponse.ok) {
      return NextResponse.json({ error: "Failed to verify Google account" }, { status: 401 })
    }

    const googleUser = (await profileResponse.json()) as GoogleUserInfo

    if (!googleUser.email) {
      return NextResponse.json({ error: "Google account did not return an email address" }, { status: 400 })
    }

    const supabase = await createClient()
    const email = googleUser.email.toLowerCase()

    const { data: existingUsers, error: lookupError } = await supabase.from("users").select("*").eq("email", email).limit(1)

    if (lookupError) {
      console.error("Google mobile lookup error:", lookupError)
      return NextResponse.json({ error: "Failed to complete Google sign-in" }, { status: 500 })
    }

    const existingUser = existingUsers && existingUsers.length > 0 ? existingUsers[0] : null
    const now = new Date().toISOString()

    let userRecord = existingUser

    if (!userRecord) {
      const { data: newUsers, error: createError } = await supabase
        .from("users")
        .insert({
          email,
          full_name: googleUser.name || "",
          display_name: googleUser.name || "",
          profile_picture: googleUser.picture || "",
          is_verified: true,
          email_verified_at: googleUser.email_verified ? now : null,
          last_login_at: now,
          password_hash: await bcrypt.hash(Math.random().toString(36), 10),
          coins_balance: 50,
          total_coins_earned: 50,
          is_active: true,
          is_premium: false,
          is_admin: false,
        })
        .select()

      if (createError || !newUsers?.[0]) {
        console.error("Google mobile create error:", createError)
        return NextResponse.json({ error: "Failed to create account" }, { status: 500 })
      }

      userRecord = newUsers[0]
    } else {
      const { error: updateError } = await supabase
        .from("users")
        .update({
          last_login_at: now,
          profile_picture: existingUser.profile_picture || googleUser.picture || existingUser.profile_picture,
          full_name: existingUser.full_name || googleUser.name || existingUser.full_name,
          display_name: existingUser.display_name || googleUser.name || existingUser.display_name,
          email_verified_at: existingUser.email_verified_at || (googleUser.email_verified ? now : existingUser.email_verified_at),
        })
        .eq("id", existingUser.id)

      if (updateError) {
        console.error("Google mobile update error:", updateError)
        return NextResponse.json({ error: "Failed to update account" }, { status: 500 })
      }

      userRecord = {
        ...existingUser,
        last_login_at: now,
      }
    }

    const secret = process.env.NEXTAUTH_SECRET || process.env.SECRET || "dev-secret"

    const token = jwt.sign(
      {
        id: userRecord.id,
        email: userRecord.email,
        isVerified: userRecord.is_verified,
        isPremium: userRecord.is_premium,
        isAdmin: userRecord.is_admin,
        coins: userRecord.coins_balance,
      },
      secret,
      { expiresIn: "30d" }
    )

    return NextResponse.json({
      user: {
        id: userRecord.id,
        email: userRecord.email,
        full_name: userRecord.full_name,
        profile_picture: userRecord.profile_picture,
      },
      token,
    })
  } catch (error) {
    console.error("Google mobile auth error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}