import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { initializePayment, generatePaystackReference } from "@/lib/paystack"
import { generateFlutterwaveReference, initializeFlutterwavePayment } from "@/lib/flutterwave"

// Plan configurations with USD pricing
const PLAN_CONFIG: Record<string, { priceUSD: number; durationMonths: number }> = {
  Monthly: { priceUSD: 9.99, durationMonths: 1 },
  "6 Months": { priceUSD: 49.99, durationMonths: 6 },
  Yearly: { priceUSD: 79.99, durationMonths: 12 },
}

// Conversion rate: 1 USD = 1450 NGN
const USD_TO_NGN = 1450

function normalizeProviderAmount(amount: number, currency: string) {
  if (["XAF", "XOF", "NGN"].includes(currency)) return Math.max(1, Math.round(amount))
  return Math.max(0.01, Number(amount.toFixed(2)))
}

function getFlutterwaveRedirectUrl(reference: string) {
  const baseUrl =
    process.env.FLUTTERWAVE_REDIRECT_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    ""

  if (!baseUrl || baseUrl.includes("localhost") || baseUrl.startsWith("http://")) {
    throw new Error("Flutterwave Method II requires a public HTTPS redirect URL. Set FLUTTERWAVE_REDIRECT_BASE_URL to your ngrok HTTPS URL or production URL.")
  }

  return `${baseUrl.replace(/\/$/, "")}/dashboard/premium?reference=${reference}`
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      console.log("[POST /api/premium/subscribe] User not authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { tierName, amountNGNInKobo, currency, paymentMethod = "paystack", mobileMoney } = await request.json()
    const provider = paymentMethod === "flutterwave" ? "flutterwave" : "paystack"

    if (!tierName) {
      console.error("[POST /api/premium/subscribe] Tier name required")
      return NextResponse.json({ error: "Tier name required" }, { status: 400 })
    }

    const planConfig = PLAN_CONFIG[tierName]
    if (!planConfig) {
      console.error("[POST /api/premium/subscribe] Invalid plan name:", tierName)
      return NextResponse.json({ error: "Invalid plan name" }, { status: 400 })
    }

    const supabase = await createClient()
    const userId = session.user.id

    console.log(
      `[POST /api/premium/subscribe] User ${userId} subscribing to ${tierName}, provider: ${provider}, Amount: ${amountNGNInKobo} kobo`
    )

    // Check if already has active subscription
    const { data: activeSubscription } = await supabase
      .from("premium_subscriptions")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle()

    if (activeSubscription) {
      console.log("[POST /api/premium/subscribe] User already has active subscription, allowing switch")
    }

    // Get user email and profile info
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("email, display_name")
      .eq("id", userId)
      .single()

    if (userError || !user?.email) {
      console.error("[POST /api/premium/subscribe] Error fetching user email:", userError)
      throw new Error("User email not found")
    }

    // Calculate expiry date based on plan duration
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + planConfig.durationMonths)

    // Convert priceUSD to numeric amount for storage
    const amountNumeric = parseFloat(planConfig.priceUSD.toFixed(2))

    // Create/Update premium subscription (pending payment)
    let subscription

    if (activeSubscription) {
      // Update existing subscription
      const { data: updated, error: updateError } = await supabase
        .from("premium_subscriptions")
        .update({
          plan: tierName,
          amount: amountNumeric,
          status: "pending",
          expires_at: expiresAt.toISOString(),
          payment_method: provider,
          updated_at: new Date().toISOString(),
        })
        .eq("id", activeSubscription.id)
        .select()
        .single()

      if (updateError) {
        console.error("[POST /api/premium/subscribe] Error updating subscription:", updateError)
        throw updateError
      }
      subscription = updated
    } else {
      // Create new subscription
      const { data: created, error: createError } = await supabase
        .from("premium_subscriptions")
        .insert({
          user_id: userId,
          plan: tierName,
          amount: amountNumeric,
          status: "pending",
          expires_at: expiresAt.toISOString(),
          payment_method: provider,
        })
        .select()
        .single()

      if (createError) {
        console.error("[POST /api/premium/subscribe] Error creating subscription:", createError)
        throw createError
      }
      subscription = created
    }

    if (provider === "flutterwave" && (!mobileMoney?.countryCode || !mobileMoney?.network || !mobileMoney?.phoneNumber)) {
      return NextResponse.json({ error: "Mobile money wallet details are required" }, { status: 400 })
    }

    const reference = provider === "flutterwave" ? generateFlutterwaveReference() : generatePaystackReference()

    const transactionData = {
      user_id: userId,
      amount: amountNGNInKobo,
      currency: provider === "flutterwave" ? (mobileMoney?.currency || "XAF").toUpperCase() : currency || "US",
      type: "premium_subscription",
      status: "pending",
      payment_method: provider,
      payment_reference: reference, // Explicitly save reference
      metadata: {
        planName: tierName,
        priceUSD: planConfig.priceUSD,
        currency: provider === "flutterwave" ? (mobileMoney?.currency || "XAF").toUpperCase() : currency || "US",
        subscriptionId: subscription.id,
        payment_provider: provider,
        reference, // Also in metadata for redundancy
      },
    }

    console.log("[POST /api/premium/subscribe] Inserting transaction with reference:", reference, "and payment_reference:", transactionData.payment_reference)

    const { data: transaction, error: transError } = await supabase
      .from("transactions")
      .insert([transactionData])
      .select()
      .single()

    if (transError) {
      console.error("[POST /api/premium/subscribe] Error creating transaction:", transError)
      throw transError
    }

    console.log("[POST /api/premium/subscribe] Transaction created:", transaction.id, "with payment_reference:", transaction.payment_reference)

    if (provider === "flutterwave") {
      const flutterwaveCurrency = (mobileMoney?.currency || "XAF").toUpperCase()
      const currencyRates: Record<string, number> = {
        XAF: 605,
        NGN: USD_TO_NGN,
        USD: 1,
      }
      const flutterwaveAmount = normalizeProviderAmount(
        planConfig.priceUSD * (currencyRates[flutterwaveCurrency] || currencyRates.XAF),
        flutterwaveCurrency
      )
      const payment = await initializeFlutterwavePayment({
        email: user.email,
        amount: flutterwaveAmount,
        currency: flutterwaveCurrency,
        reference,
        redirect_url: getFlutterwaveRedirectUrl(reference),
        customerName: user.display_name || session.user.name || user.email,
        mobileMoney,
        metadata: {
          userId,
          planName: tierName,
          priceUSD: planConfig.priceUSD,
          currency: flutterwaveCurrency,
          subscriptionId: subscription.id,
          transactionId: transaction.id,
          type: "premium_subscription",
          payment_provider: provider,
        },
      })

      if (payment.status !== "success" || (!payment.data?.link && !payment.data?.instruction)) {
        throw new Error("Failed to initialize Flutterwave payment")
      }

      await supabase
        .from("transactions")
        .update({
          metadata: {
            ...(transaction.metadata || {}),
            flutterwave_charge_id: payment.data.id,
          },
        })
        .eq("id", transaction.id)

      return NextResponse.json({
        success: true,
        authorization_url: payment.data.link,
        reference,
        subscriptionId: subscription.id,
        transactionId: transaction.id,
        provider,
        instruction: payment.data.instruction,
      })
    }

    const paystackResponse = await initializePayment({
      email: user.email,
      amount: amountNGNInKobo,
      reference,
      metadata: {
        userId,
        planName: tierName,
        priceUSD: planConfig.priceUSD,
        currency: currency || "US",
        subscriptionId: subscription.id,
        transactionId: transaction.id,
        type: "premium_subscription",
      },
      callback_url: `${process.env.APP_BASE_URL}/dashboard/premium?reference=${reference}`,
    })

    if (!paystackResponse.status || !paystackResponse.data) {
      throw new Error("Failed to initialize Paystack payment")
    }

    console.log(
      `[POST /api/premium/subscribe] Payment initialized for plan ${tierName}, reference: ${reference}, amount: ${amountNGNInKobo} kobo`
    )

    return NextResponse.json({
      success: true,
      authorization_url: paystackResponse.data.authorization_url,
      access_code: paystackResponse.data.access_code,
      reference: paystackResponse.data.reference,
      subscriptionId: subscription.id,
      transactionId: transaction.id,
    })
  } catch (error) {
    console.error("[POST /api/premium/subscribe] Unexpected error:", error)
    const errorMsg = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json(
      { error: errorMsg, success: false },
      { status: 500 }
    )
  }
}
