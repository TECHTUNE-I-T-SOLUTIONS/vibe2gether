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
    return jwt.verify(token, JWT_SECRET) as any;
  } catch {
    return null;
  }
}

/**
 * PUT /api/admin/opportunities/[id]
 * Approve, reject or update opportunity
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, rejection_reason, ...updateFields } = body;

    const updateData: any = { ...updateFields, updated_at: new Date().toISOString() };
    
    if (status) {
      updateData.status = status;
      if (status === "approved") {
        updateData.approved_by = admin.id;
        updateData.approved_at = new Date().toISOString();
      } else if (status === "rejected") {
        updateData.rejection_reason = rejection_reason;
      }
    }

    const { data, error } = await supabase
      .from("opportunities")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ opportunity: data, message: "Opportunity updated successfully" });
  } catch (error: any) {
    console.error("Admin Update Opportunity Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/opportunities/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { error } = await supabase.from("opportunities").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ message: "Opportunity deleted successfully" });
  } catch (error: any) {
    console.error("Admin Delete Opportunity Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
