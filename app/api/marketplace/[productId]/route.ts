import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { productId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      console.log("[GET /api/marketplace/[productId]] User not authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const productId = params.productId
    const supabase = await createClient()
    const userId = session.user.id

    // console.log(`[GET /api/marketplace/[productId]] Fetching product ${productId}`)

    // Get product details
    const { data: product, error: productError } = await supabase
      .from("marketplace_products")
      .select(
        `
        id,
        user_id,
        title,
        description,
        category,
        price,
        condition,
        is_available,
        image_urls,
        created_at,
        updated_at,
        delivery_instructions,
        users(id, display_name, email, profile_picture, followers_count)
      `
      )
      .eq("id", productId)
      .single()

    if (productError || !product) {
      console.error("[GET /api/marketplace/[productId]] Product not found")
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Get seller's other products
    const { data: sellerProducts, error: sellerError } = await supabase
      .from("marketplace_products")
      .select("id, title, image_urls, price")
      .eq("user_id", product.user_id)
      .neq("id", productId)
      .limit(5)

    if (sellerError) {
      console.error("[GET /api/marketplace/[productId]] Error fetching seller products:", sellerError)
      // Don't throw, seller products is optional
    }

    // Check if user saved this product
    const { data: saved, error: savedError } = await supabase
      .from("saved_posts")
      .select("id")
      .eq("user_id", userId)
      .eq("post_id", productId)
      .single()

    if (savedError && savedError.code !== "PGRST116") {
      console.error("[GET /api/marketplace/[productId]] Error checking saved:", savedError)
      // Don't throw, saved status is optional
    }

    const productDetails = {
      ...product,
      isSaved: !!saved,
      seller: product.users,
      sellerOtherProducts: sellerProducts || [],
      users: undefined, // Remove raw user data
    }

    // console.log(
    //   `[GET /api/marketplace/[productId]] Product loaded - ${product.title}, price: $${product.price}`
    // )

    return NextResponse.json({
      success: true,
      product: productDetails,
    })
  } catch (error) {
    console.error("[GET /api/marketplace/[productId]] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
