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

    // Increment shares count
    await supabase.rpc("increment_shares", { post_id: postId })

    // Get post owner and award coins
    const { data: post } = await supabase.from("posts").select("user_id").eq("id", postId).single()

    if (post && post.user_id !== session?.user?.id) {
      await awardCoins(post.user_id, "share_received", postId, "post")

      if (session?.user) {
        // Create notification
        await supabase.from("notifications").insert({
          user_id: post.user_id,
          type: "share",
          title: "Your post was shared",
          message: `${session.user.name} shared your post`,
          actor_id: session.user.id,
          reference_id: postId,
          reference_type: "post",
          action_url: `/post/${postId}`,
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Share error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
