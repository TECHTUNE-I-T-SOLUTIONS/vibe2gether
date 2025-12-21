import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware to verify admin
function verifyAdmin(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded;
  } catch (error) {
    return null;
  }
}

// GET all tiers
export async function GET(request: NextRequest) {
  try {
    const { data: tiers, error } = await supabase
      .from("premium_tiers")
      .select("*")
      .order("monthly_price", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(tiers);
  } catch (error) {
    console.error("Get tiers error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST create new tier
export async function POST(request: NextRequest) {
  try {
    const admin = verifyAdmin(request);
    if (!admin || admin.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - admin access required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, monthlyPrice, features, maxBoosts, maxProfileViews, prioritySupport, analytics } =
      body;

    if (!name || !monthlyPrice) {
      return NextResponse.json(
        { error: "Name and monthly price are required" },
        { status: 400 }
      );
    }

    const { data: tier, error } = await supabase
      .from("premium_tiers")
      .insert({
        name: name.toLowerCase(),
        description,
        monthly_price: monthlyPrice,
        features: features || {},
        max_boosts: maxBoosts || 0,
        max_profile_views: maxProfileViews || 0,
        priority_support: prioritySupport || false,
        analytics: analytics || false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Log action
    await supabase.from("admin_audit_logs").insert({
      admin_id: admin.id,
      action: "CREATE_PREMIUM_TIER",
      resource_type: "premium_tier",
      resource_id: tier.id,
      new_values: tier,
    });

    return NextResponse.json(tier, { status: 201 });
  } catch (error) {
    console.error("Create tier error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
