import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      console.log("[POST /api/messaging/send] User not authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { matchId, content } = await request.json()

    if (!matchId || !content) {
      console.error("[POST /api/messaging/send] Missing required fields")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()
    const userId = session.user.id

    console.log(`[POST /api/messaging/send] Sending message to match ${matchId}`)

    // Verify match exists and user is part of it
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single()

    if (matchError || !match) {
      console.error("[POST /api/messaging/send] Match not found")
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    if (match.user1_id !== userId && match.user2_id !== userId) {
      console.error("[POST /api/messaging/send] User not part of this match")
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Insert message
    const { data: message, error: insertError } = await supabase
      .from("messages")
      .insert({
        match_id: matchId,
        sender_id: userId,
        content,
        message_type: "text",
      })
      .select()
      .single()

    if (insertError) {
      console.error("[POST /api/messaging/send] Error inserting message:", insertError)
      throw insertError
    }

    // Update match last_message_at
    await supabase
      .from("matches")
      .update({
        last_message_at: new Date().toISOString(),
      })
      .eq("id", matchId)

    // Get other user ID
    const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id

    // Create notification for other user
    await supabase.from("notifications").insert({
      user_id: otherUserId,
      type: "new_message",
      title: "New Message",
      message: content.substring(0, 50) + (content.length > 50 ? "..." : ""),
      actor_id: userId,
      reference_id: matchId,
      reference_type: "message",
      action_url: `/dashboard/messages?matchId=${matchId}`,
    })

    console.log(`[POST /api/messaging/send] Message sent successfully`)

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        matchId: message.match_id,
        senderId: message.sender_id,
        content: message.content,
        createdAt: message.created_at,
      },
    })
  } catch (error) {
    console.error("[POST /api/messaging/send] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
