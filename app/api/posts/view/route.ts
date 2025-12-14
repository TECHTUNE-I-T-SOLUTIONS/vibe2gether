import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { awardCoins } from "@/lib/coins"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { postId } = await request.json()

    if (!postId) {
      return NextResponse.json({ error: "Post ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get viewer IP for anonymous tracking
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"

    // Check if already viewed recently (within 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: recentView } = await supabase
      .from("post_views")
      .select("id")
      .eq("post_id", postId)
      .eq(session?.user?.id ? "user_id" : "viewer_ip", session?.user?.id || ip)
      .gte("created_at", oneDayAgo)
      .single()

    if (recentView) {
      return NextResponse.json({ counted: false, message: "Already viewed" })
    }

    // Record view
    await supabase.from("post_views").insert({
      post_id: postId,
      user_id: session?.user?.id || null,
      viewer_ip: ip,
    })

    // Increment views count
    await supabase.rpc("increment_views", { post_id: postId })

    // Get post owner and award coins
    const { data: post } = await supabase.from("posts").select("user_id").eq("id", postId).single()

    if (post && post.user_id !== session?.user?.id) {
      await awardCoins(post.user_id, "view_received", postId, "post")
    }

    return NextResponse.json({ counted: true })
  } catch (error) {
    console.error("View error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
