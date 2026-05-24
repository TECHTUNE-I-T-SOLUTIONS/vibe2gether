"use client"

import type React from "react"
import { useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Lock, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AuthHeader } from "@/components/auth-header"

export function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const token = useMemo(() => searchParams.get("token") || "", [searchParams])
  const email = useMemo(() => searchParams.get("email") || "", [searchParams])
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDone, setIsDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, newPassword }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password")
      }

      setIsDone(true)
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to reset password", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <AuthHeader showBackButton />
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md rounded-3xl border border-border/50 bg-card shadow-xl p-6 md:p-8">
          {isDone ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold">Password updated</h1>
              <p className="text-muted-foreground">You can now sign in with your new password for {email || "your account"}.</p>
              <Button asChild className="w-full h-12 rounded-xl gradient-bg">
                <Link href="/login">Go to login</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <h1 className="text-2xl font-bold">Reset password</h1>
                <p className="text-sm text-muted-foreground">Enter a new password for {email || "your account"}.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input id="password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="pl-10 h-12 rounded-xl" required minLength={8} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-12 rounded-xl" required minLength={8} />
              </div>

              <Button type="submit" className="w-full h-12 rounded-xl gradient-bg text-base font-semibold" disabled={isLoading || !token}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update password"
                )}
              </Button>

              {!token && <p className="text-sm text-destructive">Missing reset token. Please use the link from your email again.</p>}
            </form>
          )}
        </div>
      </div>
    </>
  )
}
