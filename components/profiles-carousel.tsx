"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Heart, MapPin, Verified, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/i18n/context"

interface Profile {
  id: string | number
  name: string
  age: number
  location: string
  image: string
  verified: boolean
  vibeScore: number
  interests: string[]
}

export function ProfilesCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { t } = useLanguage()

  // Fetch profiles from API
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/profiles?limit=10")
        if (response.ok) {
          const data = await response.json()
          setProfiles(data.profiles || [])
        } else {
          // Fallback to mock data if API fails
          setProfiles(getMockProfiles())
        }
      } catch (error) {
        console.error("Error fetching profiles:", error)
        // Fallback to mock data
        setProfiles(getMockProfiles())
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfiles()
  }, [])


  // Fallback mock data function when API fails
  const getMockProfiles = (): Profile[] => [
    {
      id: "1",
      name: "Emma Watson",
      age: 28,
      location: "New York, USA",
      image: "/placeholder-user.jpg",
      verified: true,
      vibeScore: 95,
      interests: ["Travel", "Art", "Music"],
    },
    {
      id: "2",
      name: "James Chen",
      age: 32,
      location: "London, UK",
      image: "/placeholder-user.jpg",
      verified: true,
      vibeScore: 92,
      interests: ["Fitness", "Tech", "Food"],
    },
    {
      id: "3",
      name: "Sofia Garcia",
      age: 26,
      location: "Barcelona, Spain",
      image: "/placeholder-user.jpg",
      verified: true,
      vibeScore: 98,
      interests: ["Dance", "Photography", "Movies"],
    },
  ]

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 320
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  if (isLoading) {
    return (
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                {t("discoverProfiles")}
              </h2>
              <p className="text-lg text-foreground/70 dark:text-foreground/75 max-w-2xl">
                {t("discoverDescription")}
              </p>
            </div>
          </div>
          <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-72 aspect-[3/4] rounded-3xl bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3">
              {t("discoverProfiles")} <span className="gradient-text">{t("amazingPeople")}</span>
            </h2>
            <p className="text-lg text-foreground/70 dark:text-foreground/75">
              {t("discoverDescription")}
            </p>
          </div>
          <div className="hidden md:flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-transparent"
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-transparent"
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Carousel */}
        <div ref={scrollRef} onScroll={checkScroll} className="flex gap-6 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4">
          {profiles.map((profile) => (
            <div key={profile.id} className="flex-shrink-0 w-72 group cursor-pointer">
              <div className="relative aspect-[3/4] rounded-3xl overflow-hidden mb-4">
                <Image
                  src={profile.image || "/placeholder.svg"}
                  alt={profile.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Vibe Score */}
                <div className="absolute top-4 right-4">
                  <Badge className="gradient-bg text-primary-foreground font-semibold">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {profile.vibeScore}% Vibe
                  </Badge>
                </div>

                {/* Like Button */}
                <Button
                  size="icon"
                  className="absolute top-4 left-4 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 text-white border-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Heart className="w-5 h-5" />
                </Button>

                {/* Info */}
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-white">
                      {profile.name}, {profile.age}
                    </h3>
                    {profile.verified && <Verified className="w-5 h-5 text-blue-400 fill-blue-400" />}
                  </div>
                  <div className="flex items-center gap-1 text-white/80 text-sm mb-3">
                    <MapPin className="w-4 h-4" />
                    {profile.location}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((interest) => (
                      <Badge key={interest} variant="secondary" className="bg-white/20 text-white border-0 text-xs">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Navigation Dots */}
        <div className="flex justify-center gap-2 mt-6 md:hidden">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full w-10 h-10 bg-transparent"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full w-10 h-10 bg-transparent"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </section>
  )
}
