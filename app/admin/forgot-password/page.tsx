"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowLeft } from "lucide-react"

interface SecurityQuestion {
  question: string
  answer: string
}

export default function AdminForgotPassword() {
  const [step, setStep] = useState<"email" | "questions" | "newpassword" | "success">("email")
  const [email, setEmail] = useState("")
  const [securityAnswers, setSecurityAnswers] = useState<Record<string, string>>({})
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [securityQuestions, setSecurityQuestions] = useState<SecurityQuestion[]>([])
  const router = useRouter()

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email) {
      setError("Email is required")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, action: "getQuestions" }),
      })

      const data = await response.json()

      if (response.ok) {
        setSecurityQuestions(data.questions)
        setStep("questions")
      } else {
        setError(data.error || "Email not found")
      }
    } catch (err) {
      setError("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuestionsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (securityQuestions.some((q) => !securityAnswers[q.question])) {
      setError("All security questions must be answered")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          action: "verifyAnswers",
          answers: securityAnswers,
        }),
      })

      if (response.ok) {
        setStep("newpassword")
      } else {
        const data = await response.json()
        setError(data.error || "Invalid answers")
      }
    } catch (err) {
      setError("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!newPassword || !confirmPassword) {
      setError("All fields are required")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          action: "resetPassword",
          newPassword,
        }),
      })

      if (response.ok) {
        setStep("success")
      } else {
        const data = await response.json()
        setError(data.error || "Failed to reset password")
      }
    } catch (err) {
      setError("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Password Reset Successful</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-green-500/10 border-green-500/50">
              <AlertDescription>
                Your password has been successfully reset. You can now login with your new password.
              </AlertDescription>
            </Alert>
            <Link href="/auth/login" className="block">
              <Button className="w-full gradient-bg">Return to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <p className="text-sm text-muted-foreground">
            {step === "email" && "Enter your email address"}
            {step === "questions" && "Answer your security questions"}
            {step === "newpassword" && "Set a new password"}
          </p>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={
              step === "email"
                ? handleEmailSubmit
                : step === "questions"
                  ? handleQuestionsSubmit
                  : handlePasswordSubmit
            }
            className="space-y-4"
          >
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {step === "email" && (
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            )}

            {step === "questions" && (
              <div className="space-y-4">
                {securityQuestions.map((q, index) => (
                  <div key={index} className="space-y-2 p-3 border rounded">
                    <label className="text-sm font-medium block">{q.question}</label>
                    <Input
                      type="text"
                      placeholder="Your answer"
                      value={securityAnswers[q.question] || ""}
                      onChange={(e) =>
                        setSecurityAnswers({
                          ...securityAnswers,
                          [q.question]: e.target.value,
                        })
                      }
                      disabled={isLoading}
                    />
                  </div>
                ))}
              </div>
            )}

            {step === "newpassword" && (
              <>
                <div className="space-y-2">
                  <label htmlFor="newPassword" className="text-sm font-medium">
                    New Password
                  </label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum 8 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm Password
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </>
            )}

            <Button type="submit" className="w-full gradient-bg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait...
                </>
              ) : step === "email" ? (
                "Continue"
              ) : step === "questions" ? (
                "Verify Answers"
              ) : (
                "Reset Password"
              )}
            </Button>

            {step !== "email" && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  if (step === "questions") {
                    setStep("email")
                  } else if (step === "newpassword") {
                    setStep("questions")
                  }
                }}
                disabled={isLoading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}

            <div className="text-center text-sm text-muted-foreground">
              <Link href="/auth/login" className="hover:underline font-medium">
                Back to Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
