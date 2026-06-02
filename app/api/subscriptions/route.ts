import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createServiceRoleClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const supabase = createServiceRoleClient()

    const { data: services, error: servicesError } = await supabase
      .from("subscription_services")
      .select("*")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })

    if (servicesError) throw servicesError

    let purchases: any[] = []
    if (session?.user?.id) {
      const { data, error } = await supabase
        .from("user_subscription_purchases")
        .select("*, service:subscription_services(*)")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      purchases = data || []
    }

    return NextResponse.json({ services: services || [], purchases })
  } catch (error) {
    console.error("Fetch subscriptions error:", error)
    return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 })
  }
}
