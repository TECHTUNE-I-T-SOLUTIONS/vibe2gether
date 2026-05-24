import { NextResponse } from "next/server"
import { requireMobileUser } from "../_lib/auth"

export async function GET(request: Request) {
  try {
    const { supabase, user } = await requireMobileUser(request)
    const { searchParams } = new URL(request.url)
    const matchId = searchParams.get("matchId")

    if (matchId) {
      const { data: messages, error } = await supabase
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

      if (error) throw error

      const unreadIds = (messages || [])
        .filter((message: any) => message.sender_id !== user.id && !message.is_read)
        .map((message: any) => message.id)

      if (unreadIds.length > 0) {
        await supabase.from("messages").update({ is_read: true, read_at: new Date().toISOString() }).in("id", unreadIds)
      }

      return NextResponse.json({
        messages: (messages || []).map((message: any) => ({
          id: message.id,
          matchId: message.match_id,
          senderId: message.sender_id,
          content: message.content,
          messageType: message.message_type,
          mediaUrl: message.media_url,
          isRead: message.is_read,
          createdAt: message.created_at,
          sender: {
            id: message.sender?.id,
            name: message.sender?.display_name || message.sender?.full_name,
            avatar: message.sender?.profile_picture,
          },
        })),
      })
    }

    const { data: matches, error } = await supabase
      .from("matches")
      .select(`
        id,
        user1_id,
        user2_id,
        last_message_at,
        user1:user1_id(id, display_name, full_name, profile_picture),
        user2:user2_id(id, display_name, full_name, profile_picture)
      `)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order("last_message_at", { ascending: false })

    if (error) throw error

    const conversations = await Promise.all((matches || []).map(async (match: any) => {
      const otherUser = match.user1_id === user.id ? match.user2 : match.user1
      const { data: lastMessage } = await supabase
        .from("messages")
        .select("id, content, sender_id, created_at, is_read, message_type, media_url")
        .eq("match_id", match.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      const { count: unreadCount } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("match_id", match.id)
        .eq("sender_id", otherUser?.id)
        .eq("is_read", false)

      const lastMessageText = lastMessage
        ? lastMessage.message_type === "image"
          ? "📷 Image"
          : lastMessage.message_type === "audio"
            ? "🎤 Audio"
            : lastMessage.content || ""
        : ""

      return {
        id: match.id,
        name: otherUser?.display_name || otherUser?.full_name || "Unknown",
        avatar: otherUser?.profile_picture,
        lastMessage: lastMessageText,
        lastMessageTime: lastMessage ? new Date(lastMessage.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
        unreadCount: unreadCount || 0,
        online: false,
        userId: otherUser?.id,
      }
    }))

    return NextResponse.json({ conversations, total: conversations.length })
  } catch (error) {
    console.error("Mobile messages error:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireMobileUser(request)
    const { matchId, content, messageType = "text", mediaUrl } = await request.json()

    if (!matchId || (!content && !mediaUrl)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data: match } = await supabase
      .from("matches")
      .select("id")
      .eq("id", matchId)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .single()

    if (!match) {
      return NextResponse.json({ error: "Not authorized for this match" }, { status: 403 })
    }

    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        match_id: matchId,
        sender_id: user.id,
        content: content || "",
        message_type: messageType,
        media_url: mediaUrl || null,
      })
      .select()
      .single()

    if (error) throw error

    await supabase.from("matches").update({ last_message_at: new Date().toISOString() }).eq("id", matchId)

    return NextResponse.json({ success: true, message })
  } catch (error) {
    console.error("Mobile send message error:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}