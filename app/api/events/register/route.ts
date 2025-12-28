import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { initializePayment, generatePaystackReference } from "@/lib/paystack"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      console.log("[POST /api/events/register] User not authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { eventId } = await request.json()

    if (!eventId) {
      console.error("[POST /api/events/register] Event ID required")
      return NextResponse.json({ error: "Event ID required" }, { status: 400 })
    }

    const supabase = await createClient()
    const userId = session.user.id

    console.log(`[POST /api/events/register] User ${userId} registering for event ${eventId}`)

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single()

    if (eventError || !event) {
      console.error("[POST /api/events/register] Event not found")
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if user already registered
    const { data: existing } = await supabase
      .from("event_registrations")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .single()

    if (existing) {
      console.log("[POST /api/events/register] User already registered")
      return NextResponse.json({ error: "Already registered" }, { status: 409 })
    }

    // Create registration
    const { data: registration, error: regError } = await supabase
      .from("event_registrations")
      .insert({
        event_id: eventId,
        user_id: userId,
        status: "registered",
      })
      .select()
      .single()

    if (regError) {
      console.error("[POST /api/events/register] Error creating registration:", regError)
      throw regError
    }

    // If free event, no payment needed
    if (!event.ticket_price || event.ticket_price === 0) {
      console.log(`[POST /api/events/register] Free event registered successfully`)

      // Send notifications
      await supabase.from("notifications").insert([
        {
          user_id: userId,
          type: "event_registered",
          title: "Event Registered",
          message: `You're registered for ${event.title}`,
          actor_id: event.created_by,
          reference_id: eventId,
          reference_type: "event",
          action_url: `/events/${eventId}`,
        },
        {
          user_id: event.created_by,
          type: "event_registration",
          title: "New Registration",
          message: `Someone registered for your event`,
          actor_id: userId,
          reference_id: eventId,
          reference_type: "event",
          action_url: `/events/${eventId}`,
        },
      ])

      return NextResponse.json({
        success: true,
        registration: {
          id: registration.id,
          eventId: registration.event_id,
          status: registration.status,
        },
        message: "Registered for event successfully",
      })
    }

    // Handle paid event with Paystack
    const reference = generatePaystackReference()

    // Get user email
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("email, display_name")
      .eq("id", userId)
      .single()

    if (userError || !user?.email) {
      console.error("[POST /api/events/register] Error fetching user email:", userError)
      throw new Error("User email not found")
    }

    // Create transaction
    const { data: transaction, error: transError } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        amount: Math.round(event.ticket_price * 100),
        type: "event_registration",
        status: "pending",
        payment_method: "paystack",
        metadata: {
          eventId,
          eventTitle: event.title,
          eventCreatorId: event.created_by,
          registrationId: registration.id,
          reference,
        },
      })
      .select()
      .single()

    if (transError) {
      console.error("[POST /api/events/register] Error creating transaction:", transError)
      throw transError
    }

    // Initialize Paystack payment
    const paystackResponse = await initializePayment({
      email: user.email,
      amount: Math.round(event.ticket_price * 100),
      reference,
      metadata: {
        eventId,
        userId,
        registrationId: registration.id,
        transactionId: transaction.id,
        type: "event_registration",
      },
      callback_url: `${process.env.APP_BASE_URL}/events/payment-success`,
    })

    if (!paystackResponse.status || !paystackResponse.data) {
      throw new Error("Failed to initialize Paystack payment")
    }

    console.log(
      `[POST /api/events/register] Payment initialized for event ${eventId}, reference: ${reference}`
    )

    return NextResponse.json({
      success: true,
      authorization_url: paystackResponse.data.authorization_url,
      access_code: paystackResponse.data.access_code,
      reference: paystackResponse.data.reference,
      transactionId: transaction.id,
      registrationId: registration.id,
    })
  } catch (error) {
    console.error("[POST /api/events/register] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
