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
      console.error("[Generate Ticket] Missing required fields:", { registrationId, eventId })
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Fetch registration with event details
    const { data: registration, error: regError } = await supabase
      .from("event_registrations")
      .select("*, events(*)")
      .eq("id", registrationId)
      .single()

    if (regError || !registration) {
      console.error("[Generate Ticket] Registration not found:", regError)
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    // Generate barcode if missing
    let barcode = registration.barcode
    if (!barcode) {
      barcode = `V2G-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      console.log("[Generate Ticket] Generated new barcode for registration:", registrationId, barcode)

      // Update the registration with the barcode and wait for it to complete
      const { error: updateError } = await supabase
        .from("event_registrations")
        .update({ barcode: barcode })
        .eq("id", registrationId)

      if (updateError) {
        console.error("[Generate Ticket] Failed to update registration with barcode:", updateError)
      } else {
        console.log("[Generate Ticket] Successfully updated registration with barcode:", registrationId)
      }
    }

    // Fetch attendee email if missing
    let attendeeEmail = registration.attendee_email
    let attendeeName = registration.attendee_name

    if (!attendeeEmail && registration.user_id) {
      const { data: userData } = await supabase
        .from("users")
        .select("email, full_name, display_name")
        .eq("id", registration.user_id)
        .single()

      if (userData?.email) {
        attendeeEmail = userData.email
        attendeeName = userData.full_name || userData.display_name || attendeeName

        // Update the registration with the email and name
        await supabase
          .from("event_registrations")
          .update({
            attendee_email: attendeeEmail,
            attendee_name: attendeeName
          })
          .eq("id", registrationId)
        console.log("[Generate Ticket] Updated registration with attendee email and name:", registrationId)
      }
    }

    if (!registration.events) {
      console.error("[Generate Ticket] Registration missing event data:", registrationId)
      return NextResponse.json({ error: "Event data not found" }, { status: 404 })
    }

    // Validate that we have an email (either from registration or fetched from users)
    if (!attendeeEmail) {
      console.error("[Generate Ticket] Could not find attendee email for registration:", registrationId)
      return NextResponse.json({ error: "Attendee email not found" }, { status: 400 })
    }

    // Generate PDF ticket using pdfkit to avoid jsPDF UTF-8 issues
    const { generateTicketPDF } = await import("@/lib/ticket-generator-pdfkit")

    const thumbnailUrl = registration.events.thumbnail_url || registration.events.thumbnail || "";
    console.log("[Generate Ticket] Generating PDF for registration:", registrationId, "barcode:", barcode)

    const pdfBuffer = await generateTicketPDF({
      eventName: registration.events.title || "Event",
      eventDate: registration.events.event_date ? new Date(registration.events.event_date).toLocaleDateString() : "TBD",
      eventTime: registration.events.event_date ? new Date(registration.events.event_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "TBD",
      venue: registration.events.location_name || registration.events.location || "Online / TBD",
      address: registration.events.location_name || registration.events.location || "Not specified",
      ticketType: registration.events.is_free ? "Free Pass" : "General Access",
      attendeeName: attendeeName || "Attendee",
      barcode: barcode,
      thumbnailUrl: thumbnailUrl
    })

    console.log("[Generate Ticket] PDF generated successfully for registration:", registrationId)

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; background-color: #1a1a1a; color: #ffffff; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #ffffff; margin: 0;">Vibe2Gether</h1>
          <p style="color: #4ade80; margin: 5px 0 0 0;">✓ Verified</p>
        </div>
        
        <h2 style="text-align: center; font-size: 24px; margin-bottom: 20px;">
          Hi ${attendeeName || "User"}, your ticket for<br/>
          <span style="color: #f97316;">${registration.events.title}</span><br/>
          is confirmed.
        </h2>

        ${thumbnailUrl ? `
          <div style="width: 100%; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
            <img src="${thumbnailUrl}" alt="Event Flyer" style="width: 100%; height: auto; display: block;" />
          </div>
        ` : ""}

        <div style="background: #222; padding: 15px; border-radius: 8px;">
          <p style="color: #888; font-size: 12px; margin: 0; text-transform: uppercase;">Order #${barcode}</p>
          <h3 style="margin: 10px 0;">${registration.events.title}</h3>
          <p style="color: #888; font-size: 12px; margin-top: 15px;">Your official ticket PDF is attached to this email. Please present it at the venue.</p>
        </div>
      </div>
    `

    await sendTicketEmail({
      to: attendeeEmail,
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