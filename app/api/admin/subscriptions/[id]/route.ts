import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { createServiceRoleClient } from "@/lib/supabase/server"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

function isAdmin(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value
  if (!token) return false
  try {
    return Boolean((jwt.verify(token, JWT_SECRET) as any).id)
  } catch {
    return false
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await request.json()
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from("subscription_services")
    .update({
      name: body.name,
      company: body.company,
      description: body.description,
      category: body.category,
      price: body.price,
      currency: body.currency,
      duration_value: body.duration_value,
      duration_unit: body.duration_unit,
      featured_services: body.featured_services || [],
      location_name: body.location_name || null,
      terms: body.terms || null,
      image_url: body.image_url || null,
      is_featured: !!body.is_featured,
      is_active: !!body.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ service: data })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const supabase = createServiceRoleClient()

  const { error } = await supabase
    .from("subscription_services")
    .delete()
    .eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
