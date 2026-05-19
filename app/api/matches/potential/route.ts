import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

function calculateAge(dateOfBirth: string): number {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

function calculateCompatibilityScore(currentUser: any, potentialMatch: any): number {
  let score = 0

  // Age proximity
  const currentAge = calculateAge(currentUser.date_of_birth)
  const matchAge = calculateAge(potentialMatch.date_of_birth)
  const ageDiff = Math.abs(currentAge - matchAge)

  if (ageDiff <= 5) score += 35
  else if (ageDiff <= 10) score += 20
  else if (ageDiff <= 15) score += 10

  // Location match
  if (currentUser.country && potentialMatch.country) {
    if (currentUser.country === potentialMatch.country) score += 25
    if (
      currentUser.city &&
      potentialMatch.city &&
      currentUser.city === potentialMatch.city
    )
      score += 15
  }

  // Interests overlap
  const currentInterests = Array.isArray(currentUser.interests)
    ? currentUser.interests
    : []
  const matchInterests = Array.isArray(potentialMatch.interests)
    ? potentialMatch.interests
    : []
  const commonInterests = currentInterests.filter((interest) =>
    matchInterests.includes(interest)
  )
  score += commonInterests.length * 5

  // Gender preference
  if (currentUser.looking_for && potentialMatch.gender) {
    if (
      currentUser.looking_for.toLowerCase() ===
      potentialMatch.gender.toLowerCase()
    ) {
      score += 20
    }
  }

  return Math.min(score, 100) // Cap at 100
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error("[GET /api/matches/potential] User not authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`[GET /api/matches/potential] Fetching potential Connections for user ${session.user.id}`)

    const supabase = await createClient()

    // Get current user profile
    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select(
        "id, display_name, date_of_birth, country, city, interests, looking_for, is_active"
      )
      .eq("id", session.user.id)
      .single()

    if (userError) {
      console.error("[GET /api/matches/potential] Error fetching current user:", userError)
      throw userError
    }

    // Get all user IDs that current user has already matched with
    const { data: existingMatches, error: matchError } = await supabase
      .from("matches")
      .select("user1_id, user2_id")
      .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`)

    if (matchError) {
      console.error("[GET /api/matches/potential] Error fetching existing Connections:", matchError)
      throw matchError
    }

    // Build exclusion list
    const excludedIds = new Set([session.user.id])
    existingMatches?.forEach((match: any) => {
      excludedIds.add(match.user1_id)
      excludedIds.add(match.user2_id)
    })

    console.log(
      `[GET /api/matches/potential] Excluding ${excludedIds.size} user IDs from potential Connections`
    )

    // Get all active users except current user and already matched
    const { data: potentialMatches, error: potentialError } = await supabase
      .from("users")
      .select(
        "id, display_name, profile_picture, bio, gender, date_of_birth, country, city, interests, looking_for"
      )
      .neq("id", session.user.id)
      .eq("is_active", true)
      .limit(50)

    if (potentialError) {
      console.error("[GET /api/matches/potential] Error fetching potential matches:", potentialError)
      throw potentialError
    }

    // Filter out already matched users
    const filteredPotentials = (potentialMatches || []).filter(
      (user: any) => !excludedIds.has(user.id)
    )

    // Calculate compatibility scores and sort
    const matchesWithScores = filteredPotentials.map((match: any) => ({
      ...match,
      compatibilityScore: calculateCompatibilityScore(currentUser, match),
    }))

    const sorted = matchesWithScores.sort(
      (a: any, b: any) => b.compatibilityScore - a.compatibilityScore
    )

    console.log(
      `[GET /api/matches/potential] Found ${sorted.length} potential connections`
    )

    return NextResponse.json({
      success: true,
      potentialMatches: sorted,
      count: sorted.length
    })
  } catch (error) {
    console.error("[GET /api/matches/potential] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
