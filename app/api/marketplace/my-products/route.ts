import { getServerSession } from "next-auth/next";
import { createClient } from "@/lib/supabase/server";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = await createClient();

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

    // Get user's products
    const { data: products, error } = await supabase
      .from("marketplace_products")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_available", true)
      .order("created_at", { ascending: false });

    if (error) {
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      products: products || [],
    });
  } catch (error) {
    console.error("Fetch user products error:", error);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
