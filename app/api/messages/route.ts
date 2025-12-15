import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const matchId = searchParams.get("matchId")

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get user
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .single()

    if (userError || !user) {
      return Response.json({ error: "User not found" }, { status: 404 })
    }

    // If matchId provided, get messages for that match
    if (matchId) {
      const { data: messages, error: messagesError } = await supabase
        .from("messages")
        .select(`
          id,
          match_id,
          sender_id,
          content,
          message_type,
          media_url,
          is_read,
          created_at,
          sender:sender_id(id, display_name, full_name, profile_picture)
        `)
        .eq("match_id", matchId)
        .order("created_at", { ascending: true })
        .limit(100)

      if (messagesError) {
        console.error("Error fetching messages:", messagesError)
        return Response.json({ error: "Failed to fetch messages" }, { status: 500 })
      }

      // Mark messages as read if they weren't sent by this user
      const unreadMessageIds = (messages || [])
        .filter((m: any) => m.sender_id !== user.id && !m.is_read)
        .map((m: any) => m.id)

      if (unreadMessageIds.length > 0) {
        await supabase
          .from("messages")
          .update({ is_read: true, read_at: new Date().toISOString() })
          .in("id", unreadMessageIds)
      }

      // Format messages
      const formattedMessages = (messages || []).map((msg: any) => ({
        id: msg.id,
        matchId: msg.match_id,
        senderId: msg.sender_id,
        content: msg.content,
        messageType: msg.message_type,
        mediaUrl: msg.media_url,
        isRead: msg.is_read,
        createdAt: msg.created_at,
        sender: {
          id: msg.sender?.id,
          name: msg.sender?.display_name || msg.sender?.full_name,
          avatar: msg.sender?.profile_picture,
        },
      }))

      return Response.json({
        messages: formattedMessages,
        total: formattedMessages.length,
      })
    }

    // Get all conversations (matches with recent messages)
    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select(`
        id,
        user1_id,
        user2_id,
        status,
        last_message_at,
        compatibility_score,
        user1:user1_id(id, display_name, full_name, profile_picture),
        user2:user2_id(id, display_name, full_name, profile_picture)
      `)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .eq("status", "matched")
      .order("last_message_at", { ascending: false })

    if (matchesError) {
      console.error("Error fetching matches:", matchesError)
      return Response.json({ error: "Failed to fetch conversations" }, { status: 500 })
    }

    // Get the latest message for each conversation
    const conversationsWithMessages = await Promise.all(
      (matches || []).map(async (match: any) => {
        const otherUser = match.user1_id === user.id ? match.user2 : match.user1

        const { data: lastMessage } = await supabase
          .from("messages")
          .select("id, content, sender_id, created_at, is_read")
          .eq("match_id", match.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        const { count: unreadCount } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("match_id", match.id)
          .eq("sender_id", otherUser.id)
          .eq("is_read", false)

        return {
          id: match.id,
          otherUser: {
            id: otherUser.id,
            name: otherUser.display_name || otherUser.full_name,
            avatar: otherUser.profile_picture,
          },
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            senderId: lastMessage.sender_id,
            createdAt: lastMessage.created_at,
          } : null,
          unreadCount: unreadCount || 0,
          compatibilityScore: match.compatibility_score,
        }
      })
    )

    return Response.json({
      conversations: conversationsWithMessages,
      total: conversationsWithMessages.length,
    })
  } catch (error) {
    console.error("Messages fetch error:", error)
    return Response.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { matchId, content, messageType = "text", mediaUrl } = await request.json()

    if (!matchId || !content) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get user
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .single()

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 })
    }

    // Verify user is part of this match
    const { data: match } = await supabase
      .from("matches")
      .select("id")
      .eq("id", matchId)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .single()

    if (!match) {
      return Response.json({ error: "Not authorized for this match" }, { status: 403 })
    }

    // Create message
    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        match_id: matchId,
        sender_id: user.id,
        content,
        message_type: messageType,
        media_url: mediaUrl,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating message:", error)
      return Response.json({ error: "Failed to send message" }, { status: 500 })
    }

    // Update match's last_message_at
    await supabase
      .from("matches")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", matchId)

    return Response.json({ success: true, message })
  } catch (error) {
    console.error("Send message error:", error)
    return Response.json(
      { error: "Failed to send message" },
      { status: 500 }
    )
  }
}
