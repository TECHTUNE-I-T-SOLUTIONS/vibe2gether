import { NextResponse } from "next/server"
import { reconcileExpiredPremiumSubscriptions } from "@/lib/premium-expiry"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const result = await reconcileExpiredPremiumSubscriptions()
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error("Premium expiry cron error:", error)
    return NextResponse.json({ success: false, error: "Failed to reconcile premium subscriptions" }, { status: 500 })
  }
}
