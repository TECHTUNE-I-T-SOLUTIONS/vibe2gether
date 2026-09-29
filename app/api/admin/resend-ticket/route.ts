import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendTicketEmail } from "@/lib/email-service"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

export async function POST(request: NextRequest) {
  try {
    const { transactionId } = await request.json()

    if (!transactionId) {
      return NextResponse.json({ error: "Transaction ID required" }, { status: 400 })
    }

    // 1. Fetch transaction
    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .single()

    if (txError || !transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    if (transaction.type !== "event_registration") {
      return NextResponse.json({ error: "Transaction is not an event registration" }, { status: 400 })
    }

    // 2. Fetch event registration directly - this is more reliable than looking for tickets
    let registration;
    
    // First try by payment_reference
    const { data: regByRef } = await supabase
      .from("event_registrations")
      .select("*, events(*)")
      .eq("payment_reference", transaction.payment_reference || transaction.id)
      .single()
    
    if (regByRef) {
      registration = regByRef
    } else if (transaction.metadata?.registration_id) {
      // Try by registration_id from metadata
      const { data: regById } = await supabase
        .from("event_registrations")
        .select("*, events(*)")
        .eq("id", transaction.metadata.registration_id)
        .single()
      
      if (regById) {
        registration = regById
      }
    } else if (transaction.metadata?.eventId && transaction.user_id) {
      // Try by event_id and user_id as fallback
      const { data: regByEvent } = await supabase
        .from("event_registrations")
        .select("*, events(*)")
        .eq("event_id", transaction.metadata.eventId)
        .eq("user_id", transaction.user_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()
      
      if (regByEvent) {
        registration = regByEvent
      }
    }

    if (!registration) {
        return NextResponse.json({ error: "No registration record found for this transaction" }, { status: 404 })
    }

    // Ensure registration is marked as completed
    if (registration.status !== "completed") {
      await supabase
        .from("event_registrations")
        .update({
          status: "completed",
          payment_status: "paid"
        })
        .eq("id", registration.id)
    }

    // 3. Generate and send ticket using new endpoint to avoid jsPDF issues
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/generate-ticket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        registrationId: registration.id,
        eventId: registration.event_id,
        userId: registration.user_id
      })
    })

    return NextResponse.json({ success: true, message: "E-Ticket sent successfully!" })
  } catch (error) {
    console.error("[Resend Ticket] Error:", error)
    return NextResponse.json({ error: "Failed to resend ticket" }, { status: 500 })
  }
}
