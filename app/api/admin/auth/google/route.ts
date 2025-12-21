import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

/**
 * POST /api/admin/auth/google
 * Handles Google OAuth callback and admin login/signup
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, email, name, picture } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if admin exists
    const { data: existingAdmin, error: queryError } = await supabase
      .from("admins")
      .select("*")
      .eq("email", email)
      .single();

    if (existingAdmin) {
      // Existing admin - update last_login and return token
      await supabase
        .from("admins")
        .update({ 
          last_login_at: new Date().toISOString(),
          google_id: body.googleId || existingAdmin.google_id
        })
        .eq("id", existingAdmin.id);

      const token = jwt.sign(
        {
          id: existingAdmin.id,
          email: existingAdmin.email,
          role: existingAdmin.role,
          fullName: existingAdmin.full_name,
        },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      const response = NextResponse.json({
        message: "Google login successful",
        admin: {
          id: existingAdmin.id,
          email: existingAdmin.email,
          fullName: existingAdmin.full_name,
          role: existingAdmin.role,
          profilePicture: existingAdmin.profile_picture,
        },
      });

      response.cookies.set("admin_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 86400,
      });

      return response;
    }

    // New admin - create account
    if (queryError && queryError.code === "PGRST116") {
      // No existing admin, create new one
      const { data: newAdmin, error: createError } = await supabase
        .from("admins")
        .insert({
          email,
          full_name: name || "Admin User",
          password_hash: "", // Empty for Google OAuth
          profile_picture: picture || null,
          role: "moderator",
          is_active: true,
          google_id: body.googleId || null,
        })
        .select("*")
        .single();

      if (createError) {
        return NextResponse.json(
          { error: createError.message },
          { status: 400 }
        );
      }

      // Create security questions for the new admin (optional, can be set later)
      if (newAdmin?.id) {
        // Admin can set security questions later
        await supabase.from("admin_security_questions").insert({
          admin_id: newAdmin.id,
          question: "Set your security questions in settings",
          answer_hash: "",
        });
      }

      const token = jwt.sign(
        {
          id: newAdmin.id,
          email: newAdmin.email,
          role: newAdmin.role,
          fullName: newAdmin.full_name,
        },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      const response = NextResponse.json({
        message: "Google signup successful",
        admin: {
          id: newAdmin.id,
          email: newAdmin.email,
          fullName: newAdmin.full_name,
          role: newAdmin.role,
          profilePicture: newAdmin.profile_picture,
        },
      });

      response.cookies.set("admin_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 86400,
      });

      return response;
    }

    return NextResponse.json(
      { error: "Failed to process Google authentication" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Google auth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
