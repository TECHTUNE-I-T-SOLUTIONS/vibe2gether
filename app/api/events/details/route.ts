import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

const USD_TO_NGN_RATE = 1450

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get("id")

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      )
    }

    const { data: event, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single()

    if (error || !event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      )
    }

    // Get organizer details
    const { data: organizer } = await supabase
      .from("users")
      .select("id, display_name, profile_picture")
      .eq("id", event.created_by)
      .single()

    // Determine the actual price in the stored currency
    let ticketPrice = event.ticket_price
    let currency = event.currency || "NGN"
    let ticketPriceUSD = null

    // Convert to USD if stored in NGN
    if (currency === "NGN" && ticketPrice) {
      ticketPriceUSD = ticketPrice / USD_TO_NGN_RATE
    } else if (currency === "USD") {
      ticketPriceUSD = ticketPrice
    }

    return NextResponse.json({
      success: true,
      event: {
        ...event,
        currency, // Currency stored in DB
        ticketPrice, // Price in original currency
        ticketPriceUSD, // Price in USD for display/conversion
        ticketPriceNGN: currency === "USD" ? ticketPrice * USD_TO_NGN_RATE : ticketPrice,
        isFree: event.is_free || !ticketPrice || ticketPrice === 0,
        organizer,
      },
    })
  } catch (error) {
    console.error("[EVENT] Error fetching event:", error)
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    )
  }
}
