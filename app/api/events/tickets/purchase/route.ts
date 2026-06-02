import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { generateTicketPDF } from "@/lib/ticket-generator";
import { sendTicketEmail } from "@/lib/email-service";
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

    // Generate PDF and send email for free ticket
    try {
      console.log("[FREE_TICKET] Generating PDF for:", event.title, "attendee:", attendeeName);
      const pdfBuffer = await generateTicketPDF({
        eventName: event.title,
        eventDate: new Date(event.event_date).toLocaleDateString(),
        eventTime: new Date(event.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        venue: event.location_name || "Online / TBD",
        address: event.location_name || "Not specified",
        ticketType: "Free Pass",
        attendeeName: attendeeName,
        barcode: barcode,
        thumbnailUrl: thumbnailUrl
      });
      console.log("[FREE_TICKET] PDF generated successfully, size:", pdfBuffer.length);

      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; background-color: #1a1a1a; color: #ffffff; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #ffffff; margin: 0;">Vibe2Gether</h1>
            <p style="color: #4ade80; margin: 5px 0 0 0;">✓ Confirmed</p>
          </div>
          
          <h2 style="text-align: center; font-size: 24px; margin-bottom: 20px;">
            Hi ${attendeeName}, your ticket for<br/>
            <span style="color: #f97316;">${event.title}</span><br/>
            is confirmed.
          </h2>

          ${thumbnailUrl ? `
            <div style="width: 100%; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
              <img src="${thumbnailUrl}" alt="Event Flyer" style="width: 100%; height: auto; display: block;" />
            </div>
          ` : ""}

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; border-top: 1px solid #333; border-bottom: 1px solid #333; padding: 15px 0;">
            <div>
              <p style="color: #888; font-size: 12px; margin: 0; text-transform: uppercase;">Date</p>
              <p style="margin: 5px 0 0 0; font-weight: bold;">${new Date(event.event_date).toLocaleDateString()}</p>
            </div>
            <div>
              <p style="color: #888; font-size: 12px; margin: 0; text-transform: uppercase;">Time</p>
              <p style="margin: 5px 0 0 0; font-weight: bold;">${new Date(event.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div>
              <p style="color: #888; font-size: 12px; margin: 0; text-transform: uppercase;">Venue</p>
              <p style="margin: 5px 0 0 0; font-weight: bold;">${event.location_name || "Not specified"}</p>
            </div>
            <div>
              <p style="color: #888; font-size: 12px; margin: 0; text-transform: uppercase;">Type</p>
              <p style="margin: 5px 0 0 0; font-weight: bold;">Free Pass</p>
            </div>
          </div>

          <div style="background: #222; padding: 15px; border-radius: 8px;">
            <p style="color: #888; font-size: 12px; margin: 0; text-transform: uppercase;">Order #${barcode}</p>
            <h3 style="margin: 10px 0;">${event.title}</h3>
            <p style="color: #aaa; font-size: 14px; line-height: 1.5;">${event.description || ""}</p>
            <p style="color: #888; font-size: 12px; margin-top: 15px;">Your official ticket PDF is attached to this email. Please present it at the venue.</p>
          </div>
        </div>
      `;

      console.log("[FREE_TICKET] Sending email to:", attendeeEmail);
      const emailResult = await sendTicketEmail({
        to: attendeeEmail,
        subject: `Your Free Ticket for ${event.title} - Vibe2Gether`,
        html: emailHtml,
        attachments: [
          {
            filename: `ticket-${event.title.replace(/\s+/g, '-').toLowerCase()}.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf"
          }
        ]
      });
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
