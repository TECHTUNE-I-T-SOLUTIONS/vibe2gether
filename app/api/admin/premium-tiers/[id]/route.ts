import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

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

// GET single tier
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: tier, error } = await supabase
      .from("premium_tiers")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error) {
      return NextResponse.json({ error: "Tier not found" }, { status: 404 });
    }

    return NextResponse.json(tier);
  } catch (error) {
    console.error("Get tier error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT update tier
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = verifyAdmin(request);
    if (!admin || admin.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - admin access required" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Get old values for audit
    const { data: oldTier } = await supabase
      .from("premium_tiers")
      .select("*")
      .eq("id", params.id)
      .single();

    const { data: tier, error } = await supabase
      .from("premium_tiers")
      .update({
        name: body.name?.toLowerCase() || undefined,
        description: body.description,
        monthly_price: body.monthlyPrice,
        features: body.features,
        max_boosts: body.maxBoosts,
        max_profile_views: body.maxProfileViews,
        priority_support: body.prioritySupport,
        analytics: body.analytics,
        is_active: body.isActive,
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Log action
    await supabase.from("admin_audit_logs").insert({
      admin_id: admin.id,
      action: "UPDATE_PREMIUM_TIER",
      resource_type: "premium_tier",
      resource_id: params.id,
      old_values: oldTier,
      new_values: tier,
    });

    return NextResponse.json(tier);
  } catch (error) {
    console.error("Update tier error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE tier
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = verifyAdmin(request);
    if (!admin || admin.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - admin access required" },
        { status: 401 }
      );
    }

    // Check if tier is in use
    const { count: subscriptionCount } = await supabase
      .from("premium_subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("plan", params.id);

    if ((subscriptionCount || 0) > 0) {
      return NextResponse.json(
        { error: "Cannot delete tier with active subscriptions" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("premium_tiers")
      .delete()
      .eq("id", params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Log action
    await supabase.from("admin_audit_logs").insert({
      admin_id: admin.id,
      action: "DELETE_PREMIUM_TIER",
      resource_type: "premium_tier",
      resource_id: params.id,
    });

    return NextResponse.json({
      message: "Tier deleted successfully",
    });
  } catch (error) {
    console.error("Delete tier error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
