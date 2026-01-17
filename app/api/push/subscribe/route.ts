import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

/**
 * POST /api/push/subscribe
 * Subscribe a user to push notifications
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { subscription } = await request.json()

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: "Invalid subscription data" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get user ID from email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Check if subscription already exists
    const { data: existing } = await supabase
      .from("push_subscriptions")
      .select("id")
      .eq("endpoint", subscription.endpoint)
      .single()

    if (existing) {
      // Update existing subscription
      const { error } = await supabase
        .from("push_subscriptions")
        .update({
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)

      if (error) {
        console.error("Error updating subscription:", error)
        return NextResponse.json(
          { error: "Failed to update subscription" },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, isNew: false })
    }

    // Insert new subscription
    const { error } = await supabase.from("push_subscriptions").insert({
      user_id: userData.id,
      endpoint: subscription.endpoint,
      auth_key: subscription.keys?.auth || "",
      p256dh_key: subscription.keys?.p256dh || "",
      is_active: true,
    })

    if (error) {
      console.error("Error creating subscription:", error)
      return NextResponse.json(
        { error: "Failed to create subscription" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, isNew: true })
  } catch (error: any) {
    console.error("Error handling push subscription:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/push/subscribe
 * Unsubscribe from push notifications
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    let endpoint: string | null = null;
    
    try {
      const body = await request.json();
      endpoint = body.endpoint;
    } catch (e) {
      // If body parsing fails, try to get endpoint from query params
      endpoint = request.nextUrl.searchParams.get('endpoint');
    }

    if (!endpoint) {
      return NextResponse.json(
        { error: "Invalid subscription data" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // First get the user ID from email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const { error } = await supabase
      .from("push_subscriptions")
      .update({ is_active: false })
      .eq("endpoint", endpoint)
      .eq("user_id", userData.id)

    if (error) {
      console.error("Error unsubscribing:", error)
      return NextResponse.json(
        { error: "Failed to unsubscribe" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error handling push unsubscribe:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
