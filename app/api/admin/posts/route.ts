import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

/**
 * GET /api/admin/posts
 * Fetch posts with filtering and pagination
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
    const flagged = url.searchParams.get("flagged") || "all";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");

    let query = supabase
      .from("posts")
      .select("*, users(id, full_name, email, profile_picture)", { count: "exact" });

    // Apply filters
    if (status !== "all") {
      query = query.eq("status", status);
    }
    if (flagged === "true") {
      query = query.eq("is_flagged", true);
    } else if (flagged === "false") {
      query = query.eq("is_flagged", false);
    }

    // Apply pagination
    const { data: posts, error, count } = await query
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error("Query error details:", error);
      return NextResponse.json(
        { error: `Failed to fetch posts: ${error.message}`, details: error },
        { status: 400 }
      );
    }

    // Get stats
    const { data: allStats } = await supabase.from("posts").select("status, is_flagged", { count: "exact" });

    const total = count || 0;
    const published = allStats?.filter((p) => p.status === "published").length || 0;
    const underReview = allStats?.filter((p) => p.status === "under_review").length || 0;
    const flaggedCount = allStats?.filter((p) => p.is_flagged).length || 0;

    return NextResponse.json({
      posts: posts || [],
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      stats: {
        total,
        published,
        underReview,
        flagged: flaggedCount,
      },
    });
  } catch (error) {
    console.error("Fetch posts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/posts/:id
 * Update post status or flags
 */
export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { id, status, is_flagged, is_featured } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing post ID" },
        { status: 400 }
      );
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    if (status) updateData.status = status;
    if (is_flagged !== undefined) updateData.is_flagged = is_flagged;
    if (is_featured !== undefined) updateData.is_featured = is_featured;

    const { error } = await supabase
      .from("posts")
      .update(updateData)
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: `Update failed: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "Post updated successfully" });
  } catch (error) {
    console.error("Update post error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/posts/:id
 * Delete a post
 */
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing post ID" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: `Delete failed: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Delete post error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
