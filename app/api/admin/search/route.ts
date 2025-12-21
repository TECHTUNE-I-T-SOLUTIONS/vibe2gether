import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import jwt from "jsonwebtoken"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase configuration")
}

const supabase = createClient(supabaseUrl, supabaseKey)

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminToken = request.cookies.get("admin_token")?.value
    if (!adminToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
      jwt.verify(adminToken, JWT_SECRET)
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q")?.trim()
    const type = searchParams.get("type")?.trim()

    if (!query || !type) {
      return NextResponse.json([])
    }

    let results: any[] = []

    // Search with ILIKE operator for case-insensitive search
    switch (type) {
      case "users":
        try {
          const { data: users, error: usersError } = await supabase
            .from("users")
            .select("id, full_name, email, profile_picture")
            .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
            .limit(10)

          if (usersError) {
            console.error("Users search error:", usersError)
          } else {
            results = (users || []).map(user => ({
              ...user,
              type: 'user'
            }))
          }
        } catch (err) {
          console.error("Users search exception:", err)
        }
        break

      case "posts":
        try {
          const { data: posts, error: postsError } = await supabase
            .from("posts")
            .select("id, title, content, category, created_at")
            .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
            .limit(10)

          if (postsError) {
            console.error("Posts search error:", postsError)
          } else {
            results = (posts || []).map(post => ({
              ...post,
              type: 'post'
            }))
          }
        } catch (err) {
          console.error("Posts search exception:", err)
        }
        break

      case "events":
        try {
          const { data: events, error: eventsError } = await supabase
            .from("events")
            .select("id, title, location_name, event_date")
            .or(`title.ilike.%${query}%,location_name.ilike.%${query}%`)
            .limit(10)

          if (eventsError) {
            console.error("Events search error:", eventsError)
          } else {
            results = (events || []).map(event => ({
              ...event,
              type: 'event'
            }))
          }
        } catch (err) {
          console.error("Events search exception:", err)
        }
        break

      case "products":
        try {
          const { data: products, error: productsError } = await supabase
            .from("marketplace_products")
            .select("id, title, category, price")
            .or(`title.ilike.%${query}%,category.ilike.%${query}%`)
            .limit(10)

          if (productsError) {
            console.error("Products search error:", productsError)
          } else {
            results = (products || []).map(product => ({
              ...product,
              type: 'product'
            }))
          }
        } catch (err) {
          console.error("Products search exception:", err)
        }
        break
    }

    return NextResponse.json(results || [])
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ error: "Search failed", details: String(error) }, { status: 500 })
  }
}
