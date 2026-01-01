"use client"

import { useState, useEffect } from "react"
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
  ArrowRight,
  Sparkles,
  Music,
  Utensils,
  Palette,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getEvents } from "@/lib/supabase/queries"
import { EventDetailsModal } from "@/components/event-details-modal"
import { createClient } from "@/lib/supabase/client"

const eventCategories = [
  { id: "all", label: "All Events", icon: Sparkles },
  { id: "music", label: "Music", icon: Music },
  { id: "food", label: "Food & Wine", icon: Utensils },
  { id: "art", label: "Art & Culture", icon: Palette },
  { id: "social", label: "Social", icon: Users },
]

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [creatorInfo, setCreatorInfo] = useState<any>(null)

  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true)
        const { data, error } = await getEvents(100, 0)
        if (error) {
          setError("Failed to load events")
        } else {
          setEvents(data || [])
        }
      } catch (err) {
        setError("Failed to load events")
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [])

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location_name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === "all" || event.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const handleViewDetails = async (event: any) => {
    setSelectedEvent(event)

    // Fetch creator info
    try {
      const supabase = await createClient()
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", event.creator_id)
        .single()

      if (data) {
        setCreatorInfo(data)
      }
    } catch (error) {
      console.error("Failed to fetch creator info:", error)
    }

    setDetailsModalOpen(true)
  }

  const formatPrice = (event: any) => {
    if (!event?.ticket_price || event?.is_free) return "Free"
    
    // Get currency from event (NGN or USD)
    const currency = event.currency || "USD"
    const price = event.ticket_price
    
    if (currency === "NGN") {
      return `₦${price.toLocaleString()}`
    }
    return `$${price}`
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

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="container mx-auto px-4 py-20 text-center">
            <p className="text-red-500">{error}</p>
          </div>
        ) : (
          <>
            {/* Featured Events */}
            {activeCategory === "all" && filteredEvents.length > 0 && (
              <div className="container mx-auto px-4 py-8">
                <h2 className="text-2xl font-bold mb-6">Featured Events</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {filteredEvents.slice(0, 2).map((event) => (
                    <Card
                      key={event.id}
                      className="group overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300"
                    >
                      <div className="relative aspect-video">
                        <Image
                          src={event.thumbnail_url || event.thumbnail || "/placeholder.svg"}
                          alt={event.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                        <Badge className="absolute top-4 left-4 gradient-bg text-primary-foreground">Featured</Badge>
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                          <h3 className="text-2xl font-bold text-white mb-2">{event.title}</h3>
                          <p className="text-white/80 mb-4 line-clamp-2">{event.description}</p>
                          <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(event.event_date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(event.event_date).toLocaleTimeString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {event.location_name}
                            </div>
                          </div>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Users className="w-4 h-4" />
                              <span className="text-sm">{event.registered_count} registered</span>
                            </div>
                            {!event.is_free && event.ticket_price ? (
                              <div className="text-lg font-bold gradient-text">{formatPrice(event)}</div>
                            ) : (
                              <Badge variant="secondary">Free</Badge>
                            )}
                          </div>
                          <Button 
                            className="rounded-full gradient-bg"
                            onClick={() => handleViewDetails(event)}
                          >
                            View Details
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
              {filteredEvents.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No events found</p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEvents.map((event) => (
                    <Card
                      key={event.id}
                      className="group overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300"
                    >
                      <div className="relative aspect-video">
                        <Image
                          src={event.thumbnail_url || event.thumbnail || "/placeholder.svg"}
                          alt={event.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
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
                            {new Date(event.event_date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary" />
                            {event.location_name}
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-border">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{event.registered_count}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            {!event.is_free && event.ticket_price ? (
                              <span className="font-bold gradient-text">{formatPrice(event)}</span>
                            ) : (
                              <Badge variant="secondary">Free</Badge>
                            )}
                            <Button 
                              size="sm" 
                              className="rounded-full gradient-bg"
                              onClick={() => handleViewDetails(event)}
                            >
                              Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
      <Footer />
      <MobileNav />

      {/* Event Details Modal */}
      <EventDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false)
          setSelectedEvent(null)
          setCreatorInfo(null)
        }}
        event={selectedEvent}
        creator={creatorInfo}
      />
    </div>
  )
}
