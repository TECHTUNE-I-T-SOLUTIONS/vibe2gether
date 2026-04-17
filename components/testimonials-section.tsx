"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Quote, Star, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/testimonies?status=approved")
        if (!response.ok) {
          setTestimonials([])
          return
        }

        const data = await response.json()
        const testimonies = Array.isArray(data.data) ? data.data : []
        setTestimonials(testimonies.sort(() => Math.random() - 0.5).slice(0, 6))
      } catch (error) {
        console.error("Failed to fetch testimonials:", error)
        setTestimonials([])
      } finally {
        setLoading(false)
      }
    }

    fetchTestimonials()
  }, [])

  const featured = useMemo(() => testimonials[0], [testimonials])
  const secondary = useMemo(() => testimonials.slice(1, 4), [testimonials])
  const footerStats = useMemo(
    () => [
      { label: "Average rating", value: "4.9/5" },
      { label: "Stories featured", value: `${testimonials.length || 0}+` },
      { label: "Community trust", value: "Growing daily" },
    ],
    [testimonials.length]
  )

  if (loading || testimonials.length === 0 || !featured) {
    return null
  }

  return (
    <section
      id="testimonials"
      className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"
    >
      <div className="overflow-hidden rounded-[36px] border border-white/60 bg-white/80 shadow-[0_24px_90px_rgba(255,108,157,0.10)] backdrop-blur dark:border-white/10 dark:bg-white/5 dark:shadow-[0_24px_90px_rgba(0,0,0,0.28)]">
        <div className="grid gap-8 px-6 py-8 md:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-10 lg:py-10">
          <div className="space-y-6">
            <div>
              <Badge className="rounded-full bg-primary/10 px-4 py-1 text-primary hover:bg-primary/10 dark:bg-primary/15">
                Stories from our community
              </Badge>
              <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                Real progress, real people, real momentum
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
                See how Vibe2Gether helps people discover opportunities, build trust, and create genuine momentum in
                their careers and communities.
              </p>
            </div>

            <Card className="overflow-hidden rounded-[30px] border-white/60 bg-[linear-gradient(135deg,#fff5fa_0%,#f7f2ff_58%,#fffaf4_100%)] shadow-none dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(255,95,149,0.16)_0%,rgba(130,104,255,0.16)_55%,rgba(255,168,66,0.10)_100%)]">
              <CardContent className="p-6">
                <Quote className="h-10 w-10 text-primary/30" />
                <h3 className="mt-4 text-2xl font-bold tracking-[-0.03em]">{featured.title}</h3>
                <p className="mt-4 text-base leading-8 text-foreground/80 dark:text-foreground/85">
                  &quot;{featured.content}&quot;
                </p>

                <div className="mt-6 flex items-center gap-4">
                  <div className="relative h-14 w-14 overflow-hidden rounded-full ring-2 ring-white/70 dark:ring-white/15">
                    <Image
                      src={featured.user_avatar_url || "/placeholder.svg"}
                      alt={featured.user_name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold">{featured.user_name}</p>
                    <p className="text-sm text-muted-foreground">{featured.user_location || "Nigeria"}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < featured.rating ? "fill-accent text-accent" : "text-muted-foreground/40"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {secondary.map((testimonial, index) => (
              <Card
                key={testimonial.id}
                className="rounded-[28px] border-white/60 bg-background/85 shadow-none dark:border-white/10 dark:bg-white/5"
              >
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 font-bold text-primary dark:bg-primary/15">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold">{testimonial.title}</h3>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            &quot;{testimonial.content}&quot;
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${
                                i < testimonial.rating ? "fill-accent text-accent" : "text-muted-foreground/40"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-3">
                        <div className="relative h-11 w-11 overflow-hidden rounded-full ring-2 ring-primary/10 dark:ring-white/10">
                          <Image
                            src={testimonial.user_avatar_url || "/placeholder.svg"}
                            alt={testimonial.user_name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{testimonial.user_name}</p>
                          <p className="text-xs text-muted-foreground">{testimonial.user_location || "Nigeria"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="grid gap-3 sm:grid-cols-3">
              {footerStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[24px] border border-white/60 bg-background/80 px-4 py-4 dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex items-center gap-2 text-primary">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-[0.22em]">{stat.label}</span>
                  </div>
                  <p className="mt-3 text-lg font-bold">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
