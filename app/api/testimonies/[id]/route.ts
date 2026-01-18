import { createClient } from "@/lib/supabase/client"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, approval_notes, approved_by } = body

    if (!status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'approved' or 'rejected'" },
        { status: 400 }
      )
    }

    const supabase = createClient()

    const { data, error } = await supabase
      .from("testimonies")
      .update({
        status,
        approval_notes,
        approved_by,
        approved_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Testimony not found" }, { status: 404 })
    }

    return NextResponse.json({ data: data[0] })
  } catch (error) {
    console.error("Failed to update testimony:", error)
    return NextResponse.json(
      { error: "Failed to update testimony" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createClient()

    const { error } = await supabase.from("testimonies").delete().eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: "Testimony deleted" })
  } catch (error) {
    console.error("Failed to delete testimony:", error)
    return NextResponse.json(
      { error: "Failed to delete testimony" },
      { status: 500 }
    )
  }
}
