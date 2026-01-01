import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(request: NextRequest) {
  try {
    // Verify admin auth using JWT token
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
    const { action } = body;

    if (action === "mark-all-read") {
      // Mark all unread admin notifications as read
      const { error } = await supabase
        .from("admin_notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("is_read", false);

      if (error) {
        return NextResponse.json(
          { success: false, error: "Failed to mark notifications as read" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read",
      });
    } else if (action === "clear-all") {
      // Delete all admin notifications
      const { error } = await supabase
        .from("admin_notifications")
        .delete()
        .gt("id", "00000000-0000-0000-0000-000000000000");

      if (error) {
        return NextResponse.json(
          { success: false, error: "Failed to clear notifications" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "All notifications cleared",
      });
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid action" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Admin notifications action error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
