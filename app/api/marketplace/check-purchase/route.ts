import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if user has purchased this product
    const { data: purchase, error } = await supabase
      .from("marketplace_purchases")
      .select("id, status")
      .eq("product_id", productId)
      .eq("buyer_id", session.user.id)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Error checking purchase:", error)
      return NextResponse.json(
        { purchased: false, status: null }
      )
    }

    return NextResponse.json({
      purchased: !!purchase,
      status: purchase?.status || null,
    })
  } catch (error) {
    console.error("Check purchase error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
