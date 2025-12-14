import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = searchParams.get("limit") || "10"

    // TODO: Replace with actual database query
    // This is a placeholder that returns mock data
    // In production, this should query your database (Supabase, PostgreSQL, etc.)

    const mockProfiles = [
      {
        id: 1,
        name: "Emma Watson",
        age: 28,
        location: "New York, USA",
        image: "/placeholder-user.jpg",
        verified: true,
        vibeScore: 95,
        interests: ["Travel", "Art", "Music"],
      },
      {
        id: 2,
        name: "James Chen",
        age: 32,
        location: "London, UK",
        image: "/placeholder-user.jpg",
        verified: true,
        vibeScore: 92,
        interests: ["Fitness", "Tech", "Food"],
      },
      {
        id: 3,
        name: "Sofia Garcia",
        age: 26,
        location: "Barcelona, Spain",
        image: "/placeholder-user.jpg",
        verified: true,
        vibeScore: 98,
        interests: ["Dance", "Photography", "Movies"],
      },
      {
        id: 4,
        name: "Marcus Johnson",
        age: 30,
        location: "Toronto, Canada",
        image: "/placeholder-user.jpg",
        verified: false,
        vibeScore: 88,
        interests: ["Sports", "Gaming", "Travel"],
      },
      {
        id: 5,
        name: "Yuki Tanaka",
        age: 27,
        location: "Tokyo, Japan",
        image: "/placeholder-user.jpg",
        verified: true,
        vibeScore: 96,
        interests: ["Anime", "Cooking", "Fashion"],
      },
      {
        id: 6,
        name: "Alessandro Rossi",
        age: 34,
        location: "Milan, Italy",
        image: "/placeholder-user.jpg",
        verified: true,
        vibeScore: 91,
        interests: ["Fashion", "Wine", "Art"],
      },
      {
        id: 7,
        name: "Isabella Santos",
        age: 29,
        location: "São Paulo, Brazil",
        image: "/placeholder-user.jpg",
        verified: true,
        vibeScore: 94,
        interests: ["Samba", "Food", "Travel"],
      },
      {
        id: 8,
        name: "David Kumar",
        age: 31,
        location: "Mumbai, India",
        image: "/placeholder-user.jpg",
        verified: true,
        vibeScore: 89,
        interests: ["Yoga", "Music", "Culture"],
      },
      {
        id: 9,
        name: "Lisa Wang",
        age: 25,
        location: "Singapore",
        image: "/placeholder-user.jpg",
        verified: true,
        vibeScore: 97,
        interests: ["Tech", "Fashion", "Food"],
      },
      {
        id: 10,
        name: "Carlos Lopez",
        age: 33,
        location: "Mexico City, Mexico",
        image: "/placeholder-user.jpg",
        verified: false,
        vibeScore: 90,
        interests: ["Art", "Travel", "Sports"],
      },
    ]

    const profiles = mockProfiles.slice(0, parseInt(limit))

    return NextResponse.json(
      {
        success: true,
        count: profiles.length,
        profiles,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error fetching profiles:", error)
    return NextResponse.json(
      { error: "Failed to fetch profiles" },
      { status: 500 }
    )
  }
}
