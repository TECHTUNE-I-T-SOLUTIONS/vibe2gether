import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("admin_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (!decoded.id) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    // Fetch full admin data from database
    const { data: admin, error } = await supabase
      .from("admins")
      .select("id, email, full_name, profile_picture, cover_image, role, permissions, is_active, two_factor_enabled, created_at, updated_at, last_login_at")
      .eq("id", decoded.id)
      .single();

    if (error || !admin) {
      return NextResponse.json(
        { error: "Admin not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: admin.id,
      email: admin.email,
      full_name: admin.full_name,
      profile_picture: admin.profile_picture,
      cover_image: admin.cover_image,
      role: admin.role,
      permissions: admin.permissions,
      is_active: admin.is_active,
      two_factor_enabled: admin.two_factor_enabled,
      created_at: admin.created_at,
      updated_at: admin.updated_at,
      last_login_at: admin.last_login_at,
    });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json(
      { error: "Invalid token" },
      { status: 401 }
    );
  }
}
