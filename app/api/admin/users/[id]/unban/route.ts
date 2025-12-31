import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verify admin auth with JWT token
    const token = request.cookies.get("admin_token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
      jwt.verify(token, JWT_SECRET)
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { id: userId } = await params

    // Get banned user details
    const { data: bannedUser, error: fetchError } = await supabase
      .from("banned_users")
      .select("*")
      .eq("id", userId)
      .single()

    if (fetchError || !bannedUser) {
      return NextResponse.json({ error: "User not found in banned users" }, { status: 404 })
    }

    // Check if user already exists in users table
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single()

    // If user doesn't exist in users table, insert them back
    if (!existingUser) {
      const { error: insertError } = await supabase.from("users").insert([
        {
          id: bannedUser.id,
          email: bannedUser.email,
          password_hash: bannedUser.password_hash,
          full_name: bannedUser.full_name,
          display_name: bannedUser.display_name,
          date_of_birth: bannedUser.date_of_birth,
          gender: bannedUser.gender,
          bio: bannedUser.bio,
          profile_picture: bannedUser.profile_picture,
          cover_picture: bannedUser.cover_picture,
          country_code: bannedUser.country_code,
          mobile_number: bannedUser.mobile_number,
          country: bannedUser.country,
          city: bannedUser.city,
          latitude: bannedUser.latitude,
          longitude: bannedUser.longitude,
          is_verified: bannedUser.is_verified,
          is_premium: bannedUser.is_premium,
          is_admin: false,
          is_active: true,
          coins_balance: bannedUser.coins_balance,
          total_coins_earned: bannedUser.total_coins_earned,
          language: bannedUser.language,
          looking_for: bannedUser.looking_for,
          interests: bannedUser.interests,
          last_login_at: bannedUser.last_login_at,
          email_verified_at: bannedUser.email_verified_at,
          created_at: bannedUser.original_created_at,
          updated_at: new Date().toISOString(),
          followers_count: bannedUser.followers_count,
          following_count: bannedUser.following_count,
          referral_code: bannedUser.referral_code,
          referred_by: bannedUser.referred_by,
          referral_bonus_claimed: bannedUser.referral_bonus_claimed,
        },
      ])

      if (insertError) throw insertError
    } else {
      // If user exists, just update to set is_active = true
      const { error: updateError } = await supabase
        .from("users")
        .update({
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (updateError) throw updateError
    }

    // Delete from banned_users table
    const { error: deleteError } = await supabase
      .from("banned_users")
      .delete()
      .eq("id", userId)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true, message: "User unbanned successfully" })
  } catch (error) {
    console.error("Error unbanning user:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to unban user" },
      { status: 500 }
    )
  }
}
