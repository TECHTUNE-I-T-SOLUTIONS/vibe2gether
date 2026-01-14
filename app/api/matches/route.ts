import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error("[POST /api/matches] User not authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId, compatibilityScore = 50 } = await request.json()
    if (!userId) {
      console.error("[POST /api/matches] Target user ID required")
      return NextResponse.json({ error: "Target user ID required" }, { status: 400 })
    }

    console.log(`[POST /api/matches] Creating match between ${session.user.id} and ${userId}`)

    const supabase = await createClient()

    // Check if match already exists
    const { data: existingMatch, error: checkError } = await supabase
      .from("matches")
      .select("id")
      .or(`and(user1_id.eq.${session.user.id},user2_id.eq.${userId}),and(user1_id.eq.${userId},user2_id.eq.${session.user.id})`)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error("[POST /api/matches] Error checking existing match:", checkError)
      throw checkError
    }

    if (existingMatch) {
      console.log(`[POST /api/matches] Match already exists: ${existingMatch.id}`)
      return NextResponse.json({
        success: true,
        matchId: existingMatch.id,
        message: "Match already exists"
      })
    }

    // Create new match
    const { data: newMatch, error: createError } = await supabase
      .from("matches")
      .insert({
        user1_id: session.user.id,
        user2_id: userId,
        compatibility_score: compatibilityScore,
        status: "pending",
        initiated_by: session.user.id
      })
      .select("id")
      .single()

    if (createError) {
      console.error("[POST /api/matches] Error creating match:", createError)
      throw createError
    }

    console.log(`[POST /api/matches] Match created successfully: ${newMatch.id}`)

    return NextResponse.json({
      success: true,
      matchId: newMatch.id,
      message: "Match created successfully"
    })
  } catch (error) {
    console.error("[POST /api/matches] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error("[GET /api/matches] User not authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      console.error("[GET /api/matches] userId parameter required")
      return NextResponse.json({ error: "userId parameter required" }, { status: 400 })
    }

    console.log(`[GET /api/matches] Checking match between ${session.user.id} and ${userId}`)

    const supabase = await createClient()

    // Check if match exists
    const { data: match, error } = await supabase
      .from("matches")
      .select("id, status")
      .or(`and(user1_id.eq.${session.user.id},user2_id.eq.${userId}),and(user1_id.eq.${userId},user2_id.eq.${session.user.id})`)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error("[GET /api/matches] Error checking match:", error)
      throw error
    }

    if (match) {
      console.log(`[GET /api/matches] Match found: ${match.id}, status: ${match.status}`)
      return NextResponse.json({
        exists: true,
        matchId: match.id,
        status: match.status
      })
    } else {
      console.log(`[GET /api/matches] No match found between users`)
      return NextResponse.json({
        exists: false,
        matchId: null,
        status: null
      })
    }
  } catch (error) {
    console.error("[GET /api/matches] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}