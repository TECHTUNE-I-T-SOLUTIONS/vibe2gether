import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sendEmail } from "@/lib/email-service"
import { verifyPayment } from "@/lib/paystack"
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
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { reference } = await request.json()
    if (!reference) return NextResponse.json({ error: "Reference is required" }, { status: 400 })

    const supabase = createServiceRoleClient()
    const { data: purchase, error } = await supabase
      .from("user_subscription_purchases")
      .select("*, service:subscription_services(*)")
      .eq("paystack_reference", reference)
      .eq("user_id", session.user.id)
      .single()

    if (error || !purchase) return NextResponse.json({ error: "Purchase not found" }, { status: 404 })
    if (purchase.payment_status === "paid") {
      return NextResponse.json({ success: true, purchase, receiptEmailSent: false })
    }

    const provider = purchase.metadata?.payment_provider === "flutterwave" ? "flutterwave" : "paystack"
    const verification =
      provider === "flutterwave"
        ? await verifyFlutterwavePayment(reference)
        : await verifyPayment(reference)
    const verified =
      provider === "flutterwave"
        ? verification.status === "success" && verification.data?.status === "successful"
        : verification.status && verification.data?.status === "success"

    if (!verified) {
      return NextResponse.json({ error: "Payment not confirmed" }, { status: 400 })
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
        paid_at:
          provider === "flutterwave"
            ? verification.data?.created_at || startsAt.toISOString()
            : verification.data?.paid_at || startsAt.toISOString(),
        paystack_transaction_id: verification.data?.id,
        metadata: {
          ...(purchase.metadata || {}),
          payment_provider: provider,
          payment_verified_at: startsAt.toISOString(),
        },
      })
      .eq("id", purchase.id)
      .select("*, service:subscription_services(*)")
      .single()

    if (updateError) throw updateError

    const amount = `${purchase.currency || "NGN"} ${Number(purchase.amount).toLocaleString()}`
    const receiptDetails: SubscriptionReceiptDetails = {
      receiptNumber,
      serviceName: purchase.service.name,
      amount,
      userEmail: session.user.email,
      customerName: session.user.name || session.user.email,
      company: purchase.service.company,
      location: purchase.service.location_name,
      reference,
      paidAt: startsAt.toLocaleString(),
      expiresAt: expiresAt.toLocaleString(),
    }
    const receiptPdf = buildSubscriptionReceiptPdf(receiptDetails)

    let receiptEmailSent = false
    try {
      await sendEmail({
        to: session.user.email,
        subject: `Your ${purchase.service.name} subscription receipt`,
        html: buildSubscriptionReceiptEmail({
          ...receiptDetails,
          expiresAt: expiresAt.toLocaleDateString(),
        }),
        attachments: [
          {
            filename: `${receiptNumber}.pdf`,
            content: receiptPdf,
            contentType: "application/pdf",
          },
        ],
      })
      receiptEmailSent = true
    } catch (emailError) {
      console.error("Subscription receipt email failed:", emailError)
    }

    try {
      const { data: admins, error: adminsError } = await supabase
        .from("admins")
        .select("email")
        .eq("is_active", true)

      if (adminsError) throw adminsError

      await Promise.allSettled(
        (admins || [])
          .filter((admin) => admin.email)
          .map((admin) =>
            sendEmail({
              to: admin.email,
              subject: `New subscription purchase: ${purchase.service.name}`,
              html: buildAdminSubscriptionPurchaseEmail({
                ...receiptDetails,
                expiresAt: expiresAt.toLocaleDateString(),
              }),
              attachments: [
                {
                  filename: `${receiptNumber}.pdf`,
                  content: receiptPdf,
                  contentType: "application/pdf",
                },
              ],
            })
          )
      )
    } catch (adminEmailError) {
      console.error("Admin subscription purchase email failed:", adminEmailError)
    }

    return NextResponse.json({ success: true, purchase: updated, receiptEmailSent })
  } catch (error) {
    console.error("Verify subscription payment error:", error)
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 })
  }
}
