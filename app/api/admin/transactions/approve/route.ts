import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { createClient } from "@supabase/supabase-js"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("admin_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string }

    if (!decoded.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Fetch admin data from database
    const { data: admin, error } = await supabase
      .from("admins")
      .select("id, email, full_name, role, is_active")
      .eq("id", decoded.id)
      .single()

    if (error || !admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 })
    }

    if (!admin.is_active) {
      return NextResponse.json({ error: "Admin account is disabled" }, { status: 403 })
    }

    const { transactionId, status } = await request.json()

    if (!transactionId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
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

    // 2. Update transaction status
    const { error: updateError } = await supabase
      .from("transactions")
      .update({ status: status, updated_at: new Date().toISOString() })
      .eq("id", transactionId)

    if (updateError) {
      throw updateError
    }

    // 3. Handle specific logic based on transaction type
    if (transaction.type === "event_registration") {
      let registration = null;
      
      // Try multiple ways to find the registration
      // 1. By payment_reference
      const { data: regByRef } = await supabase
        .from("event_registrations")
        .select("*, events(*)")
        .eq("payment_reference", transactionId)
        .single()
      
      if (regByRef) {
        registration = regByRef;
      } 
      // 2. By registration_id in metadata
      else if (transaction.metadata?.registration_id) {
        const { data: regById } = await supabase
          .from("event_registrations")
          .select("*, events(*)")
          .eq("id", transaction.metadata.registration_id)
          .single()
        
        if (regById) {
          registration = regById;
        }
      }
      // 3. By event_id and user_id as fallback
      else if (transaction.metadata?.eventId && transaction.user_id) {
        const { data: regByEvent } = await supabase
          .from("event_registrations")
          .select("*, events(*)")
          .eq("event_id", transaction.metadata.eventId)
          .eq("user_id", transaction.user_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()
        
        if (regByEvent) {
          registration = regByEvent;
        }
      }
      
      if (registration) {
        if (status === "completed") {
          // Update registration status to completed
          const { error: regUpdateError } = await supabase
            .from("event_registrations")
            .update({
              status: "completed",
              payment_status: "paid",
            })
            .eq("id", registration.id)

          if (regUpdateError) {
            console.error("[Approve] Failed to update registration to completed:", regUpdateError)
          } else {
            console.log("[Approve] Successfully updated registration to completed:", registration.id)
          }

          // Auto-send ticket using new endpoint to avoid jsPDF issues
          try {
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/generate-ticket`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                registrationId: registration.id,
                eventId: registration.event_id,
                userId: registration.user_id
              })
            })
          } catch (emailError) {
            console.error("Failed to send ticket email on approve:", emailError)
            // don't throw, we still successfully approved it
          }
        } else if (status === "failed") {
          // Update registration status to cancelled so user can retry
          const { error: regUpdateError } = await supabase
            .from("event_registrations")
            .update({
              status: "cancelled",
              payment_status: "failed",
            })
            .eq("id", registration.id)

          if (regUpdateError) {
            console.error("[Approve] Failed to update registration to failed:", regUpdateError)
          } else {
            console.log("[Approve] Successfully updated registration to failed:", registration.id)
          }
        }
      } else {
        console.warn("No registration found for transaction:", transactionId)
      }
    }
    // Note: we can add handlers for coin_purchase and premium_subscription here in the future.

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[POST /api/admin/transactions/approve] Error:", error)
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 })
  }
}
