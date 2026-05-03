import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      console.log("[POST /api/matches/like] User not authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { matchId } = await request.json()
    if (!matchId) {
      console.error("[POST /api/matches/like] Match ID required")
      return NextResponse.json({ error: "Match ID required" }, { status: 400 })
    }

    const supabase = await createClient()
    const userId = session.user.id

    console.log(`[POST /api/matches/like] User ${userId} liking match ${matchId}`)

    // Get the match details
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single()

    if (matchError || !match) {
      console.error("[POST /api/matches/like] Match not found:", matchError)
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    // Determine the other user
    const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id

    // Check if match is already liked/active
    if (match.status === "active") {
      console.log(`[POST /api/matches/like] Match already active`)
      return NextResponse.json({
        success: true,
        message: "Match already active",
        status: "active",
      })
    }

    // Update match status
    const { error: updateError } = await supabase
      .from("matches")
      .update({
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", matchId)

    if (updateError) {
      console.error("[POST /api/matches/like] Error updating connection:", updateError)
      throw updateError
    }

    // Create notification for other user
    await supabase.from("notifications").insert({
      user_id: otherUserId,
      type: "match_accepted",
      title: "Match Accepted!",
      message: `${session.user.name} accepted your match`,
      actor_id: userId,
      reference_id: matchId,
      reference_type: "match",
      action_url: `/dashboard/matches`,
    })

    console.log(`[POST /api/matches/like] Match ${matchId} accepted successfully`)

    return NextResponse.json({
      success: true,
      message: "Match accepted",
      status: "active",
      otherUserId,
    })
  } catch (error) {
    console.error("[POST /api/matches/like] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
