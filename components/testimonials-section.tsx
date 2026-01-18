"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Quote, Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useLanguage } from "@/lib/i18n/context"

interface Testimonial {
  id: string
  user_name: string
  user_location: string
  user_avatar_url: string
  content: string
  rating: number
  title: string
}

export function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const { t } = useLanguage()

  // Fetch approved testimonies from the database
  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/testimonies?status=approved")
        if (response.ok) {
          const data = await response.json()
          const testimonies = data.data || []
          // Shuffle testimonies to show different ones on each visit
          setTestimonials(testimonies.sort(() => Math.random() - 0.5).slice(0, 4))
        }
      } catch (error) {
        console.error("Failed to fetch testimonials:", error)
        // Fallback to empty state instead of hardcoded testimonies
      } finally {
        setLoading(false)
      }
    }

    fetchTestimonials()
  }, [])

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  // Don't render section if no testimonies
  if (loading) {
    return null
  }

  if (!testimonials || testimonials.length === 0) {
    return null
  }

  return (
    <section className="py-20 md:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            {t("Stories from")} <span className="gradient-text">{t("ourCommunity")}</span>
          </h2>
          <p className="text-lg text-foreground/70 dark:text-foreground/75 max-w-2xl mx-auto">
            {t("testimonialDescription")}
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {testimonials.map((testimonial) => (
            <Card
              key={testimonial.id}
              className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300"
            >
              <CardContent className="p-6 md:p-8">
                <Quote className="w-10 h-10 text-primary/20 mb-4" />
                <div className="mb-2">
                  <h3 className="font-semibold text-foreground mb-1">{testimonial.title}</h3>
                  <p className="text-foreground/80 leading-relaxed">"{testimonial.content}"</p>
                </div>
                <div className="flex items-center gap-4 mt-6">
                  <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={testimonial.user_avatar_url || "/placeholder.svg"}
                      alt={testimonial.user_name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{testimonial.user_name}</div>
                    <div className="text-sm text-foreground/70 dark:text-foreground/75">
                      {testimonial.user_location || "Nigeria"}
                    </div>
                  </div>
                  <div className="flex gap-0.5 flex-shrink-0">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < testimonial.rating
                            ? "fill-accent text-accent"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
