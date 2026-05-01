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

    // Generate PDF
    const pdfBuffer = await generateTicketPDF({
      eventName: event.title,
      eventDate: new Date(event.event_date).toLocaleDateString(),
      eventTime: new Date(event.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      venue: event.location_name || "Online / TBD",
      address: event.location_name || "Not specified",
      ticketType: event.is_free ? "Free Pass" : "General Access",
      attendeeName: attendeeName,
      barcode: barcode,
    });

    // Send Email
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
        <h1 style="color: #6366f1;">Vibe2Gether Event Ticket</h1>
        <p>Hi ${attendeeName},</p>
        <p>Thank you for purchasing a ticket for <strong>${event.title}</strong>!</p>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Event:</strong> ${event.title}</p>
          <p><strong>Date:</strong> ${new Date(event.event_date).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${new Date(event.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          <p><strong>Venue:</strong> ${event.location_name || "Not specified"}</p>
        </div>
        <p>Your official ticket PDF is attached to this email. Please present it at the venue for scanning.</p>
        <p>Best regards,<br/>The Vibe2Gether Team</p>
      </div>
    `;

    await sendTicketEmail({
      to: attendeeEmail,
      subject: `Your Ticket for ${event.title} - Vibe2Gether`,
      html: emailHtml,
      attachments: [
        {
          filename: `ticket-${event.title.replace(/\s+/g, '-').toLowerCase()}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf"
        }
      ]
    });

    return NextResponse.json({ success: true, ticketId: ticket.id });
  } catch (error: any) {
    console.error("Purchase error:", error);
    return NextResponse.json({ error: error.message || "Failed to process purchase" }, { status: 500 });
  }
}
