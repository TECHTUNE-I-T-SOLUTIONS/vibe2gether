import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { recipientId, content, mediaUrl, messageType } = await request.json()

    if (!recipientId || !content?.trim()) {
      return NextResponse.json(
        { error: "Recipient ID and content are required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const senderId = session.user.id

    // Check if users are already matched
    let match = await supabase
      .from("matches")
      .select("id")
      .or(
        `and(user1_id.eq.${senderId},user2_id.eq.${recipientId}),and(user1_id.eq.${recipientId},user2_id.eq.${senderId})`
      )
      .single()

    // Create match if doesn't exist
    if (!match.data) {
      const { data: newMatch, error: matchError } = await supabase
        .from("matches")
        .insert({
          user1_id: senderId,
          user2_id: recipientId,
          status: "active",
          initiated_by: senderId,
        })
        .select("id")
        .single()

      if (matchError) {
        console.error("Match creation error:", matchError)
        return NextResponse.json(
          { error: "Failed to create match" },
          { status: 500 }
        )
      }
      match = { data: newMatch }
    }

    // Create message
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .insert({
        match_id: match.data.id,
        sender_id: senderId,
        content,
        message_type: messageType || "text",
        media_url: mediaUrl || null,
      })
      .select()
      .single()

    if (messageError) {
      console.error("Message creation error:", messageError)
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message,
      matchId: match.data.id,
    })
  } catch (error) {
    console.error("Send message error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
