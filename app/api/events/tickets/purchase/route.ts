import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const supabase = await createClient();
    const data = await req.json();

    const { 
      eventId, 
      attendeeName, 
      attendeeEmail, 
      attendeePhone, 
      attendeeAddress 
    } = data;

    if (!eventId || !attendeeName || !attendeeEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch event details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (!event.is_free) {
      return NextResponse.json({ error: "Paid events require payment confirmation" }, { status: 400 });
    }

    if (event.status !== "upcoming" || (event.event_date && new Date(event.event_date) < new Date())) {
      return NextResponse.json({ error: "Tickets are closed for this event" }, { status: 400 });
    }

    if (event.capacity && (event.registered_count || 0) >= event.capacity) {
      return NextResponse.json({ error: "This event is sold out" }, { status: 400 });
    }

    if (session?.user?.id) {
      const { data: existingRegistration } = await supabase
        .from("event_registrations")
        .select("id")
        .eq("event_id", eventId)
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (existingRegistration) {
        return NextResponse.json({ error: "You already have a ticket for this event" }, { status: 409 });
      }
    }

    const amountPaid = 0;
    const platformFee = amountPaid * 0.03;
    const payoutAmount = amountPaid - platformFee;
    const barcode = `TKT-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;

    // Insert ticket into database
    const { data: ticket, error: ticketError } = await supabase
      .from("event_tickets")
      .insert({
        event_id: eventId,
        user_id: session?.user?.id || null,
        attendee_name: attendeeName,
        attendee_email: attendeeEmail,
        attendee_phone: attendeePhone,
        attendee_address: attendeeAddress,
        amount_paid: amountPaid,
        platform_fee: platformFee,
        payout_amount: payoutAmount,
        barcode: barcode,
        status: "paid"
      })
      .select()
      .single();

    if (ticketError) {
      throw ticketError;
    }

    // Insert registration record for free event
    if (session?.user?.id) {
      const { error: registrationError } = await supabase
        .from("event_registrations")
        .upsert(
          {
            event_id: eventId,
            user_id: session.user.id,
            status: "confirmed",
            payment_status: "free",
            payment_reference: null,
            amount_paid: 0,
            currency: "NGN",
            payment_method: "free",
            paid_at: new Date().toISOString(),
          },
          { onConflict: "event_id,user_id" }
        );

      if (registrationError) {
        console.error("Error creating registration:", registrationError);
      }
    }

    await supabase
      .from("events")
      .update({ registered_count: (event.registered_count || 0) + 1 })
      .eq("id", eventId);

    const thumbnailUrl = event.thumbnail_url || event.thumbnail || "";

    // Use generate-ticket endpoint to avoid jsPDF issues
    try {
      console.log("[FREE_TICKET] Calling generate-ticket endpoint for:", event.title, "attendee:", attendeeName);
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/generate-ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: ticket.id,
          eventId: event.id,
          userId: session?.user?.id
        })
      })
      console.log("[FREE_TICKET] Ticket generation successful");;
      console.log("[FREE_TICKET] Email send result:", JSON.stringify(emailResult));
    } catch (emailError) {
      // Log the error but don't fail the ticket creation
      console.error("[FREE_TICKET] Failed to generate PDF or send email:", emailError);
    }

    return NextResponse.json({ success: true, ticketId: ticket.id });
  } catch (error: any) {
    console.error("Purchase error:", error);
    return NextResponse.json({ error: error.message || "Failed to process purchase" }, { status: 500 });
  }
}
