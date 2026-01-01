import { getServerSession } from "next-auth/next";
import { createClient } from "@/lib/supabase/server";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createClient();

    // Get user
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .single();

    if (userError || !user) {
      return Response.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === "mark-all-read") {
      // Mark all unread notifications as read
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) {
        return Response.json(
          { success: false, error: "Failed to mark notifications as read" },
          { status: 500 }
        );
      }

      return Response.json({
        success: true,
        message: "All notifications marked as read",
      });
    } else if (action === "clear-all") {
      // Delete all notifications
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user.id);

      if (error) {
        return Response.json(
          { success: false, error: "Failed to clear notifications" },
          { status: 500 }
        );
      }

      return Response.json({
        success: true,
        message: "All notifications cleared",
      });
    } else {
      return Response.json(
        { success: false, error: "Invalid action" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Notifications action error:", error);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
