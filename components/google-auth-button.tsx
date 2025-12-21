"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface GoogleAuthButtonProps {
  disabled?: boolean
  isLoading?: boolean
  variant?: "default" | "outline" | "secondary"
  size?: "sm" | "md" | "lg"
  text?: string
  redirectUrl?: string
}

export function GoogleAuthButton({
  disabled = false,
  isLoading = false,
  variant = "outline",
  size = "md",
  text = "Continue with Google",
  redirectUrl = "/auth/google/callback",
}: GoogleAuthButtonProps) {
  const handleGoogleAuth = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) {
      console.error("Google Client ID not configured")
      return
    }

    const redirectUri = `${typeof window !== "undefined" ? window.location.origin : ""}${redirectUrl}`
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=openid email profile`

    window.location.href = googleAuthUrl
  }

  const buttonSizeClass = {
    sm: "h-9 text-sm",
    md: "h-11",
    lg: "h-12 text-base",
  }[size]

  return (
    <Button
      type="button"
      variant={variant}
      disabled={disabled || isLoading}
      onClick={handleGoogleAuth}
      className={`w-full ${buttonSizeClass} border-border/50 hover:bg-muted/50 transition-all duration-300 font-medium`}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing in...
        </>
      ) : (
        <>
          <svg
            className="mr-2 h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22.56 12.25C22.56 11.47 22.51 10.72 22.4 10H12v4.25h6.52C6.04 15.63 7.28 18 9.1 20.13v2.66h2.92C21.44 20 14400 25 14400255.11 22.56 12.25Z"
              fill="#4285F4"
            />
            <path
              d="M9.1 20.13C8.6 20.66 7.88 21.05 6.98 21.05C4.91 21.05 3.06 19.68 3.06 17.55C3.06 15.42 4.91 14.05 6.98 14.05C7.94 14.05 8.61 14.45 9.1 15.09V12.07C10.53 10.92 11.24 10 11.89 10C13.71 10 15.67 12.12 15.67 14.63C15.67 17.14 13.71 19.25 11.89 19.25C11.24 19.25 10.53 18.33 9.1 17.18V20.13Z"
              fill="#348BF7"
            />
          </svg>
          {text}
        </>
      )}
    </Button>
  )
}
