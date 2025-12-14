"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Wifi, WifiOff, Home, RefreshCw } from "lucide-react"

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // If online, redirect to home
  useEffect(() => {
    if (isOnline) {
      window.location.href = "/"
    }
  }, [isOnline])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
              <WifiOff className="w-12 h-12 text-muted-foreground" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              !
            </div>
          </div>
        </div>

        {/* Content */}
        <h1 className="text-3xl font-bold mb-2 text-foreground">You're Offline</h1>
        <p className="text-muted-foreground mb-6 text-lg">
          It looks like you've lost your internet connection. Don't worry, you can still view cached content or wait for your connection to be restored.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-muted rounded-lg p-4">
            <div className="text-2xl font-bold text-foreground">↓</div>
            <p className="text-sm text-muted-foreground mt-2">Cached Pages</p>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <div className="text-2xl font-bold text-foreground">☆</div>
            <p className="text-sm text-muted-foreground mt-2">Limited Features</p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={() => window.location.href = "/"}
            className="w-full gradient-bg text-primary-foreground rounded-full h-12 font-semibold"
          >
            <Home className="w-5 h-5 mr-2" />
            Go Home
          </Button>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="w-full rounded-full h-12 font-semibold"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Try Again
          </Button>
        </div>

        {/* Status */}
        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <WifiOff className="w-4 h-4" />
            Waiting for connection...
          </div>
        </div>
      </div>
    </div>
  )
}
