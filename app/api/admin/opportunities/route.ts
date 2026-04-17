import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

/**
 * GET /api/admin/opportunities
 * Fetch opportunities with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("admin_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
      jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get("status") || "all";
    const type = url.searchParams.get("type") || "all"; // all, user, admin
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");

    let query = supabase
      .from("opportunities")
      .select("*, users(id, display_name, email, profile_picture), admins:admins!opportunities_admin_id_fkey(id, full_name, profile_picture)", { count: "exact" });

    if (status !== "all") {
      query = query.eq("status", status);
    }

    if (type === "admin") {
      query = query.not("admin_id", "is", null);
    } else if (type === "user") {
      query = query.not("user_id", "is", null);
    }

    const { data: opportunities, error, count } = await query
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    return NextResponse.json({
      opportunities: opportunities || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        pages: Math.ceil((count || 0) / limit),
      }
    });
  } catch (error: any) {
    console.error("Admin Fetch Opportunities Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/opportunities
 * Create a new opportunity by Admin (Auto-approved)
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("admin_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, category, location, link_url, image_url, content } = body;

    const { data, error } = await supabase
      .from("opportunities")
      .insert({
        title,
        description,
        category,
        location,
        link_url,
        image_url,
        content,
        admin_id: decoded.id, // ID from JWT
        status: "approved",
        approved_by: decoded.id,
        approved_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ opportunity: data, message: "Opportunity created and approved successfully" });
  } catch (error: any) {
    console.error("Admin Create Opportunity Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
