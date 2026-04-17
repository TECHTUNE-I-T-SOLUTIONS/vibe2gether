import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Define time ranges
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    // Fetch counts for different categories in parallel
    const [
      { count: allNew },
      { count: jobsNew },
      { count: fundingNew },
      { count: tipsNew }
    ] = await Promise.all([
      supabase.from("opportunities").select("*", { count: "exact", head: true }).gte("created_at", twentyFourHoursAgo).eq("status", "approved"),
      supabase.from("opportunities").select("*", { count: "exact", head: true }).eq("category", "Job Posting").gte("created_at", twentyFourHoursAgo).eq("status", "approved"),
      supabase.from("opportunities").select("*", { count: "exact", head: true }).eq("category", "Funding/Grants").gte("created_at", twentyFourHoursAgo).eq("status", "approved"),
      // For "Business Tips", we'll count new approved Learn resources
      supabase.from("learn_resources").select("*", { count: "exact", head: true }).gte("created_at", twentyFourHoursAgo).eq("status", "approved"),
    ])

    const stats = [
      { id: "opps", label: "Opportunities", count: allNew || 0, color: "bg-orange-500", icon: "Briefcase" },
      { id: "jobs", label: "Jobs", count: jobsNew || 0, color: "bg-blue-500", icon: "Users" },
      { id: "funding", label: "Funding", count: fundingNew || 0, color: "bg-green-600", icon: "CircleDollarSign" },
      { id: "tips", label: "Business Tips", count: tipsNew || 0, color: "bg-purple-600", icon: "Lightbulb" },
    ]

    return NextResponse.json({ success: true, stats })
  } catch (error) {
    console.error("Fetch opportunity stats error:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
