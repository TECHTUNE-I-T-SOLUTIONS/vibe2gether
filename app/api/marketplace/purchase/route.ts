import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { initializePayment, generatePaystackReference } from "@/lib/paystack"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      console.log("[POST /api/marketplace/purchase] User not authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { productId } = await request.json()

    if (!productId) {
      console.error("[POST /api/marketplace/purchase] Product ID required")
      return NextResponse.json({ error: "Product ID required" }, { status: 400 })
    }

    const supabase = await createClient()
    const userId = session.user.id

    console.log(`[POST /api/marketplace/purchase] User ${userId} purchasing product ${productId}`)

    // Get product details
    const { data: product, error: productError } = await supabase
      .from("marketplace_products")
      .select("*, users(display_name, email)")
      .eq("id", productId)
      .single()

    if (productError || !product) {
      console.error("[POST /api/marketplace/purchase] Product not found")
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    if (!product.is_available) {
      console.error("[POST /api/marketplace/purchase] Product not available")
      return NextResponse.json({ error: "Product not available" }, { status: 400 })
    }

    if (product.user_id === userId) {
      console.error("[POST /api/marketplace/purchase] Cannot purchase own product")
      return NextResponse.json({ error: "Cannot purchase own product" }, { status: 400 })
    }

    // Create transaction record with pending status
    const reference = generatePaystackReference()
    const { data: transaction, error: transError } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        amount: Math.round(product.price * 100),
        type: "marketplace_purchase",
        status: "pending",
        payment_method: "paystack",
        metadata: {
          productId,
          sellerId: product.user_id,
          productTitle: product.title,
          reference,
        },
      })
      .select()
      .single()

    if (transError) {
      console.error("[POST /api/marketplace/purchase] Error creating transaction:", transError)
      throw transError
    }

    // Get user email for Paystack
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("email, display_name")
      .eq("id", userId)
      .single()

    if (userError || !user?.email) {
      console.error("[POST /api/marketplace/purchase] Error fetching user email:", userError)
      throw new Error("User email not found")
    }

    // Initialize Paystack payment
    const paystackResponse = await initializePayment({
      email: user.email,
      amount: Math.round(product.price * 100), // Convert to kobo
      reference,
      metadata: {
        productId,
        userId,
        transactionId: transaction.id,
        type: "marketplace_purchase",
      },
      callback_url: `${process.env.APP_BASE_URL}/marketplace/payment-callback?reference=${reference}`,
    })

    if (!paystackResponse.status || !paystackResponse.data) {
      throw new Error("Failed to initialize Paystack payment")
    }

    console.log(
      `[POST /api/marketplace/purchase] Payment initialized for product ${productId}, reference: ${reference}`
    )

    return NextResponse.json({
      success: true,
      authorization_url: paystackResponse.data.authorization_url,
      access_code: paystackResponse.data.access_code,
      reference: paystackResponse.data.reference,
      transactionId: transaction.id,
    })
  } catch (error) {
    console.error("[POST /api/marketplace/purchase] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
