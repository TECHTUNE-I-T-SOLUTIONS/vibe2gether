"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { Loader2, Calendar, MapPin, Users, Clock, MessageSquare } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useUserProfile } from "@/hooks/use-user-profile"
import { getEvents, registerForEvent, unregisterFromEvent, getUserEventRegistrations } from "@/lib/supabase/queries"
import { useRouter } from "next/navigation"
import Image from "next/image"

const EVENT_CATEGORIES = [
  "All",
  "Social",
  "Sports",
  "Music",
  "Food & Drink",
  "Networking",
  "Learning",
  "Entertainment",
]

export default function EventsPage() {
  const { data: session, status } = useSession()
  const { user, loading } = useUserProfile()
  const router = useRouter()
  const [events, setEvents] = useState<any[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All")
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [userRegistrations, setUserRegistrations] = useState<string[]>([])
  const [registering, setRegistering] = useState(false)
  const observerTarget = useRef<HTMLDivElement>(null)

  // Auth check
  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [session, router])

  useEffect(() => {
    if (user) {
      fetchEvents(0)
      fetchUserRegistrations()
    }
  }, [user, search, category])

  async function fetchEvents(newOffset: number) {
    try {
      setLoadingEvents(true)
      const { data } = await getEvents(20, newOffset, category !== "All" ? category : undefined)

      if (newOffset === 0) {
        setEvents(data || [])
      } else {
        setEvents((prev) => [...prev, ...(data || [])])
      }

      setOffset(newOffset + 20)
      setHasMore((data || []).length === 20)
    } catch (err) {
      console.error("Failed to fetch events:", err)
    } finally {
      setLoadingEvents(false)
    }
  }

  async function fetchUserRegistrations() {
    if (!user) return
    try {
      const { data } = await getUserEventRegistrations(user.id)
      setUserRegistrations((data || []).map((r: any) => r.event_id))
    } catch (err) {
      console.error("Failed to fetch registrations:", err)
    }
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingEvents) {
          fetchEvents(offset)
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loadingEvents, offset])

  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.location.toLowerCase().includes(search.toLowerCase())
  )

  async function handleToggleRegistration() {
    if (!user || !selectedEvent) return

    try {
      setRegistering(true)
      if (userRegistrations.includes(selectedEvent.id)) {
        await unregisterFromEvent(user.id, selectedEvent.id)
        setUserRegistrations(userRegistrations.filter((id) => id !== selectedEvent.id))
      } else {
        await registerForEvent(user.id, selectedEvent.id)
        setUserRegistrations([...userRegistrations, selectedEvent.id])
      }
    } catch (err) {
      console.error("Failed to toggle registration:", err)
    } finally {
      setRegistering(false)
    }
  }

  const handleMessageOrganizer = () => {
    if (!selectedEvent) return
    
    // Get organizer info from event object
    const organizerId = selectedEvent.created_by
    if (organizerId) {
      router.push(`/dashboard/messages?userId=${organizerId}`)
      setShowDetailDialog(false)
    }
  }

  const formatPrice = (price: number, currency: string) => {
    if (!price) return "Free"
    if (currency === "NGN") {
      return `₦${price.toLocaleString()}`
    }
    return `$${price}`
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  function isUpcoming(eventDate: string) {
    return new Date(eventDate) > new Date()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
            <Calendar className="w-8 h-8" />
            Events
          </h1>
          <p className="text-muted-foreground">Discover and join events in your community</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVENT_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredEvents.length === 0 && !loadingEvents ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No events found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map((event) => {
            const isRegistered = userRegistrations.includes(event.id)
            return (
              <Card
                key={event.id}
                className="border-border/50 hover:border-primary/50 transition overflow-hidden cursor-pointer group"
              >
                <div className="relative h-40 bg-muted overflow-hidden">
                  <Image
                    src={event.image || "/placeholder.jpg"}
                    alt={event.title}
                    fill
                    className="object-cover group-hover:scale-110 transition"
                  />
                  {!isUpcoming(event.event_date) && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-semibold">Event Ended</span>
                    </div>
                  )}
                </div>

                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition">
                      {event.title}
                    </h3>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span className="line-clamp-1">{formatDate(event.event_date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{event.registration_count || 0} / {event.capacity} registered</span>
                    </div>
                  </div>

                  {isUpcoming(event.event_date) && (
                    <Button
                      className="w-full"
                      size="sm"
                      variant="default"
                      onClick={() => {
                        setSelectedEvent(event)
                        setShowDetailDialog(true)
                      }}
                    >
                      View Details
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {loadingEvents && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      <div ref={observerTarget} />

      {/* Event Detail Dialog with Payment Check */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
            <DialogDescription>View full event information</DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-6">
              {/* Image */}
              <div className="relative h-48 bg-muted rounded-lg overflow-hidden">
                <Image
                  src={selectedEvent.image || selectedEvent.thumbnail || "/placeholder.jpg"}
                  alt={selectedEvent.title}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Event Info */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold">{selectedEvent.title}</h2>
                  <p className="text-muted-foreground mt-2">{selectedEvent.description}</p>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm border-t border-border/50 pt-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(selectedEvent.event_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedEvent.location || "Location TBD"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{selectedEvent.registration_count || 0} / {selectedEvent.capacity || "Unlimited"} registered</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Close
            </Button>
            
            {/* Message Button */}
            {selectedEvent && selectedEvent.created_by && (
              <Button 
                className="gap-2 rounded-full gradient-bg"
                onClick={handleMessageOrganizer}
              >
                <MessageSquare className="w-4 h-4" />
                Message Organizer
              </Button>
            )}
            
            {/* Register Button */}
            {selectedEvent && isUpcoming(selectedEvent.event_date) && (
              <Button
                onClick={handleToggleRegistration}
                disabled={registering}
                variant={userRegistrations.includes(selectedEvent.id) ? "outline" : "default"}
              >
                {registering ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : userRegistrations.includes(selectedEvent.id) ? (
                  "Unregister"
                ) : (
                  "Register Now"
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Old Event Detail Dialog - REMOVED, replaced above */}
    </div>
  )
}
