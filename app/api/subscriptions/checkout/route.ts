import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { generatePaystackReference, initializePayment } from "@/lib/paystack"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { serviceId } = await request.json()
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

    const reference = `sub-${generatePaystackReference()}`
    const { error: purchaseError } = await supabase.from("user_subscription_purchases").insert({
      user_id: session.user.id,
      service_id: service.id,
      amount: service.price,
      currency: service.currency || "NGN",
      status: "pending",
      payment_status: "pending",
      paystack_reference: reference,
    })

    if (purchaseError) throw purchaseError

    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const payment = await initializePayment({
      email: session.user.email,
      amount: Math.round(Number(service.price) * 100),
      reference,
      callback_url: `${origin}/dashboard/subscriptions?reference=${reference}`,
      metadata: {
        type: "subscription_service",
        service_id: service.id,
        user_id: session.user.id,
      },
    })

    if (!payment.status || !payment.data?.authorization_url) {
      return NextResponse.json({ error: "Unable to initialize payment" }, { status: 502 })
    }

    return NextResponse.json({ authorizationUrl: payment.data.authorization_url, reference })
  } catch (error) {
    console.error("Subscription checkout error:", error)
    return NextResponse.json({ error: "Failed to start checkout" }, { status: 500 })
  }
}
