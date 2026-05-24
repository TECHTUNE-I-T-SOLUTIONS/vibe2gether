import jwt from "jsonwebtoken"
import { createServiceRoleClient } from "@/lib/supabase/server"

export type MobileAuthUser = {
  id: string
  email: string
  full_name?: string | null
  display_name?: string | null
  profile_picture?: string | null
  coins_balance?: number | null
}

export async function requireMobileUser(request: Request) {
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization") || ""
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : ""

  if (!token) {
    throw new Error("Unauthorized")
  }

  const secret = process.env.NEXTAUTH_SECRET || process.env.SECRET || "dev-secret"
  const payload = jwt.verify(token, secret) as { id?: string; email?: string }

  if (!payload?.id && !payload?.email) {
    throw new Error("Unauthorized")
  }

  const supabase = createServiceRoleClient()

  const query = payload.id
    ? supabase.from("users").select("id, email, full_name, display_name, profile_picture, coins_balance").eq("id", payload.id).single()
    : supabase.from("users").select("id, email, full_name, display_name, profile_picture, coins_balance").eq("email", payload.email).single()

  const { data: user, error } = await query

  if (error || !user) {
    throw new Error("User not found")
  }

  return { supabase, user: user as MobileAuthUser }
}
