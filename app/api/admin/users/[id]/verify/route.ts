import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()

    // Verify user is admin
    const {
      data: { user: adminUser },
    } = await supabase.auth.getUser()
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: userId } = await params

    // Check if user has verification details submitted
    const { data: verification, error: verifyError } = await supabase
      .from("user_verifications")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (verifyError && verifyError.code !== "PGRST116") {
      throw verifyError
    }

    if (!verification || !verification.id_document_url || !verification.selfie_url) {
      return NextResponse.json(
        { error: "User has not submitted all required verification documents" },
        { status: 400 }
      )
    }

    // Update verification status to approved
    const { error: updateError } = await supabase
      .from("user_verifications")
      .update({
        status: "approved",
        reviewed_by: adminUser.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", verification.id)

    if (updateError) throw updateError

    // The trigger will automatically update users.is_verified = true

    return NextResponse.json({ success: true, message: "User verified successfully" })
  } catch (error) {
    console.error("Error verifying user:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to verify user" },
      { status: 500 }
    )
  }
}
