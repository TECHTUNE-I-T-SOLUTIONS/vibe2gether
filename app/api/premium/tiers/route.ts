import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    console.log("[GET /api/premium/tiers] Fetching premium tiers")

    const { data: tiers, error } = await supabase
      .from("premium_tiers")
      .select("*")
      .eq("is_active", true)
      .order("monthly_price", { ascending: true })

    if (error) {
      console.error("[GET /api/premium/tiers] Error fetching tiers:", error)
      throw error
    }

    console.log(`[GET /api/premium/tiers] Found ${tiers?.length || 0} active tiers`)

    return NextResponse.json({
      tiers: (tiers || []).map((tier) => ({
        id: tier.id,
        name: tier.name,
        description: tier.description,
        monthlyPrice: tier.monthly_price,
        features: tier.features || [],
        maxBoosts: tier.max_boosts,
        maxProfileViews: tier.max_profile_views,
        prioritySupport: tier.priority_support,
        analytics: tier.analytics,
      })),
    })
  } catch (error) {
    console.error("[GET /api/premium/tiers] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
