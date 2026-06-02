import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { createServiceRoleClient } from "@/lib/supabase/server"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

function getAdminId(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value
  if (!token) return null
  try {
    return (jwt.verify(token, JWT_SECRET) as any).id || null
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const adminId = getAdminId(request)
  if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = createServiceRoleClient()
  const { data: services, error } = await supabase
    .from("subscription_services")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 })

  const { data: purchases, error: purchasesError } = await supabase
    .from("user_subscription_purchases")
    .select("*, service:subscription_services(*), user:users(id, full_name, email, profile_picture)")
    .order("created_at", { ascending: false })

  if (purchasesError) {
    return NextResponse.json({ error: "Failed to fetch subscription purchases" }, { status: 500 })
  }

  return NextResponse.json({ services, purchases: purchases || [] })
}

export async function POST(request: NextRequest) {
  const adminId = getAdminId(request)
  if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from("subscription_services")
    .insert({
      name: body.name,
      company: body.company,
      description: body.description,
      category: body.category || "General",
      price: body.price,
      currency: body.currency || "NGN",
      duration_value: body.duration_value || 1,
      duration_unit: body.duration_unit || "month",
      featured_services: body.featured_services || [],
      location_name: body.location_name || null,
      terms: body.terms || null,
      image_url: body.image_url || null,
      is_featured: !!body.is_featured,
      is_active: body.is_active !== false,
      created_by: adminId,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ service: data })
}
