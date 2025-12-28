"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Sparkles, Eye, MessageCircle, Zap, Crown, Star, Shield, Infinity, Coins, ArrowRight } from "lucide-react"

export default function PremiumRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard premium page
    router.replace("/dashboard/premium")
  }, [router])

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-16 md:pt-20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Redirecting to Premium...</h1>
          <p className="text-muted-foreground">Please wait while we redirect you to the premium page.</p>
          <Button onClick={() => router.push("/dashboard/premium")} className="gap-2">
            Or click here to continue
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </main>
      <Footer />
      <MobileNav />
    </div>
  )
}
