"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Sparkles, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/i18n/context"

const floatingImages = [
  { src: "/placeholder-user.jpg", top: "10%", left: "5%", delay: "0s" },
  { src: "/placeholder-user.jpg", top: "20%", right: "8%", delay: "0.5s" },
  { src: "/placeholder-user.jpg", bottom: "30%", left: "8%", delay: "1s" },
  { src: "/placeholder-user.jpg", bottom: "20%", right: "5%", delay: "1.5s" },
]

export function HeroSection() {
  const [mounted, setMounted] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-24 lg:pb-12">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-3xl" />
      </div>

      {/* Floating Profile Images */}
      {mounted &&
        floatingImages.map((img, i) => (
          <div
            key={i}
            className="absolute hidden lg:block animate-float rounded-full overflow-hidden border-4 border-background shadow-2xl"
            style={{
              top: img.top,
              left: img.left,
              right: img.right,
              bottom: img.bottom,
              animationDelay: img.delay,
              width: img.src.includes("80")
                ? "80px"
                : img.src.includes("70")
                  ? "70px"
                  : img.src.includes("65")
                    ? "65px"
                    : "60px",
              height: img.src.includes("80")
                ? "80px"
                : img.src.includes("70")
                  ? "70px"
                  : img.src.includes("65")
                    ? "65px"
                    : "60px",
            }}
          >
            <Image src={img.src || "/placeholder.svg"} alt="User" fill className="object-cover" />
          </div>
        ))}

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <Badge
            variant="secondary"
            className="mb-6 px-4 py-2 text-sm font-medium rounded-full border border-border bg-background/50 backdrop-blur-sm dark:text-white text-black dark:bg-background/30 dark:border-border"
          >
            <Sparkles className="w-4 h-4 mr-2 text-black fill-black dark:text-white dark:fill-white" />
            {t('heroBadge')}
          </Badge>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            {t("findYourPerfect")}
            <span className="block gradient-text">{t("matchToday")}</span>
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-foreground/70 dark:text-foreground/75 mb-8 max-w-2xl mx-auto leading-relaxed">
            {t("heroDescription")}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link href="/signup">
              <Button
                size="lg"
                className="rounded-full gradient-bg hover:opacity-90 transition-all duration-200 h-14 px-8 text-lg font-semibold shadow-lg shadow-primary/25 animate-pulse-glow"
              >
                {t("startYourJourney")}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/explore">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full h-14 px-8 text-lg font-semibold border-2 bg-transparent"
              >
                <Play className="w-5 h-5 mr-2" />
                {t("watchHowItWorks")}
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            <div className="p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border">
              <div className="text-2xl md:text-3xl font-bold gradient-text">2M+</div>
              <div className="text-sm text-foreground/70 dark:text-foreground/75">{t("activeUsers")}</div>
            </div>
            <div className="p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border">
              <div className="text-2xl md:text-3xl font-bold gradient-text">150+</div>
              <div className="text-sm text-foreground/70 dark:text-foreground/75">{t("countries")}</div>
            </div>
            <div className="p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border">
              <div className="text-2xl md:text-3xl font-bold gradient-text">50K+</div>
              <div className="text-sm text-foreground/70 dark:text-foreground/75">{t("matchesDaily")}</div>
            </div>
            <div className="p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border">
              <div className="text-2xl md:text-3xl font-bold gradient-text">4.9</div>
              <div className="text-sm text-foreground/70 dark:text-foreground/75">{t("appRating")}</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 flex flex-wrap gap-3 items-center justify-center max-w-3xl mx-auto">
            <Link href="/events">
              <Button variant="secondary" className="rounded-full px-4 py-2">
                {t('events')}
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button variant="secondary" className="rounded-full px-4 py-2">
                {t('marketplace')}
              </Button>
            </Link>
            <Link href="/dashboard/create-post">
              <Button variant="secondary" className="rounded-full px-4 py-2">
                {t('createPost')}
              </Button>
            </Link>
            <Link href="/dashboard/wallet">
              <Button variant="secondary" className="rounded-full px-4 py-2">
                {t('buyCoins') || t('earnRedeem')}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  )
}
