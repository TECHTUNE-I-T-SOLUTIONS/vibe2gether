"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { MobileNav } from "@/components/mobile-nav"
import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"
import { ProfilesCarousel } from "@/components/profiles-carousel"
import { CTASection } from "@/components/cta-section"
import { TestimonialsSection } from "@/components/testimonials-section"

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // If user is already signed in, redirect to feed
  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      router.push("/dashboard/feed")
    }
  }, [status, session, router])

  // Show loading or homepage
  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  // If authenticated, don't show homepage (already redirecting)
  if (status === "authenticated") {
    return null
  }

  // Show homepage for unauthenticated users
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <ProfilesCarousel />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
      <MobileNav />
    </div>
  )
}
