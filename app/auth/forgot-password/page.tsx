"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowLeft, Lock } from "lucide-react"

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
  const [isVisible, setIsVisible] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsVisible(true)
  }, [])

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
      <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/5 rounded-full blur-3xl animate-float"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-secondary/20 via-primary/10 to-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }}></div>
        </div>

        <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-50 duration-500">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="relative w-16 h-16 animate-pulse-glow">
                <Lock className="w-full h-full text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Password Reset</h1>
            <p className="text-muted-foreground">Success!</p>
          </div>

          <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-secondary/0 pointer-events-none"></div>

            <CardContent className="relative z-10 space-y-4 pt-8">
              <Alert className="bg-green-500/10 border-green-500/50 animate-in fade-in duration-500">
                <AlertDescription className="text-foreground">
                  Your password has been successfully reset. You can now login with your new password.
                </AlertDescription>
              </Alert>
              <Link href="/auth/login" className="block">
                <Button className="w-full h-11 gradient-bg hover:shadow-lg hover:shadow-primary/25 font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-95">
                  Return to Login
                </Button>
              </Link>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-6 animate-in fade-in duration-500">
            Secure admin portal powered by Vibe2Gether
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden py-12">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-secondary/20 via-primary/10 to-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }}></div>
      </div>

      {/* Content */}
      <div className={`relative z-10 w-full max-w-md transform transition-all duration-700 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
        {/* Logo and Header Section */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex justify-center mb-6">
            <div className="relative w-16 h-16 animate-pulse-glow">
              <Image
                src="/v2g-logo.png"
                alt="Vibe2Gether"
                width={64}
                height={64}
                className="object-contain"
              />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">Vibe2Gether</h1>
          <p className="text-muted-foreground">Reset Your Password</p>
        </div>

        {/* Main Card */}
        <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-sm relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 transition-all hover:shadow-primary/20 hover:shadow-2xl">
          {/* Card accent border */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-secondary/0 pointer-events-none"></div>

          <CardHeader className="space-y-3 relative z-10">
            <div>
              <h2 className="text-2xl font-bold text-center text-foreground">Account Recovery</h2>
              <p className="text-center text-sm text-muted-foreground mt-2">
                {step === "email" && "Enter your email address"}
                {step === "questions" && "Answer your security questions"}
                {step === "newpassword" && "Set a new password"}
              </p>
            </div>
          </CardHeader>

          <CardContent className="relative z-10">
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
                <Alert variant="destructive" className="border-destructive/50 bg-destructive/10 animate-in fade-in duration-300">
                  <AlertDescription className="text-destructive">{error}</AlertDescription>
                </Alert>
              )}

              {step === "email" && (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
                  <label htmlFor="email" className="text-sm font-semibold text-foreground block">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@vibe2gether.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-11 bg-muted/50 border-border/50 focus-visible:ring-primary/50 transition-all duration-300"
                  />
                </div>
              )}

              {step === "questions" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
                  {securityQuestions.map((q, index) => (
                    <div key={index} className="space-y-2 p-3 border border-border/30 rounded-lg bg-muted/20 transition-all duration-300 hover:border-primary/30">
                      <label className="text-sm font-semibold text-foreground block">{q.question}</label>
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
                        className="h-10 bg-background/50 border-border/50 focus-visible:ring-primary/50 transition-all duration-300"
                      />
                    </div>
                  ))}
                </div>
              )}

              {step === "newpassword" && (
                <>
                  <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
                    <label htmlFor="newPassword" className="text-sm font-semibold text-foreground block">
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
                      className="h-11 bg-muted/50 border-border/50 focus-visible:ring-primary/50 transition-all duration-300"
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum 8 characters
                    </p>
                  </div>

                  <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: "100ms" }}>
                    <label htmlFor="confirmPassword" className="text-sm font-semibold text-foreground block">
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
                      className="h-11 bg-muted/50 border-border/50 focus-visible:ring-primary/50 transition-all duration-300"
                    />
                  </div>
                </>
              )}

              <Button 
                type="submit" 
                className="w-full h-11 mt-6 gradient-bg hover:shadow-lg hover:shadow-primary/25 font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-95 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
                disabled={isLoading}
              >
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
                  className="w-full h-11 border-border/50 hover:bg-muted/50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
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

              <div className="text-center text-sm text-muted-foreground border-t border-border/30 pt-4 animate-in fade-in duration-500 fill-mode-both" style={{ animationDelay: step === "email" ? "300ms" : "400ms" }}>
                <Link href="/auth/login" className="text-primary hover:text-primary/80 font-semibold transition-colors duration-200">
                  Back to Login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer text */}
        <p className="text-center text-xs text-muted-foreground mt-6 animate-in fade-in duration-500 fill-mode-both" style={{ animationDelay: "500ms" }}>
          Secure admin portal powered by Vibe2Gether
        </p>
      </div>
    </div>
  );
}
