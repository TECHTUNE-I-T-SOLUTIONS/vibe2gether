import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, fullName, dateOfBirth, gender, countryCode, mobileNumber, country } = body

    // Validate required fields
    if (!email || !password || !fullName) {
      return NextResponse.json({ error: "Email, password, and full name are required" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if user already exists
    const { data: existingUser } = await supabase.from("users").select("id").eq("email", email.toLowerCase()).single()

    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create display name from full name
    const displayName = fullName.split(" ")[0]

    // Insert new user
    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        full_name: fullName,
        display_name: displayName,
        date_of_birth: dateOfBirth || null,
        gender: gender || null,
        country_code: countryCode || null,
        mobile_number: mobileNumber || null,
        country: country || null,
        coins_balance: 50, // Welcome bonus
        total_coins_earned: 50,
      })
      .select()
      .single()

    if (error) {
      console.error("Registration error:", error)
      return NextResponse.json({ error: "Failed to create account" }, { status: 500 })
    }

    // Create welcome coin transaction
    await supabase.from("coin_transactions").insert({
      user_id: newUser.id,
      amount: 50,
      transaction_type: "welcome_bonus",
      description: "Welcome bonus for joining Vibe2Gether!",
      balance_after: 50,
    })

    // Create welcome notification
    await supabase.from("notifications").insert({
      user_id: newUser.id,
      type: "system",
      title: "Welcome to Vibe2Gether!",
      message: "Your account has been created successfully. Start exploring and finding your perfect match!",
      action_url: "/dashboard",
    })

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.full_name,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
