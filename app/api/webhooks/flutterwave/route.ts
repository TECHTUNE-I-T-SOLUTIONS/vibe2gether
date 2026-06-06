import { NextRequest, NextResponse } from "next/server"
import { sendEmail } from "@/lib/email-service"
import { verifyFlutterwavePayment } from "@/lib/flutterwave"
import {
  buildAdminSubscriptionPurchaseEmail,
  buildSubscriptionReceiptEmail,
  buildSubscriptionReceiptPdf,
  type SubscriptionReceiptDetails,
} from "@/lib/subscription-receipt"
import { createServiceRoleClient } from "@/lib/supabase/server"

function addDuration(start: Date, duration: number, unit: string) {
  const end = new Date(start)
  if (unit === "day") end.setDate(end.getDate() + duration)
  else if (unit === "week") end.setDate(end.getDate() + duration * 7)
  else if (unit === "year") end.setFullYear(end.getFullYear() + duration)
  else end.setMonth(end.getMonth() + duration)
  return end
}

export async function POST(request: NextRequest) {
  try {
    const expectedHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH
    const receivedHash = request.headers.get("verif-hash")

    if (expectedHash && receivedHash !== expectedHash) {
      return NextResponse.json({ error: "Invalid webhook hash" }, { status: 401 })
    }

    const payload = await request.json()
    const reference = payload?.data?.tx_ref || payload?.tx_ref
    const status = payload?.data?.status || payload?.status

    if (!reference || status !== "successful") {
      return NextResponse.json({ received: true })
    }

    const verification = await verifyFlutterwavePayment(reference)
    if (verification.status !== "success" || verification.data?.status !== "successful") {
      return NextResponse.json({ received: true })
    }

    const supabase = createServiceRoleClient()
    const { data: purchase, error } = await supabase
      .from("user_subscription_purchases")
      .select("*, service:subscription_services(*), user:users(id, full_name, email)")
      .eq("paystack_reference", reference)
      .single()

    if (error || !purchase || purchase.payment_status === "paid") {
      return NextResponse.json({ received: true })
    }

    const startsAt = new Date()
    const expiresAt = addDuration(startsAt, purchase.service.duration_value, purchase.service.duration_unit)
    const receiptNumber = `V2G-SUB-${Date.now()}`

    const { data: updated, error: updateError } = await supabase
      .from("user_subscription_purchases")
      .update({
        status: "active",
        payment_status: "paid",
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        receipt_number: receiptNumber,
        paid_at: verification.data.created_at || startsAt.toISOString(),
        paystack_transaction_id: verification.data.id,
        metadata: {
          ...(purchase.metadata || {}),
          payment_provider: "flutterwave",
          payment_verified_at: startsAt.toISOString(),
          webhook_verified: true,
        },
      })
      .eq("id", purchase.id)
      .select("*, service:subscription_services(*)")
      .single()

    if (updateError) throw updateError

    const amount = `${purchase.currency || "NGN"} ${Number(purchase.amount || 0).toLocaleString()}`
    const userEmail = purchase.user?.email || verification.data.customer?.email
    if (!userEmail) return NextResponse.json({ received: true, purchase: updated })

    const receiptDetails: SubscriptionReceiptDetails = {
      receiptNumber,
      serviceName: purchase.service.name,
      amount,
      userEmail,
      customerName: purchase.user?.full_name || userEmail,
      company: purchase.service.company,
      location: purchase.service.location_name,
      reference,
      paidAt: startsAt.toLocaleString(),
      expiresAt: expiresAt.toLocaleString(),
    }
    const receiptPdf = buildSubscriptionReceiptPdf(receiptDetails)

    await Promise.allSettled([
      sendEmail({
        to: userEmail,
        subject: `Your ${purchase.service.name} subscription receipt`,
        html: buildSubscriptionReceiptEmail({
          ...receiptDetails,
          expiresAt: expiresAt.toLocaleDateString(),
        }),
        attachments: [{ filename: `${receiptNumber}.pdf`, content: receiptPdf, contentType: "application/pdf" }],
      }),
      supabase
        .from("admins")
        .select("email")
        .eq("is_active", true)
        .then(({ data }) =>
          Promise.allSettled(
            (data || [])
              .filter((admin) => admin.email)
              .map((admin) =>
                sendEmail({
                  to: admin.email,
                  subject: `New subscription purchase: ${purchase.service.name}`,
                  html: buildAdminSubscriptionPurchaseEmail({
                    ...receiptDetails,
                    expiresAt: expiresAt.toLocaleDateString(),
                  }),
                  attachments: [{ filename: `${receiptNumber}.pdf`, content: receiptPdf, contentType: "application/pdf" }],
                })
              )
          )
        ),
    ])

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Flutterwave webhook error:", error)
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 })
  }
}
