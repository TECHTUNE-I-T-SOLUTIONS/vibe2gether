import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: users, error } = await supabase.from("users").select("*").eq("email", email.toLowerCase()).limit(1)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const user = users && users.length > 0 ? users[0] : null

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, user.password_hash)

    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const secret = process.env.NEXTAUTH_SECRET || process.env.SECRET || "dev-secret"

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        isVerified: user.is_verified,
        isPremium: user.is_premium,
        isAdmin: user.is_admin,
        coins: user.coins_balance,
      },
      secret,
      { expiresIn: "30d" }
    )

    return NextResponse.json({ user: { id: user.id, email: user.email, full_name: user.full_name, profile_picture: user.profile_picture }, token })
  } catch (error) {
    console.error("Mobile signin error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
