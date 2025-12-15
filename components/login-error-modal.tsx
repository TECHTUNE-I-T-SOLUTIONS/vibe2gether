"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { AlertCircle } from "lucide-react"

export function LoginErrorModal() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const error = searchParams.get("error")
    
    // Only show modal for "user_not_found" error
    if (error === "user_not_found") {
      setIsOpen(true)
    }
  }, [searchParams])

  const handleSignup = () => {
    setIsOpen(false)
    // Get email from search params if available
    const email = searchParams.get("email")
    router.push(`/signup${email ? `?email=${email}` : ""}`)
  }

  const handleClose = () => {
    setIsOpen(false)
    // Clear error from URL
    router.push("/login")
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="border-destructive/50">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-destructive" />
            </div>
            <AlertDialogTitle>Account Not Found</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base mt-4">
            We couldn't find an account with this email address. Would you like to create a new account?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-3 justify-end mt-4">
          <AlertDialogCancel onClick={handleClose}>
            Back to Login
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleSignup} className="bg-primary hover:bg-primary/90">
            Create Account
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
