import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { generateFlutterwaveReference, initializeFlutterwavePayment } from "@/lib/flutterwave"
import { createServiceRoleClient } from "@/lib/supabase/server"
import crypto from "crypto"

const USD_TO_NGN = 1450
const USD_TO_XAF = 585.48

function getRedirectUrl(reference: string, itemType?: string) {
  const baseUrl =
    process.env.FLUTTERWAVE_REDIRECT_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    ""

  if (!baseUrl || baseUrl.includes("localhost") || baseUrl.startsWith("http://")) {
    throw new Error("Method II requires a public HTTPS redirect URL. Set FLUTTERWAVE_REDIRECT_BASE_URL to your ngrok HTTPS URL or production URL.")
  }

  const path =
    itemType === "event"
      ? "/dashboard/events/manage"
      : itemType === "product"
        ? "/marketplace/payment-callback"
        : "/dashboard/wallet"

  return `${baseUrl.replace(/\/$/, "")}${path}?reference=${reference}`
}

function convertFromUsd(amountUsd: number, currency: string) {
  if (currency === "NGN") return Math.round(amountUsd * USD_TO_NGN)
  if (currency === "USD") return Number(amountUsd.toFixed(2))
  return Math.round(amountUsd * USD_TO_XAF)
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { amount, itemType, itemData, metadata, mobileMoney } = await request.json()
    if (!amount || !itemType) {
      return NextResponse.json({ error: "Missing payment details" }, { status: 400 })
    }
    if (!mobileMoney?.countryCode || !mobileMoney?.network || !mobileMoney?.phoneNumber) {
      return NextResponse.json({ error: "Mobile money wallet details are required" }, { status: 400 })
    }

    const amountNgn = Number(amount)
    const amountUsd = amountNgn / USD_TO_NGN
    const currency = String(mobileMoney.currency || "XAF").toUpperCase()
    const providerAmount = convertFromUsd(amountUsd, currency)
    const coinsAmount = itemType === "coins" ? Math.round(amountUsd * 500) : undefined
    const transactionType =
      itemType === "event"
        ? "event_registration"
        : itemType === "product"
          ? "marketplace_purchase"
          : "coin_purchase"
    const reference = generateFlutterwaveReference()
    const supabase = createServiceRoleClient()
    let registrationId: string | null = null
    let barcode: string | null = null

    if (itemType === "event") {
      const eventId = itemData?.id || metadata?.eventId
      if (!eventId) {
        return NextResponse.json({ error: "Event is required" }, { status: 400 })
      }

      const { data: event, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single()

      if (eventError || !event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 })
      }

      if (event.status !== "upcoming" || (event.event_date && new Date(event.event_date) < new Date())) {
        return NextResponse.json({ error: "Tickets are closed for this event" }, { status: 400 })
      }

      if (event.capacity && (event.registered_count || 0) >= event.capacity) {
        return NextResponse.json({ error: "This event is sold out" }, { status: 400 })
      }

      const { data: existingRegistration } = await supabase
        .from("event_registrations")
        .select("id, status, payment_status")
        .eq("event_id", eventId)
        .eq("user_id", session.user.id)
        .maybeSingle()

      if (
        existingRegistration &&
        (existingRegistration.status === "confirmed" ||
          existingRegistration.status === "paid" ||
          existingRegistration.payment_status === "completed" ||
          existingRegistration.payment_status === "paid")
      ) {
        return NextResponse.json({ error: "You already have a ticket for this event" }, { status: 409 })
      }

      barcode = `TKT-${crypto.randomBytes(8).toString("hex").toUpperCase()}`

      const { data: registration, error: registrationError } = await supabase
        .from("event_registrations")
        .upsert(
          {
            event_id: eventId,
            user_id: session.user.id,
            status: "registered",
            payment_status: "pending",
            payment_reference: reference,
            amount_paid: providerAmount,
            currency,
            payment_method: "flutterwave",
          },
          { onConflict: "event_id,user_id" }
        )
        .select("id")
        .single()

      if (registrationError) throw registrationError
      registrationId = registration?.id || null

      const platformFee = providerAmount * 0.03
      const { error: ticketError } = await supabase.from("event_tickets").insert({
        event_id: eventId,
        user_id: session.user.id,
        attendee_name: metadata?.attendeeName || session.user.name || session.user.email,
        attendee_email: metadata?.attendeeEmail || session.user.email,
        attendee_phone: metadata?.attendeePhone || null,
        attendee_address: metadata?.attendeeAddress || null,
        amount_paid: providerAmount,
        platform_fee: platformFee,
        payout_amount: providerAmount - platformFee,
        status: "pending",
        barcode,
        payment_reference: reference,
      })

      if (ticketError) throw ticketError
    }

    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id: session.user.id,
        type: transactionType,
        amount: providerAmount,
        currency,
        payment_method: "flutterwave",
        payment_reference: reference,
        status: "pending",
        metadata: {
          ...(metadata || {}),
          itemType,
          itemId: itemData?.id,
          itemTitle: itemData?.title || "Purchase",
          eventId: itemType === "event" ? itemData?.id : undefined,
          productId: itemType === "product" ? itemData?.id : undefined,
          coinsAmount,
          payment_provider: "flutterwave",
          original_amount_ngn: amountNgn,
          amountInNGN: amountNgn,
          amountInUSD: amountUsd,
          amountInProviderCurrency: providerAmount,
          providerCurrency: currency,
          registration_id: registrationId,
          barcode,
          isTicketPurchase: itemType === "event" ? true : metadata?.isTicketPurchase,
        },
      })
      .select()
      .single()

    if (txError) throw txError

    const payment = await initializeFlutterwavePayment({
      email: session.user.email,
      amount: providerAmount,
      currency,
      reference,
      redirect_url: getRedirectUrl(reference, itemType),
      customerName: session.user.name || session.user.email,
      mobileMoney,
      metadata: {
        type: transactionType,
        userId: session.user.id,
        transactionId: transaction.id,
        coinsAmount,
        currency,
      },
    })

    if (!payment.data?.link) {
      throw new Error("Unable to initialize Method II payment")
    }

    await supabase
      .from("transactions")
      .update({
        metadata: {
          ...(transaction.metadata || {}),
          flutterwave_charge_id: payment.data.id,
          coinsAmount,
          payment_provider: "flutterwave",
        },
      })
      .eq("id", transaction.id)

    return NextResponse.json({
      success: true,
      authorizationUrl: payment.data.link,
      reference,
      instruction: payment.data.instruction,
    })
  } catch (error) {
    console.error("[FLUTTERWAVE] Initialization error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to initialize Method II payment" },
      { status: 500 }
    )
  }
}
