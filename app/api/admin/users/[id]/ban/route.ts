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

    // Get user details
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single()

    if (userError) throw userError

    // Insert into banned_users table
    const { error: banInsertError } = await supabase.from("banned_users").insert([
      {
        id: user.id,
        email: user.email,
        password_hash: user.password_hash,
        full_name: user.full_name,
        display_name: user.display_name,
        date_of_birth: user.date_of_birth,
        gender: user.gender,
        bio: user.bio,
        profile_picture: user.profile_picture,
        cover_picture: user.cover_picture,
        country_code: user.country_code,
        mobile_number: user.mobile_number,
        country: user.country,
        city: user.city,
        latitude: user.latitude,
        longitude: user.longitude,
        is_verified: user.is_verified,
        is_premium: user.is_premium,
        coins_balance: user.coins_balance,
        total_coins_earned: user.total_coins_earned,
        language: user.language,
        looking_for: user.looking_for,
        interests: user.interests,
        last_login_at: user.last_login_at,
        email_verified_at: user.email_verified_at,
        followers_count: user.followers_count,
        following_count: user.following_count,
        referral_code: user.referral_code,
        referred_by: user.referred_by,
        referral_bonus_claimed: user.referral_bonus_claimed,
        original_created_at: user.created_at,
        banned_by: adminUser.id,
        ban_reason: "Banned by admin",
      },
    ])

    if (banInsertError) throw banInsertError

    // Delete from users table
    const { error: userDeleteError } = await supabase
      .from("users")
      .delete()
      .eq("id", userId)

    if (userDeleteError) throw userDeleteError

    return NextResponse.json({ success: true, message: "User banned successfully" })
  } catch (error) {
    console.error("Error banning user:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to ban user" },
      { status: 500 }
    )
  }
}
