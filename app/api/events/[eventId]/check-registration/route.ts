import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    // Check if user is registered for this event
    const { data: registrations } = await supabase
      .from("event_registrations")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("event_id", eventId)
      .limit(1)

    return NextResponse.json({
      registered: registrations && registrations.length > 0,
    })
  } catch (error) {
    console.error("[CHECK_REGISTRATION] Error:", error)
    // If table doesn't exist, registration doesn't exist
    return NextResponse.json({
      registered: false,
    })
  }
}
