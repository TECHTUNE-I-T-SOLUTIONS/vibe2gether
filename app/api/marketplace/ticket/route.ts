import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      console.log("[GET /api/marketplace/ticket] User not authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")
    const transactionId = searchParams.get("transactionId")

    if (!productId || !transactionId) {
      console.error("[GET /api/marketplace/ticket] Missing required parameters")
      return NextResponse.json({ error: "Product ID and Transaction ID required" }, { status: 400 })
    }

    const supabase = await createClient()
    const userId = session.user.id

    console.log(
      `[GET /api/marketplace/ticket] User ${userId} requesting ticket for product ${productId}`
    )

    // Get transaction
    const { data: transaction, error: transError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .eq("user_id", userId)
      .eq("type", "marketplace_purchase")
      .single()

    if (transError || !transaction) {
      console.error("[GET /api/marketplace/ticket] Transaction not found")
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    if (transaction.status !== "completed") {
      console.error("[GET /api/marketplace/ticket] Payment not completed")
      return NextResponse.json({ error: "Payment not completed. Please try again." }, { status: 400 })
    }

    // Get product details
    const { data: product, error: productError } = await supabase
      .from("marketplace_products")
      .select("*")
      .eq("id", productId)
      .single()

    if (productError || !product) {
      console.error("[GET /api/marketplace/ticket] Product not found")
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Generate ticket content
    const ticketCode = `MKT-${productId.substring(0, 8).toUpperCase()}-${transactionId.substring(0, 8).toUpperCase()}-${Date.now()}`

    const ticketContent = `
==============================================
        MARKETPLACE PURCHASE TICKET
==============================================

Ticket Code: ${ticketCode}
Transaction ID: ${transaction.id}
Purchase Date: ${new Date(transaction.created_at).toLocaleDateString()}

PRODUCT DETAILS
Product: ${product.title}
Price: $${product.price.toFixed(2)}
Seller: ${product.seller_name || "Marketplace"}
Description: ${product.description}

BUYER INFORMATION
User ID: ${userId}
Purchase Time: ${new Date(transaction.created_at).toLocaleString()}

DELIVERY INSTRUCTIONS
${product.delivery_instructions || "Product will be delivered as per seller's instructions."}

This ticket confirms your purchase and should be kept for your records.
Present this ticket code for delivery/download verification.

==============================================
`

    console.log(
      `[GET /api/marketplace/ticket] Ticket generated for transaction ${transactionId}`
    )

    // Return ticket as downloadable content
    return new NextResponse(ticketContent, {
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": `attachment; filename="ticket-${ticketCode}.txt"`,
      },
    })
  } catch (error) {
    console.error("[GET /api/marketplace/ticket] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
