import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { generatePaystackReference, initializePayment } from "@/lib/paystack"
import { generateFlutterwaveReference, initializeFlutterwavePayment } from "@/lib/flutterwave"

const USD_TO_NGN = 1450
const USD_TO_XAF = 605

function normalizeCurrency(currency?: string) {
  return (currency || "NGN").toUpperCase()
}

function toUsd(amount: number, currency: string) {
  if (currency === "NGN") return amount / USD_TO_NGN
  if (currency === "XAF") return amount / USD_TO_XAF
  return amount
}

function fromUsd(amount: number, currency: string) {
  if (currency === "NGN") return Math.round(amount * USD_TO_NGN)
  if (currency === "XAF") return Math.round(amount * USD_TO_XAF)
  return Number(amount.toFixed(2))
}

function normalizeProviderAmount(amount: number, currency: string) {
  if (["XAF", "XOF", "NGN"].includes(currency)) return Math.max(1, Math.round(amount))
  return Math.max(0.01, Number(amount.toFixed(2)))
}

function getAppOrigin(request: NextRequest) {
  return (
    request.headers.get("origin") ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "")
}

function getFlutterwaveCallbackUrl(reference: string) {
  const baseUrl = (
    process.env.FLUTTERWAVE_REDIRECT_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    ""
  ).replace(/\/$/, "")

  if (!baseUrl || baseUrl.includes("localhost") || baseUrl.startsWith("http://")) {
    throw new Error("Method II requires a public HTTPS redirect URL. Set FLUTTERWAVE_REDIRECT_BASE_URL to your ngrok HTTPS URL or production URL.")
  }

  return `${baseUrl}/dashboard/subscriptions?reference=${reference}`
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { serviceId, paymentMethod = "paystack", mobileMoney } = await request.json()
    if (!serviceId) {
      return NextResponse.json({ error: "Service is required" }, { status: 400 })
    }

    const supabase = createServiceRoleClient()
    const { data: service, error } = await supabase
      .from("subscription_services")
      .select("*")
      .eq("id", serviceId)
      .single()

    if (error || !service) {
      return NextResponse.json({ error: "Subscription service not found" }, { status: 404 })
    }

    if (!service.is_active) {
      return NextResponse.json({ error: "This subscription is currently unavailable" }, { status: 400 })
    }

    const { data: activePurchase } = await supabase
      .from("user_subscription_purchases")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("service_id", service.id)
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString())
      .maybeSingle()

    if (activePurchase) {
      return NextResponse.json({ error: "You already have an active subscription for this service" }, { status: 409 })
    }

    const provider = paymentMethod === "flutterwave" ? "flutterwave" : "paystack"
    const serviceCurrency = normalizeCurrency(service.currency)
    const serviceAmount = Number(service.price)
    const paymentCurrency = provider === "flutterwave" ? normalizeCurrency(mobileMoney?.currency || serviceCurrency) : serviceCurrency
    const paymentAmount =
      provider === "flutterwave"
        ? normalizeProviderAmount(
            paymentCurrency !== serviceCurrency
              ? fromUsd(toUsd(serviceAmount, serviceCurrency), paymentCurrency)
              : serviceAmount,
            paymentCurrency
          )
        : serviceAmount

    if (provider === "paystack" && serviceCurrency !== "NGN") {
      return NextResponse.json({ error: "Payment method I only supports NGN subscriptions" }, { status: 400 })
    }
    if (provider === "flutterwave" && (!mobileMoney?.countryCode || !mobileMoney?.network || !mobileMoney?.phoneNumber)) {
      return NextResponse.json({ error: "Mobile money wallet details are required" }, { status: 400 })
    }

    const reference = provider === "flutterwave" ? generateFlutterwaveReference() : `sub-${generatePaystackReference()}`
    const { error: purchaseError } = await supabase.from("user_subscription_purchases").insert({
      user_id: session.user.id,
      service_id: service.id,
      amount: paymentAmount,
      currency: paymentCurrency,
      status: "pending",
      payment_status: "pending",
      paystack_reference: reference,
      metadata: {
        payment_provider: provider,
        original_amount: serviceAmount,
        original_currency: serviceCurrency,
        selected_payment_currency: paymentCurrency,
      },
    })

    if (purchaseError) throw purchaseError

    const callbackUrl =
      provider === "flutterwave"
        ? getFlutterwaveCallbackUrl(reference)
        : `${getAppOrigin(request)}/dashboard/subscriptions?reference=${reference}`
    const metadata = {
      type: "subscription_service",
      service_id: service.id,
      user_id: session.user.id,
      payment_provider: provider,
      original_amount: serviceAmount,
      original_currency: serviceCurrency,
      payment_amount: paymentAmount,
      payment_currency: paymentCurrency,
    }

    if (provider === "flutterwave") {
      const payment = await initializeFlutterwavePayment({
        email: session.user.email,
        amount: paymentAmount,
        currency: paymentCurrency,
        reference,
        redirect_url: callbackUrl,
        customerName: session.user.name || session.user.email,
        mobileMoney,
        metadata,
      })

      if (payment.status !== "success" || (!payment.data?.link && !payment.data?.instruction)) {
        return NextResponse.json({ error: "Flutterwave did not return payment instructions" }, { status: 502 })
      }

      await supabase
        .from("user_subscription_purchases")
        .update({
          paystack_transaction_id: payment.data.id,
          metadata: {
            ...metadata,
            flutterwave_charge_id: payment.data.id,
          },
        })
        .eq("paystack_reference", reference)
        .eq("user_id", session.user.id)

      return NextResponse.json({
        authorizationUrl: payment.data.link,
        reference,
        provider,
        instruction: payment.data.instruction,
      })
    }

    const payment = await initializePayment({
      email: session.user.email,
      amount: Math.round(Number(service.price) * 100),
      reference,
      callback_url: callbackUrl,
      metadata,
    })

    if (!payment.status || !payment.data?.authorization_url) {
      return NextResponse.json({ error: "Unable to initialize payment" }, { status: 502 })
    }

    return NextResponse.json({ authorizationUrl: payment.data.authorization_url, reference, provider })
  } catch (error) {
    console.error("Subscription checkout error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start checkout" },
      { status: 500 }
    )
  }
}
