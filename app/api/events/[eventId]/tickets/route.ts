import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const eventId = resolvedParams.eventId;

    const supabase = await createClient();

    // Verify ownership
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("created_by")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.created_by !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch tickets
    const { data: tickets, error: ticketsError } = await supabase
      .from("event_tickets")
      .select("*")
      .eq("event_id", eventId)
      .eq("status", "paid")
      .order("created_at", { ascending: false });

    if (ticketsError) throw ticketsError;

    return NextResponse.json({ tickets });
  } catch (error: any) {
    console.error("Fetch tickets error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch tickets" }, { status: 500 });
  }
}
