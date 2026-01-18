import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const { name, email, subject, message, phone, category } = body

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, subject, message" },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      )
    }

    // Prevent spam - check if same email submitted multiple times in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const { data: recentSubmissions } = await supabase
      .from("contacts")
      .select("id")
      .eq("email", email)
      .gte("created_at", fiveMinutesAgo)
      .limit(1)

    if (recentSubmissions && recentSubmissions.length > 0) {
      return NextResponse.json(
        { error: "Please wait before submitting another contact form" },
        { status: 429 }
      )
    }

    // Insert contact submission
    const { data, error } = await supabase
      .from("contacts")
      .insert([
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone?.trim() || null,
          subject: subject.trim(),
          category: category || "general",
          message: message.trim(),
          status: "new",
          priority: "normal",
        },
      ])
      .select("id")

    if (error) {
      console.error("Contact submission error:", error)
      return NextResponse.json(
        { error: "Failed to submit contact form" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "Thank you for contacting us. We'll get back to you soon!",
        data: data,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Contact API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      )
    }

    // Get contact submissions for a specific email
    const { data, error } = await supabase
      .from("contacts")
      .select("id, name, email, subject, status, created_at, responded_at")
      .eq("email", email.toLowerCase())
      .order("created_at", { ascending: false })
      .limit(10)

    if (error) {
      console.error("Contact retrieval error:", error)
      return NextResponse.json(
        { error: "Failed to retrieve contacts" },
        { status: 500 }
      )
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    console.error("Contact GET API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
