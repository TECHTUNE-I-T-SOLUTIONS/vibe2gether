import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error("[GET /api/matches/user] User not authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") // "pending", "accepted", or null for all

    console.log(`[GET /api/matches/user] Fetching connections for user ${session.user.id}, status: ${status}`)

    const supabase = await createClient()

    // Build query
    let query = supabase
      .from("matches")
      .select(`
        id,
        user1_id,
        user2_id,
        status,
        initiated_by,
        compatibility_score,
        last_message_at,
        created_at,
        updated_at,
        user1:users!matches_user1_id_fkey(
          id,
          display_name,
          profile_picture,
          bio,
          gender,
          date_of_birth,
          country,
          city,
          interests
        ),
        user2:users!matches_user2_id_fkey(
          id,
          display_name,
          profile_picture,
          bio,
          gender,
          date_of_birth,
          country,
          city,
          interests
        )
      `)
      .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`)

    // Filter by status if provided
    if (status) {
      query = query.eq("status", status)
    } else {
      // If no status filter, get both pending and accepted
      query = query.in("status", ["pending", "accepted"])
    }

    query = query.order("created_at", { ascending: false })

    const { data: matches, error } = await query

    if (error) {
      console.error("[GET /api/matches/user] Error fetching connections:", error)
      throw error
    }

    // Process matches to identify pending vs accepted and initiated by
    const processedMatches = (matches || []).map((match: any) => {
      const otherUserId = match.user1_id === session.user.id ? match.user2_id : match.user1_id
      const initiatedByCurrentUser = match.initiated_by === session.user.id
      
      return {
        id: match.id,
        user1_id: match.user1_id,
        user2_id: match.user2_id,
        status: match.status,
        initiated_by: match.initiated_by,
        compatibility_score: match.compatibility_score,
        last_message_at: match.last_message_at,
        created_at: match.created_at,
        updated_at: match.updated_at,
        otherUserId,
        initiatedByCurrentUser,
        currentUserIsUser1: match.user1_id === session.user.id,
        user1: match.user1,
        user2: match.user2,
        otherUser: match.user1_id === session.user.id ? match.user2 : match.user1
      }
    })

    console.log(`[GET /api/matches/user] Found ${processedMatches.length} connections`)

    return NextResponse.json({
      success: true,
      matches: processedMatches,
      count: processedMatches.length
    })
  } catch (error) {
    console.error("[GET /api/matches/user] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
