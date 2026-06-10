import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { generateFlutterwaveReference, initializeFlutterwavePayment } from "@/lib/flutterwave"
import { createServiceRoleClient } from "@/lib/supabase/server"
import crypto from "crypto"

const USD_TO_NGN = 1450
const USD_TO_XAF = 605

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

function normalizeFlutterwaveAmount(amount: number, currency: string) {
  if (["XAF", "XOF", "NGN"].includes(currency)) return Math.max(1, Math.round(amount))
  return Math.max(0.01, Number(amount.toFixed(2)))
}

function getEventAmountNgn(event: any) {
  const priceNgn = Number(event?.ticket_price_ngn || event?.ticket_price_ngn_amount || 0)
  const priceUsd = Number(event?.ticket_price_usd || 0)
  const ticketPrice = Number(event?.ticket_price || 0)
  const currency = String(event?.currency || "USD").toUpperCase()

  if (priceNgn > 0) return Math.round(priceNgn)
  if (priceUsd > 0) return Math.round(priceUsd * USD_TO_NGN)
  if (currency === "NGN") {
    return ticketPrice >= 100 ? Math.round(ticketPrice) : Math.round(ticketPrice * USD_TO_NGN)
  }
  if (currency === "USD") return Math.round(ticketPrice * USD_TO_NGN)

  return Math.round(ticketPrice * USD_TO_NGN)
}

export async function POST(request: NextRequest) {
  let cleanupSupabase: ReturnType<typeof createServiceRoleClient> | null = null
  let cleanupTransactionId: string | null = null
  let cleanupRegistrationId: string | null = null
  let cleanupReference: string | null = null
  let cleanupIsTicketPurchase = false

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

    let amountNgn = Number(amount)
    const currency = String(mobileMoney.currency || "XAF").toUpperCase()
    let amountUsd = amountNgn / USD_TO_NGN
    let providerAmount = normalizeFlutterwaveAmount(convertFromUsd(amountUsd, currency), currency)
    const transactionType =
      itemType === "event"
        ? "event_registration"
        : itemType === "product"
          ? "marketplace_purchase"
          : "coin_purchase"
    const reference = generateFlutterwaveReference()
    const supabase = createServiceRoleClient()
    cleanupSupabase = supabase
    cleanupReference = reference
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

      console.log("[FLUTTERWAVE] Event price fields", {
        eventId,
        currency: event.currency,
        ticket_price: event.ticket_price,
        ticket_price_ngn: event.ticket_price_ngn,
        ticket_price_usd: event.ticket_price_usd,
      })

      amountNgn = getEventAmountNgn(event)
      amountUsd = amountNgn / USD_TO_NGN
      providerAmount = normalizeFlutterwaveAmount(convertFromUsd(amountUsd, currency), currency)

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
      cleanupRegistrationId = registrationId
      cleanupIsTicketPurchase = true

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

    const coinsAmount = itemType === "coins" ? Math.round(amountUsd * 500) : undefined

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
    cleanupTransactionId = transaction.id

    console.log("[FLUTTERWAVE] Initializing Method II payment", {
      reference,
      itemType,
      amountNgn,
      amountUsd,
      providerAmount,
      currency,
      countryCode: mobileMoney.countryCode,
      network: mobileMoney.network,
    })

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
          amountNgn,
          amountUsd,
          providerAmount,
        },
      })

    if (!payment.data?.link && !payment.data?.instruction && String(payment.data?.status || "").toLowerCase() === "failed") {
      throw new Error("Flutterwave rejected this mobile money payment")
    }

    if (!payment.data?.link && !payment.data?.instruction) {
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
    const message = error instanceof Error ? error.message : "Failed to initialize Method II payment"
    if (cleanupSupabase && cleanupTransactionId) {
      await cleanupSupabase
        .from("transactions")
        .update({
          status: "failed",
        })
        .eq("id", cleanupTransactionId)
    }

    if (cleanupSupabase && cleanupRegistrationId) {
      await cleanupSupabase
        .from("event_registrations")
        .update({ payment_status: "failed", status: "cancelled" })
        .eq("id", cleanupRegistrationId)
    }

    if (cleanupSupabase && cleanupIsTicketPurchase && cleanupReference) {
      await cleanupSupabase
        .from("event_tickets")
        .update({ status: "cancelled" })
        .eq("payment_reference", cleanupReference)
    }

    return NextResponse.json(
      { error: message },
      { status: message.includes("Invalid") || message.includes("confirm") || message.includes("wallet") ? 400 : 500 }
    )
  }
}
