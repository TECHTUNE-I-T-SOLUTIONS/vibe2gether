import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { eventId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      console.log("[GET /api/events/[eventId]] User not authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const eventId = params.eventId
    const supabase = await createClient()
    const userId = session.user.id

    console.log(`[GET /api/events/[eventId]] Fetching event ${eventId}`)

    // Get event details
    const { data: event, error: eventError } = await supabase
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
        terms_conditions,
        created_at,
        updated_at,
        users(id, display_name, email, profile_picture),
        event_registrations(id, status, registered_at)
      `
      )
      .eq("id", eventId)
      .single()

    if (eventError || !event) {
      console.error("[GET /api/events/[eventId]] Event not found")
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if user is registered
    const isRegistered = (event.event_registrations || []).some(
      (reg) => reg.status === "registered"
    )

    // Get attendee list (first 5 attendees with profile pictures)
    const { data: attendees, error: attendeesError } = await supabase
      .from("event_registrations")
      .select("users(id, display_name, profile_picture)")
      .eq("event_id", eventId)
      .eq("status", "registered")
      .limit(5)

    if (attendeesError) {
      console.error("[GET /api/events/[eventId]] Error fetching attendees:", attendeesError)
      // Don't throw, attendee list is optional
    }

    const eventDetails = {
      ...event,
      isRegistered,
      attendees: (attendees || [])
        .map((a) => a.users)
        .filter(Boolean),
      eventRegistrations: undefined, // Remove raw registration data
    }

    console.log(
      `[GET /api/events/[eventId]] Event loaded - ${event.title}, attendees: ${event.current_attendees}`
    )

    return NextResponse.json({
      success: true,
      event: eventDetails,
    })
  } catch (error) {
    console.error("[GET /api/events/[eventId]] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
