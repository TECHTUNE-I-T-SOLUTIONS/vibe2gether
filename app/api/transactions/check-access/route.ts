import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get("itemId")
    const itemType = searchParams.get("itemType")

    if (!itemId || !itemType) {
      return NextResponse.json(
        { error: "Missing itemId or itemType" },
        { status: 400 }
      )
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    // Check if user has paid for this item
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("type", itemType)
      .eq("status", "completed")
      .limit(1)

    const transaction = transactions?.[0] || null

    return NextResponse.json({
      hasAccess: !!transaction,
      transaction,
    })
  } catch (error) {
    console.error("[CHECK_ACCESS] Error:", error)
    return NextResponse.json(
      { error: "Failed to check access" },
      { status: 500 }
    )
  }
}
