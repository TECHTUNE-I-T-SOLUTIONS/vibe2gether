import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      console.log("[GET /api/messaging/conversations] User not authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()
    const userId = session.user.id

    console.log(`[GET /api/messaging/conversations] Fetching conversations for user ${userId}`)

    // Get all matches where user is involved
    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select(
        `
        id,
        user1_id,
        user2_id,
        status,
        last_message_at,
        created_at,
        user1:users!matches_user1_id_fkey(id, display_name, profile_picture, email),
        user2:users!matches_user2_id_fkey(id, display_name, profile_picture, email)
      `
      )
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order("last_message_at", { ascending: false, nullsFirst: false })

    if (matchesError) {
      console.error("[GET /api/messaging/conversations] Error fetching connections:", matchesError)
      throw matchesError
    }

    // Get latest messages for each match
    const conversationsData = await Promise.all(
      (matches || []).map(async (match) => {
        const otherUser = match.user1_id === userId ? match.user2 : match.user1

        const { data: lastMessage } = await supabase
          .from("messages")
          .select("*")
          .eq("match_id", match.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        const { count: unreadCount } = await supabase
          .from("messages")
          .select("*", { count: "exact" })
          .eq("match_id", match.id)
          .eq("is_read", false)
          .neq("sender_id", userId)

        return {
          id: match.id,
          otherUser,
          status: match.status,
          lastMessage: lastMessage?.content || null,
          lastMessageTime: lastMessage?.created_at || match.last_message_at,
          unreadCount: unreadCount || 0,
          createdAt: match.created_at,
        }
      })
    )

    console.log(
      `[GET /api/messaging/conversations] Found ${conversationsData.length} conversations`
    )

    return NextResponse.json({
      conversations: conversationsData,
      total: conversationsData.length,
    })
  } catch (error) {
    console.error("[GET /api/messaging/conversations] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
