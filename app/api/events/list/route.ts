import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      console.log("[GET /api/events/list] User not authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const category = searchParams.get("category")
    const city = searchParams.get("city")
    const country = searchParams.get("country")
    const upcoming = searchParams.get("upcoming") === "true"

    const supabase = await createClient()
    const userId = session.user.id

    console.log(`[GET /api/events/list] User ${userId} fetching events - page: ${page}, limit: ${limit}`)

    // Build query
    let query = supabase
      .from("events")
      .select(
        `
        id,
        title,
        description,
        category,
        event_date,
        event_time,
        location,
        city,
        country,
        ticket_price,
        max_tickets,
        current_attendees,
        image_url,
        created_by,
        users(id, display_name, email, profile_picture),
        event_registrations(id)
      `,
        { count: "exact" }
      )

    // Add filters
    if (category) query = query.eq("category", category)
    if (city) query = query.eq("city", city)
    if (country) query = query.eq("country", country)
    if (upcoming) {
      const today = new Date().toISOString().split("T")[0]
      query = query.gte("event_date", today)
    }

    // Add pagination
    const { data: events, count, error } = await query
      .order("event_date", { ascending: true })
      .range((page - 1) * limit, page * limit - 1)

    if (error) {
      console.error("[GET /api/events/list] Error fetching events:", error)
      throw error
    }

    // Check if user is registered for each event
    const eventsWithRegistration = (events || []).map((event) => ({
      ...event,
      isRegistered: (event.event_registrations || []).length > 0,
      eventRegistrations: undefined, // Remove the raw registration data
    }))

    const totalPages = Math.ceil((count || 0) / limit)

    console.log(
      `[GET /api/events/list] Fetched ${events?.length || 0} events - total: ${count}`
    )

    return NextResponse.json({
      success: true,
      events: eventsWithRegistration,
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
      },
    })
  } catch (error) {
    console.error("[GET /api/events/list] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
