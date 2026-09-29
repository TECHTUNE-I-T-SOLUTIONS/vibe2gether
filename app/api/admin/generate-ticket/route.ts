import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendTicketEmail } from "@/lib/email-service"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

export async function POST(request: NextRequest) {
  try {
    const { registrationId, eventId, userId } = await request.json()

    if (!registrationId || !eventId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Fetch registration with event details
    const { data: registration, error: regError } = await supabase
      .from("event_registrations")
      .select("*, events(*)")
      .eq("id", registrationId)
      .single()

    if (regError || !registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    // Generate PDF ticket using pdfkit to avoid jsPDF UTF-8 issues
    const { generateTicketPDF } = await import("@/lib/ticket-generator-pdfkit")
    
    const thumbnailUrl = registration.events.thumbnail_url || registration.events.thumbnail || "";
    const pdfBuffer = await generateTicketPDF({
      eventName: registration.events.title,
      eventDate: new Date(registration.events.event_date).toLocaleDateString(),
      eventTime: new Date(registration.events.event_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      venue: registration.events.location_name || registration.events.location || "Online / TBD",
      address: registration.events.location_name || registration.events.location || "Not specified",
      ticketType: registration.events.is_free ? "Free Pass" : "General Access",
      attendeeName: registration.attendee_name,
      barcode: registration.barcode,
      thumbnailUrl: thumbnailUrl
    })

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; background-color: #1a1a1a; color: #ffffff; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #ffffff; margin: 0;">Vibe2Gether</h1>
          <p style="color: #4ade80; margin: 5px 0 0 0;">✓ Verified</p>
        </div>
        
        <h2 style="text-align: center; font-size: 24px; margin-bottom: 20px;">
          Hi ${registration.attendee_name}, your ticket for<br/>
          <span style="color: #f97316;">${registration.events.title}</span><br/>
          is confirmed.
        </h2>

        ${thumbnailUrl ? `
          <div style="width: 100%; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
            <img src="${thumbnailUrl}" alt="Event Flyer" style="width: 100%; height: auto; display: block;" />
          </div>
        ` : ""}

        <div style="background: #222; padding: 15px; border-radius: 8px;">
          <p style="color: #888; font-size: 12px; margin: 0; text-transform: uppercase;">Order #${registration.barcode}</p>
          <h3 style="margin: 10px 0;">${registration.events.title}</h3>
          <p style="color: #888; font-size: 12px; margin-top: 15px;">Your official ticket PDF is attached to this email. Please present it at the venue.</p>
        </div>
      </div>
    `

    await sendTicketEmail({
      to: registration.attendee_email,
      subject: `Your Ticket for ${registration.events.title} - Vibe2Gether`,
      html: emailHtml,
      attachments: [
        {
          filename: `ticket-${registration.events.title.replace(/\s+/g, "-").toLowerCase()}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    })

    return NextResponse.json({ success: true, message: "Ticket sent successfully" })
  } catch (error) {
    console.error("[Generate Ticket] Error:", error)
    return NextResponse.json({ error: "Failed to generate ticket" }, { status: 500 })
  }
}