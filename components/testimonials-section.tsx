"use client"

import { useState } from "react"
import Image from "next/image"
import { Quote, Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useLanguage } from "@/lib/i18n/context"

interface Testimonial {
  id: number
  name: string
  location: string
  image: string
  quote: string
  rating: number
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Sarah & Michael",
    location: "California, USA",
    image: "/testimonies/icons8-group-100.png",
    quote:
      "We matched on Vibe2Gether 2 years ago, and now we're engaged! The matching algorithm really works - it brought us together when we least expected it.",
    rating: 5,
  },
  {
    id: 2,
    name: "David Kim",
    location: "Seoul, South Korea",
    image: "/testimonies/icons8-male-user-100.png",
    quote:
      "The marketplace feature is incredible. I found the perfect anniversary gift for my girlfriend and earned coins doing it. Best dating app ever!",
    rating: 5,
  },
  {
    id: 3,
    name: "Maria Santos",
    location: "São Paulo, Brazil",
    image: "/testimonies/icons8-users-100.png",
    quote:
      "I love how international this platform is. I've made friends from all over the world, and the multi-language support makes communication so easy.",
    rating: 5,
  },
  {
    id: 4,
    name: "Ahmed & Leila",
    location: "Dubai, UAE",
    image: "/testimonies/icons8-users-50.png",
    quote:
      "The events feature helped us find amazing experiences together. From cooking classes to art exhibitions - Vibe2Gether brings us closer every day.",
    rating: 5,
  },
]

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const { t } = useLanguage()

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <section className="py-20 md:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            {t("loveStories")} <span className="gradient-text">{t("ourCommunity")}</span>
          </h2>
          <p className="text-lg text-foreground/70 dark:text-foreground/75 max-w-2xl mx-auto">
            {t("testimonialDescription")}
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {testimonials.map((testimonial, i) => (
            <Card
              key={testimonial.id}
              className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300"
            >
              <CardContent className="p-6 md:p-8">
                <Quote className="w-10 h-10 text-primary/20 mb-4" />
                <p className="text-foreground/80 mb-6 leading-relaxed">"{testimonial.quote}"</p>
                <div className="flex items-center gap-4">
                  <div className="relative w-14 h-14 rounded-full overflow-hidden">
                    <Image
                      src={testimonial.image || "/placeholder.svg"}
                      alt={testimonial.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-foreground/70 dark:text-foreground/75">{testimonial.location}</div>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-accent text-accent" />
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
