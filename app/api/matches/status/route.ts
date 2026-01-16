import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error("[PATCH /api/matches/status] User not authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { matchId, status } = await request.json()
    
    if (!matchId || !status) {
      console.error("[PATCH /api/matches/status] Missing matchId or status")
      return NextResponse.json(
        { error: "matchId and status required" },
        { status: 400 }
      )
    }

    if (!["pending", "accepted", "rejected"].includes(status)) {
      console.error("[PATCH /api/matches/status] Invalid status:", status)
      return NextResponse.json(
        { error: "Invalid status. Must be: pending, accepted, or rejected" },
        { status: 400 }
      )
    }

    console.log(`[PATCH /api/matches/status] Updating match ${matchId} to status: ${status}`)

    const supabase = await createClient()

    // Verify user is part of this match
    const { data: match, error: fetchError } = await supabase
      .from("matches")
      .select("id, user1_id, user2_id")
      .eq("id", matchId)
      .single()

    if (fetchError) {
      console.error("[PATCH /api/matches/status] Error fetching match:", fetchError)
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    const isUser1 = match.user1_id === session.user.id
    const isUser2 = match.user2_id === session.user.id

    if (!isUser1 && !isUser2) {
      console.error("[PATCH /api/matches/status] User not part of this match")
      return NextResponse.json(
        { error: "Unauthorized: User not part of this match" },
        { status: 403 }
      )
    }

    // Update match status
    const { data: updatedMatch, error: updateError } = await supabase
      .from("matches")
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq("id", matchId)
      .select()
      .single()

    if (updateError) {
      console.error("[PATCH /api/matches/status] Error updating match:", updateError)
      throw updateError
    }

    console.log(`[PATCH /api/matches/status] Match ${matchId} updated successfully to status: ${status}`)

    return NextResponse.json({
      success: true,
      match: updatedMatch,
      message: `Match status updated to ${status}`
    })
  } catch (error) {
    console.error("[PATCH /api/matches/status] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
