"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { MobileNav } from "@/components/mobile-nav"
import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"
import { ProfilesCarousel } from "@/components/profiles-carousel"
import { CTASection } from "@/components/cta-section"
import { TestimonialsSection } from "@/components/testimonials-section"

export default function HomePage() {
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
