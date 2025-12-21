import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import * as bcrypt from "bcryptjs"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { email, action, answers, newPassword } = await request.json()

    if (!email || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get admin by email from admins table
    const { data: admin, error: adminError } = await supabase
      .from("admins")
      .select("id, email, password_hash")
      .eq("email", email)
      .single()

    if (adminError || !admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 })
    }

    if (action === "getQuestions") {
      // Get security questions for this admin
      const { data: questions, error: questionsError } = await supabase
        .from("admin_security_questions")
        .select("question, answer_hash")
        .eq("admin_id", admin.id)
        .limit(2)

      if (questionsError || !questions || questions.length === 0) {
        return NextResponse.json({ error: "No security questions found" }, { status: 404 })
      }

      return NextResponse.json({
        questions: questions.map((q) => ({ question: q.question })),
      })
    }

    if (action === "verifyAnswers") {
      if (!answers) {
        return NextResponse.json({ error: "Answers required" }, { status: 400 })
      }

      // Get admin's security questions with hashed answers
      const { data: questions, error: questionsError } = await supabase
        .from("admin_security_questions")
        .select("question, answer_hash")
        .eq("admin_id", admin.id)

      if (questionsError || !questions) {
        return NextResponse.json({ error: "Failed to verify answers" }, { status: 500 })
      }

      // Verify all answers
      let allCorrect = true
      for (const q of questions) {
        const userAnswer = answers[q.question]
        if (!userAnswer) {
          allCorrect = false
          break
        }

        const isCorrect = await bcrypt.compare(
          userAnswer.toLowerCase(),
          q.answer_hash
        )
        if (!isCorrect) {
          allCorrect = false
          break
        }
      }

      if (!allCorrect) {
        return NextResponse.json({ error: "Invalid security answers" }, { status: 401 })
      }

      return NextResponse.json({ success: true })
    }

    if (action === "resetPassword") {
      if (!newPassword || newPassword.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters" },
          { status: 400 }
        )
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10)

      // Update admin password
      const { error: updateError } = await supabase
        .from("admins")
        .update({
          password_hash: hashedPassword,
          updated_at: new Date().toISOString(),
        })
        .eq("id", admin.id)

      if (updateError) {
        return NextResponse.json(
          { error: "Failed to reset password" },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
