import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

export async function GET() {
  try {
    const { data: tiers, error } = await supabase
      .from("premium_tiers")
      .select("*")
      .eq("is_active", true)
      .order("monthly_price", { ascending: true })

    if (error) {
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      tiers: tiers || [],
    });
  } catch (error) {
    console.error("Fetch premium tiers error:", error);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
