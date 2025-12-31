import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    // Create event registration
    const { error } = await supabase
      .from("event_registrations")
      .insert({
        user_id: session.user.id,
        event_id: params.eventId,
      })

    if (error) {
      console.error("[REGISTER_EVENT] Error:", error)
      return NextResponse.json(
        { error: "Failed to register for event" },
        { status: 500 }
      )
    }

    // Update event registered count
    const { data: event } = await supabase
      .from("events")
      .select("registered_count")
      .eq("id", params.eventId)
      .single()

    if (event) {
      await supabase
        .from("events")
        .update({ registered_count: (event.registered_count || 0) + 1 })
        .eq("id", params.eventId)
    }

    return NextResponse.json({
      success: true,
      message: "Registered for event successfully",
    })
  } catch (error) {
    console.error("[REGISTER_EVENT] Error:", error)
    return NextResponse.json(
      { error: "Failed to register for event" },
      { status: 500 }
    )
  }
}
