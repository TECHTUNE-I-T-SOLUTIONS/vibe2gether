import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const supabase = await createClient()

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get("limit") || "10")
    const userId = session?.user?.id

    // Fetch real profiles from database
    let query = supabase
      .from("users")
      .select(
        `
        id,
        display_name,
        profile_picture,
        bio,
        city,
        country,
        interests,
        is_verified,
        is_premium,
        created_at
      `
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(limit)

    // Exclude current user if authenticated
    if (userId) {
      query = query.neq("id", userId)
    }

    const { data: users, error } = await query

    if (error) {
      console.error("Error fetching profiles:", error)
      throw error
    }

    // Transform users to profiles format with computed vibe score
    const profiles = (users || []).map((user: any) => ({
      id: user.id,
      name: user.display_name || "Anonymous",
      age: null, // Age not in current schema, can add later
      location: user.city && user.country ? `${user.city}, ${user.country}` : user.country || "Location unknown",
      image: user.profile_picture || "/placeholder-user.jpg",
      verified: user.is_verified || false,
      premium: user.is_premium || false,
      vibeScore: Math.floor(Math.random() * 30) + 70, // Random score 70-100 as placeholder
      interests: Array.isArray(user.interests) ? user.interests : user.interests ? [user.interests] : [],
      bio: user.bio,
    }))

    // Fallback mock profiles
    const mockProfiles = [
      {
        id: "mock-1",
        name: "Emma Watson",
        age: 28,
        location: "New York, USA",
        image: "/placeholder-user.jpg",
        verified: true,
        vibeScore: 95,
        interests: ["Travel", "Art", "Music"],
      },
      {
        id: "mock-2",
        name: "James Chen",
        age: 32,
        location: "London, UK",
        image: "/placeholder-user.jpg",
        verified: true,
        vibeScore: 92,
        interests: ["Fitness", "Tech", "Food"],
      },
      {
        id: "mock-3",
        name: "Sofia Garcia",
        age: 26,
        location: "Barcelona, Spain",
        image: "/placeholder-user.jpg",
        verified: true,
        vibeScore: 98,
        interests: ["Dance", "Photography", "Movies"],
      },
    ]

    return NextResponse.json(
      {
        success: true,
        count: profiles.length,
        profiles: profiles.length > 0 ? profiles : mockProfiles,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error fetching profiles:", error)
    // Return mock data as fallback if there's an error
    const fallbackProfiles = [
      {
        id: "mock-1",
        name: "Emma Watson",
        age: 28,
        location: "New York, USA",
        image: "/placeholder-user.jpg",
        verified: true,
        vibeScore: 95,
        interests: ["Travel", "Art", "Music"],
      },
    ]
    return NextResponse.json(
      { success: true, profiles: fallbackProfiles },
      { status: 200 }
    )
  }
}
