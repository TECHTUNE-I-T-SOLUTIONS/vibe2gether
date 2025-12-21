import { createClient } from "@supabase/supabase-js";
import { hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("fullName") as string;
    const profilePictureFile = formData.get("profilePicture") as File | null;
    const coverImageFile = formData.get("coverImage") as File | null;
    const securityQuestionsJson = formData.get("securityQuestions") as string;

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "Missing required fields: email, password, fullName" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Parse security questions
    let securityQuestions = [];
    if (securityQuestionsJson) {
      try {
        securityQuestions = JSON.parse(securityQuestionsJson);
      } catch (e) {
        return NextResponse.json(
          { error: "Invalid security questions format" },
          { status: 400 }
        );
      }
    }

    if (!securityQuestions || securityQuestions.length === 0) {
      return NextResponse.json(
        { error: "At least 2 security questions are required" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hash(password, 10);

    // Upload profile picture if provided
    let profilePictureUrl = null;
    if (profilePictureFile) {
      const timestamp = Date.now();
      const fileName = `admin-${timestamp}-${Math.random().toString(36).slice(2)}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("profile_pictures")
        .upload(`admins/${fileName}`, profilePictureFile, {
          contentType: profilePictureFile.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Profile picture upload error:", uploadError);
        return NextResponse.json(
          { error: `Profile picture upload failed: ${uploadError.message}` },
          { status: 400 }
        );
      }

      const { data: publicUrl } = supabase.storage
        .from("profile_pictures")
        .getPublicUrl(`admins/${fileName}`);

      profilePictureUrl = publicUrl.publicUrl;
    }

    // Upload cover image if provided
    let coverImageUrl = null;
    if (coverImageFile) {
      const timestamp = Date.now();
      const fileName = `admin-cover-${timestamp}-${Math.random().toString(36).slice(2)}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("cover_image")
        .upload(`admins/${fileName}`, coverImageFile, {
          contentType: coverImageFile.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Cover image upload error:", uploadError);
        return NextResponse.json(
          { error: `Cover image upload failed: ${uploadError.message}` },
          { status: 400 }
        );
      }

      const { data: publicUrl } = supabase.storage
        .from("cover_image")
        .getPublicUrl(`admins/${fileName}`);

      coverImageUrl = publicUrl.publicUrl;
    }

    // Create admin user
    const { data: admin, error: adminError } = await supabase
      .from("admins")
      .insert({
        email,
        password_hash: passwordHash,
        full_name: fullName,
        profile_picture: profilePictureUrl,
        cover_image: coverImageUrl,
        role: "moderator",
        is_active: true,
        two_factor_enabled: false,
      })
      .select("id")
      .single();

    if (adminError) {
      return NextResponse.json(
        { error: `Admin creation failed: ${adminError.message}` },
        { status: 400 }
      );
    }

    // Add security questions if provided
    if (securityQuestions && securityQuestions.length > 0 && admin?.id) {
      const questionsToInsert = await Promise.all(
        securityQuestions.map(async (q: any) => {
          const answerHash = await hash(q.answer, 10);
          return {
            admin_id: admin.id,
            question: q.question,
            answer_hash: answerHash,
          };
        })
      );

      const { error: questionsError } = await supabase
        .from("admin_security_questions")
        .insert(questionsToInsert);

      if (questionsError) {
        console.error("Security questions error:", questionsError);
        return NextResponse.json(
          { error: `Security questions setup failed: ${questionsError.message}` },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      message: "Admin account created successfully",
      admin: {
        id: admin?.id,
        email,
        fullName,
        profilePicture: profilePictureUrl,
        coverImage: coverImageUrl,
      },
    });
  } catch (error) {
    console.error("Admin signup error:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}
