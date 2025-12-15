import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get user
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, created_at, last_login_at")
      .eq("email", session.user.email)
      .single()

    if (userError || !user) {
      return Response.json({ error: "User not found" }, { status: 404 })
    }

    // Get today's date
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Check if user logged in today
    const lastLogin = user.last_login_at ? new Date(user.last_login_at) : null
    const loginToday = lastLogin && lastLogin >= today

    // Check if user has daily login transaction today
    const { data: dailyLoginTx } = await supabase
      .from("coin_transactions")
      .select("id")
      .eq("user_id", user.id)
      .eq("transaction_type", "daily_login")
      .gte("created_at", today.toISOString())
      .limit(1)

    const dailyLoginDone = (dailyLoginTx?.length || 0) > 0

    // Get user's post count (for first post bonus)
    const { data: posts } = await supabase
      .from("posts")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)

    // Check if user has first post transaction
    const { data: firstPostTx } = await supabase
      .from("coin_transactions")
      .select("id")
      .eq("user_id", user.id)
      .eq("transaction_type", "first_post")
      .limit(1)

    const firstPostDone = (firstPostTx?.length || 0) > 0
    const canEarnFirstPost = (posts?.length || 0) === 0

    // Get user's profile completion
    const profileFields = [
      user.id,
      session.user.email,
    ]

    const { data: userProfile } = await supabase
      .from("users")
      .select("gender, date_of_birth, bio, city, country, interests")
      .eq("id", user.id)
      .single()

    const profileCompletion = {
      gender: !!userProfile?.gender,
      dateOfBirth: !!userProfile?.date_of_birth,
      bio: !!userProfile?.bio,
      city: !!userProfile?.city,
      country: !!userProfile?.country,
      interests: !!userProfile?.interests && (userProfile.interests as any[]).length > 0,
    }

    const profileCompleted = Object.values(profileCompletion).filter(Boolean).length === 6

    // Check if user has profile complete transaction
    const { data: profileCompleteTx } = await supabase
      .from("coin_transactions")
      .select("id")
      .eq("user_id", user.id)
      .eq("transaction_type", "profile_complete")
      .limit(1)

    const profileCompleteDone = (profileCompleteTx?.length || 0) > 0

    return Response.json({
      dailyGoals: [
        {
          id: "daily_login",
          title: "Daily Login",
          description: "Log in every day",
          coins: 5,
          completed: dailyLoginDone,
          reward: 5,
          icon: "Clock",
        },
        {
          id: "profile_complete",
          title: "Complete Profile",
          description: "Fill in all profile details",
          coins: 10,
          completed: profileCompleteDone,
          reward: 10,
          progress: Object.values(profileCompletion).filter(Boolean).length,
          total: 6,
          icon: "User",
        },
        {
          id: "first_post",
          title: "Make Your First Post",
          description: "Create and publish your first post",
          coins: 10,
          completed: firstPostDone,
          reward: 10,
          icon: "FileText",
        },
      ],
      profileCompletion,
    })
  } catch (error) {
    console.error("Daily goals fetch error:", error)
    return Response.json(
      { error: "Failed to fetch daily goals" },
      { status: 500 }
    )
  }
}
