"use client"

import { useState } from "react"
import Image from "next/image"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Search,
  Calendar,
  MapPin,
  Clock,
  Users,
  Heart,
  ArrowRight,
  Sparkles,
  Music,
  Utensils,
  Palette,
} from "lucide-react"
import { cn } from "@/lib/utils"

const eventCategories = [
  { id: "all", label: "All Events", icon: Sparkles },
  { id: "music", label: "Music", icon: Music },
  { id: "food", label: "Food & Wine", icon: Utensils },
  { id: "art", label: "Art & Culture", icon: Palette },
  { id: "social", label: "Social", icon: Users },
]

const events = [
  {
    id: 1,
    title: "Sunset Jazz Night",
    description: "An enchanting evening of live jazz music with city skyline views and craft cocktails.",
    image: "/placeholder.svg?height=400&width=600",
    date: "Dec 15, 2025",
    time: "7:00 PM",
    location: "Sky Lounge, New York",
    attendees: 234,
    price: 75,
    category: "music",
    featured: true,
  },
  {
    id: 2,
    title: "Wine & Paint Date Night",
    description: "Create art together while sipping fine wines. No experience needed!",
    image: "/placeholder.svg?height=400&width=600",
    date: "Dec 18, 2025",
    time: "6:30 PM",
    location: "Art Studio, London",
    attendees: 48,
    price: 95,
    category: "art",
    featured: true,
  },
  {
    id: 3,
    title: "Cooking Class: Italian Romance",
    description: "Learn to cook authentic Italian dishes together with a master chef.",
    image: "/placeholder.svg?height=400&width=600",
    date: "Dec 20, 2025",
    time: "5:00 PM",
    location: "Culinary Institute, Paris",
    attendees: 32,
    price: 120,
    category: "food",
    featured: false,
  },
  {
    id: 4,
    title: "Singles Mixer: Winter Edition",
    description: "Meet new people in a fun, relaxed atmosphere with icebreaker games.",
    image: "/placeholder.svg?height=400&width=600",
    date: "Dec 22, 2025",
    time: "8:00 PM",
    location: "The Grand Hall, Sydney",
    attendees: 156,
    price: 45,
    category: "social",
    featured: true,
  },
  {
    id: 5,
    title: "Stargazing Experience",
    description: "A magical night under the stars with telescope viewing and champagne.",
    image: "/placeholder.svg?height=400&width=600",
    date: "Dec 25, 2025",
    time: "9:00 PM",
    location: "Mountain Observatory",
    attendees: 64,
    price: 150,
    category: "social",
    featured: false,
  },
  {
    id: 6,
    title: "Wine Tasting Journey",
    description: "Explore premium wines from around the world with expert sommeliers.",
    image: "/placeholder.svg?height=400&width=600",
    date: "Dec 28, 2025",
    time: "4:00 PM",
    location: "Vineyard Estate, Napa",
    attendees: 88,
    price: 180,
    category: "food",
    featured: true,
  },
]

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [savedEvents, setSavedEvents] = useState<number[]>([])

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === "all" || event.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const toggleSave = (eventId: number) => {
    setSavedEvents((prev) => (prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]))
  }

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <Header />
      <main className="pt-20 md:pt-24">
        {/* Hero */}
        <div className="relative bg-gradient-to-br from-secondary/10 via-primary/10 to-accent/10 py-12 md:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <Badge className="mb-4 gradient-bg text-primary-foreground">
                <Calendar className="w-4 h-4 mr-1" />
                Events
              </Badge>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                Unforgettable <span className="gradient-text">Experiences</span> Await
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Discover curated events designed for connection, romance, and unforgettable moments.
              </p>
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search events by name or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 rounded-full bg-background text-base"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="sticky top-16 md:top-20 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="container mx-auto px-4">
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-4">
              {eventCategories.map((category) => {
                const Icon = category.icon
                return (
                  <Button
                    key={category.id}
                    variant={activeCategory === category.id ? "default" : "outline"}
                    className={cn("rounded-full shrink-0", activeCategory === category.id && "gradient-bg border-0")}
                    onClick={() => setActiveCategory(category.id)}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {category.label}
                  </Button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Featured Events */}
        {activeCategory === "all" && (
          <div className="container mx-auto px-4 py-8">
            <h2 className="text-2xl font-bold mb-6">Featured Events</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {filteredEvents
                .filter((e) => e.featured)
                .slice(0, 2)
                .map((event) => (
                  <Card
                    key={event.id}
                    className="group overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300"
                  >
                    <div className="relative aspect-video">
                      <Image
                        src={event.image || "/placeholder.svg"}
                        alt={event.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      <Badge className="absolute top-4 left-4 gradient-bg text-primary-foreground">Featured</Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        className={cn(
                          "absolute top-4 right-4 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 text-white",
                          savedEvents.includes(event.id) && "text-primary",
                        )}
                        onClick={() => toggleSave(event.id)}
                      >
                        <Heart className={cn("w-5 h-5", savedEvents.includes(event.id) && "fill-primary")} />
                      </Button>
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h3 className="text-2xl font-bold text-white mb-2">{event.title}</h3>
                        <p className="text-white/80 mb-4 line-clamp-2">{event.description}</p>
                        <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {event.date}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {event.time}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {event.location}
                          </div>
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span className="text-sm">{event.attendees} going</span>
                          </div>
                          <div className="text-lg font-bold gradient-text">${event.price}</div>
                        </div>
                        <Button className="rounded-full gradient-bg">
                          Get Tickets
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        )}

        {/* Events Grid */}
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold mb-6">
            {activeCategory === "all" ? "All Events" : eventCategories.find((c) => c.id === activeCategory)?.label}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <Card
                key={event.id}
                className="group overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300"
              >
                <div className="relative aspect-video">
                  <Image
                    src={event.image || "/placeholder.svg"}
                    alt={event.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <Button
                    size="icon"
                    variant="ghost"
                    className={cn(
                      "absolute top-3 right-3 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 text-white",
                      savedEvents.includes(event.id) && "text-primary",
                    )}
                    onClick={() => toggleSave(event.id)}
                  >
                    <Heart className={cn("w-5 h-5", savedEvents.includes(event.id) && "fill-primary")} />
                  </Button>
                  <div className="absolute bottom-3 left-3 right-3">
                    <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 capitalize">
                      {event.category}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-1 line-clamp-1">{event.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{event.description}</p>
                  <div className="flex flex-col gap-2 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      {event.date} at {event.time}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      {event.location}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{event.attendees}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold gradient-text">${event.price}</span>
                      <Button size="sm" className="rounded-full gradient-bg">
                        Book Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
      <MobileNav />
    </div>
  )
}
