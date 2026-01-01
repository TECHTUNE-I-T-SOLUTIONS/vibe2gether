import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createClient();

    const { data: tiers, error } = await supabase
      .from("premium_tiers")
      .select("*")
      .eq("is_active", true)
      .order("monthly_price", { ascending: true });

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
