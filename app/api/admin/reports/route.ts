import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

/**
 * GET /api/admin/reports
 * Fetch reports with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin auth
    const token = request.cookies.get("admin_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get("status") || "all";
    const priority = url.searchParams.get("priority") || "all";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");

    // Build base query
    let query = supabase
      .from("reports")
      .select("*", { count: "exact" });

    // Apply filters
    if (status !== "all") {
      query = query.eq("status", status);
    }
    if (priority !== "all") {
      query = query.eq("priority", priority);
    }

    // Apply pagination
    const { data: reports, error, count } = await query
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch reports: ${error.message}` },
        { status: 400 }
      );
    }

    // Fetch reporter information
    const reporterIds = [...new Set((reports || []).map(r => r.reporter_id))];
    const { data: reporters } = await supabase
      .from("users")
      .select("id, full_name, profile_picture")
      .in("id", reporterIds);
    
    const reporterMap = new Map(reporters?.map((r: any) => [r.id, r]) ?? []);

    // For reported items, we need to fetch based on reported_type and reported_id
    const reportedUsers = [...new Set((reports || []).filter(r => r.reported_type === "user").map(r => r.reported_id))];
    const { data: reportedProfiles } = await supabase
      .from("users")
      .select("id, full_name, profile_picture")
      .in("id", reportedUsers);
    
    const reportedMap = new Map(reportedProfiles?.map((r: any) => [r.id, r]) ?? []);

    // Enrich reports with user data
    const enrichedReports = (reports || []).map((report: any) => ({
      ...report,
      reporter: reporterMap.get(report.reporter_id) || { full_name: "Unknown", avatar_url: null },
      reported: report.reported_type === "user" ? (reportedMap.get(report.reported_id) || { full_name: "Unknown", avatar_url: null }) : null
    }));

    // Get stats
    const { data: allReports } = await supabase.from("reports").select("status");
    const totalReports = count || 0;
    const pending = allReports?.filter((r) => r.status === "pending").length || 0;
    const resolved = allReports?.filter((r) => r.status === "resolved").length || 0;

    return NextResponse.json({
      reports: enrichedReports,
      pagination: {
        total: totalReports,
        page,
        limit,
        pages: Math.ceil(totalReports / limit),
      },
      stats: {
        total: totalReports,
        pending,
        resolved,
      },
    });
  } catch (error) {
    console.error("Fetch reports error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
