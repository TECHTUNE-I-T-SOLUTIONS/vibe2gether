import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      console.log("[GET /api/marketplace] User not authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "12")
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    const condition = searchParams.get("condition") // new, like-new, good, fair

    const supabase = await createClient()
    const userId = session.user.id

    // console.log(
    //   `[GET /api/marketplace] User ${userId} fetching products - page: ${page}, limit: ${limit}`
    // )

    // Build query
    let query = supabase
      .from("marketplace_products")
      .select(
        `
        id,
        user_id,
        title,
        description,
        category,
        price,
        currency,
        condition,
        is_available,
        media,
        status,
        location_name,
        created_at,
        users(id, display_name, profile_picture)
      `,
        { count: "exact" }
      )

    // Add filters
    if (category) query = query.eq("category", category)
    if (condition) query = query.eq("condition", condition)
    if (minPrice) query = query.gte("price", parseFloat(minPrice))
    if (maxPrice) query = query.lte("price", parseFloat(maxPrice))

    // Add search
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Add pagination
    const { data: products, count, error } = await query
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (error) {
      console.error("[GET /api/marketplace] Error fetching products:", error)
      throw error
    }

    // Enrich with saved status
    const { data: savedProducts, error: savedError } = await supabase
      .from("saved_posts")
      .select("post_id")
      .eq("user_id", userId)
      .in("post_id", (products || []).map((p) => p.id))

    if (savedError) {
      console.error("[GET /api/marketplace] Error fetching saved products:", savedError)
      // Don't throw, saved status is optional
    }

    const savedIds = new Set((savedProducts || []).map((s) => s.post_id))

    const enrichedProducts = (products || []).map((product) => ({
      ...product,
      seller: product.users,
      isSaved: savedIds.has(product.id),
      users: undefined,
    }))

    const totalPages = Math.ceil((count || 0) / limit)

    // console.log(
    //   `[GET /api/marketplace] Fetched ${products?.length || 0} products - total: ${count}`
    // )

    return NextResponse.json({
      success: true,
      products: enrichedProducts,
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
      },
    })
  } catch (error) {
    console.error("[GET /api/marketplace] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
