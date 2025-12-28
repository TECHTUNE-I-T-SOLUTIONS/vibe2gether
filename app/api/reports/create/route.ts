import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { reportedType, reportedId, reason, description } =
      await request.json()

    if (!reportedType || !reportedId || !reason) {
      return NextResponse.json(
        { error: "reportedType, reportedId, and reason are required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Create report
    const { data: report, error } = await supabase
      .from("reports")
      .insert({
        reporter_id: session.user.id,
        reported_type: reportedType,
        reported_id: reportedId,
        reason,
        description: description || null,
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      console.error("Report creation error:", error)
      return NextResponse.json(
        { error: "Failed to create report" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      report,
    })
  } catch (error) {
    console.error("Report error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
