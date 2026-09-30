import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import jwt from "jsonwebtoken"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminToken = request.cookies.get("admin_token")?.value
    if (!adminToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let decoded
    try {
      decoded = jwt.verify(adminToken, JWT_SECRET) as { id: string }
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Verify admin exists in database
    const { data: admin, error: adminError } = await supabase
      .from("admins")
      .select("id, email, is_active")
      .eq("id", decoded.id)
      .single()

    if (adminError || !admin) {
      console.error("Admin verification failed:", adminError)
      return NextResponse.json({ error: "Admin not found" }, { status: 404 })
    }

    if (!admin.is_active) {
      return NextResponse.json({ error: "Admin account is disabled" }, { status: 403 })
    }

    // Find corresponding user ID from users table using admin email
    const { data: userRecord, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", admin.email)
      .single()

    if (userError || !userRecord) {
      console.error("User record not found for admin email:", admin.email, userError)
      return NextResponse.json({ error: "Admin user record not found" }, { status: 404 })
    }

    const { title, description, event_date, location_name, capacity } = await request.json()

    if (!title || !event_date || !location_name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create event in database
    const { data, error } = await supabase
      .from("events")
      .insert([
        {
          title,
          description,
          event_date,
          location_name,
          capacity: capacity ? parseInt(capacity) : null,
          is_cancelled: false,
          created_by: userRecord.id,
          created_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: error.message || "Failed to create event" }, { status: 500 })
    }

    return NextResponse.json(data?.[0] || {})
  } catch (error) {
    console.error("Error creating event:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
