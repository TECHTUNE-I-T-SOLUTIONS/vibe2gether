import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sendEmail } from "@/lib/email-service"
import {
  buildSubscriptionReceiptEmail,
  buildSubscriptionReceiptPdf,
  type SubscriptionReceiptDetails,
} from "@/lib/subscription-receipt"
import { createServiceRoleClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { purchaseId } = await request.json()
    if (!purchaseId) {
      return NextResponse.json({ error: "Purchase is required" }, { status: 400 })
    }

    const supabase = createServiceRoleClient()
    const { data: purchase, error } = await supabase
      .from("user_subscription_purchases")
      .select("*, service:subscription_services(*)")
      .eq("id", purchaseId)
      .eq("user_id", session.user.id)
      .single()

    if (error || !purchase) {
      return NextResponse.json({ error: "Subscription purchase not found" }, { status: 404 })
    }

    if (purchase.payment_status !== "paid" || !purchase.receipt_number) {
      return NextResponse.json({ error: "Receipt is not available for this subscription yet" }, { status: 400 })
    }

    const paidAt = purchase.paid_at ? new Date(purchase.paid_at) : new Date(purchase.created_at)
    const expiresAt = purchase.expires_at ? new Date(purchase.expires_at) : null
    const amount = `${purchase.currency || "NGN"} ${Number(purchase.amount || 0).toLocaleString()}`
    const serviceName = purchase.service?.name || "Subscription"
    const expiresAtLabel = expiresAt ? expiresAt.toLocaleDateString() : "Not set"

    const receiptDetails: SubscriptionReceiptDetails = {
      receiptNumber: purchase.receipt_number,
      serviceName,
      amount,
      userEmail: session.user.email,
      customerName: session.user.name || session.user.email,
      company: purchase.service?.company,
      location: purchase.service?.location_name,
      reference: purchase.paystack_reference,
      paidAt: paidAt.toLocaleString(),
      expiresAt: expiresAt ? expiresAt.toLocaleString() : "Not set",
    }
    const receiptPdf = buildSubscriptionReceiptPdf(receiptDetails)

    await sendEmail({
      to: session.user.email,
      subject: `Your ${serviceName} subscription receipt`,
      html: buildSubscriptionReceiptEmail({ ...receiptDetails, expiresAt: expiresAtLabel }),
      attachments: [
        {
          filename: `${purchase.receipt_number}.pdf`,
          content: receiptPdf,
          contentType: "application/pdf",
        },
      ],
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Resend subscription receipt error:", error)
    return NextResponse.json({ error: "Failed to resend receipt" }, { status: 500 })
  }
}
