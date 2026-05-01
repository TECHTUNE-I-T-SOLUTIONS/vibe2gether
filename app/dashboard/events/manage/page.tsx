"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { Loader2, Plus, Upload, Calendar, Clock, MapPin, Users, Trash2, LogOut, MessageCircle, Ticket, Eye, Search, Phone, Mail, Home } from "lucide-react"
import { useUserProfile } from "@/hooks/use-user-profile"
import { createClient } from "@/lib/supabase/client"

const CATEGORIES = [
  "Entertainment",
  "Music & Concerts",
  "Sports",
  "Food & Drink",
  "Networking",
  "Educational",
  "Conference",
  "Art & Culture",
  "Other",
]

export default function DashboardEventsManagePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { user } = useUserProfile()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<"my-events" | "registered" | "all">("all")
  const [events, setEvents] = useState<any[]>([])
  const [registrations, setRegistrations] = useState<any[]>([])
  const [allEvents, setAllEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showBuyDialog, setShowBuyDialog] = useState(false)
  const [showTicketsDialog, setShowTicketsDialog] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [eventTickets, setEventTickets] = useState<any[]>([])
  const [loadingTickets, setLoadingTickets] = useState(false)
  const [purchasing, setPurchasing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const verificationHandledRef = useRef(false)
  
  // Ticket Purchase Form
  const [ticketForm, setTicketForm] = useState({
    attendeeName: "",
    attendeeEmail: "",
    attendeePhone: "",
    attendeeAddress: ""
  })
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    eventDate: "",
    eventEndDate: "",
    location: "",
    capacity: "",
    isFree: true,
    ticketPrice: "",
    organizerName: "",
    organizerContact: "",
    tags: "",
  })
  const [thumbnail, setThumbnail] = useState<File | null>(null)

  const supabase = createClient()
  const isAdmin = user?.is_admin === true
  const USD_TO_NGN = 1450
  const USD_TO_XAF = 605
  const NGN_TO_USD = 1 / USD_TO_NGN
  const NGN_TO_XAF = USD_TO_XAF / USD_TO_NGN

  // Check authentication and redirect if not logged in
  useEffect(() => {
    if (session === undefined) {
      // Session is still loading
      return
    }

    if (!session?.user?.id) {
      // Not logged in, redirect to login
      router.push("/login")
      return
    }

    // User is authenticated, proceed with fetching data
    fetchUserEvents()
  }, [session])

  // Fetch based on active tab
  useEffect(() => {
    if (!session?.user?.id) return

    if (activeTab === "registered") {
      fetchRegisteredEvents()
    } else if (activeTab === "all") {
      fetchAllEvents()
    }
  }, [activeTab, session?.user?.id])

  useEffect(() => {
    if (!session?.user?.id) return
    fetchRegisteredEvents()
  }, [session?.user?.id])

  useEffect(() => {
    if (!session?.user?.id || verificationHandledRef.current) return

    const params = new URLSearchParams(window.location.search)
    const reference = params.get("reference") || params.get("trxref")

    if (!reference) return

    verificationHandledRef.current = true

    const verifyAndRefresh = async () => {
      try {
        const res = await fetch(`/api/payments/verify?reference=${encodeURIComponent(reference)}`)
        const data = await res.json()
        if (data?.success) {
          await fetchRegisteredEvents()
          await fetchAllEvents()
        }
      } catch (error) {
        console.error("Payment verification error:", error)
      } finally {
        router.replace("/dashboard/events/manage")
      }
    }

    verifyAndRefresh()
  }, [session?.user?.id, router])

  async function fetchUserEvents() {
    try {
      setLoading(true)
      if (!session?.user?.id) {
        setEvents([])
        return
      }
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("created_by", session.user.id)
        .order("event_date", { ascending: true })

      if (error) {
        console.error("Error fetching events:", error.message || error)
        throw error
      }
      const updatedEvents = await updatePastEvents(data || [])
      setEvents(updatedEvents)
    } catch (error: any) {
      console.error("Error fetching events:", error?.message || JSON.stringify(error) || "Unknown error")
      toast({ title: "Error", description: "Failed to load events", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  async function fetchRegisteredEvents() {
    try {
      if (!session?.user?.id) {
        setRegistrations([])
        return
      }
      const { data, error } = await supabase
        .from("event_registrations")
        .select(`
          *,
          event:events(*)
        `)
        .eq("user_id", session.user.id)
        .order("registered_at", { ascending: false })

      if (error) {
        console.error("Error fetching registrations:", error.message || error)
        throw error
      }
      const registrations = data || []
      const updatedEvents = await updatePastEvents(
        registrations.map((registration: any) => registration.event).filter(Boolean)
      )
      const updatedById = new Map(updatedEvents.map((event: any) => [event.id, event]))
      setRegistrations(
        registrations.map((registration: any) =>
          registration.event && updatedById.has(registration.event.id)
            ? { ...registration, event: updatedById.get(registration.event.id) }
            : registration
        )
      )
    } catch (error: any) {
      console.error("Error fetching registrations:", error?.message || JSON.stringify(error) || "Unknown error")
      toast({ title: "Error", description: "Failed to load registrations", variant: "destructive" })
    }
  }

  async function fetchAllEvents() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("events")
        .select("*, users:created_by(display_name, profile_picture, id)")
        .eq("status", "upcoming")
        .order("event_date", { ascending: true })

      if (error) {
        console.error("Error fetching all events:", error.message || error)
        throw error
      }
      const updatedEvents = await updatePastEvents(data || [])
      setAllEvents(updatedEvents)
    } catch (error: any) {
      console.error("Error fetching all events:", error?.message || JSON.stringify(error) || "Unknown error")
      toast({ title: "Error", description: "Failed to load events", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  async function updatePastEvents(list: any[]) {
    const now = new Date()
    const pastIds = list
      .filter((event) => event?.status === "upcoming" && event?.event_date && new Date(event.event_date) < now)
      .map((event) => event.id)

    if (pastIds.length === 0) return list

    const { error } = await supabase
      .from("events")
      .update({ status: "inactive" })
      .in("id", pastIds)

    if (error) {
      console.error("Error updating past events:", error.message || error)
      return list
    }

    return list.map((event) => (pastIds.includes(event.id) ? { ...event, status: "inactive" } : event))
  }

  async function handleThumbnailUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Error", description: "File size must be less than 5MB", variant: "destructive" })
        return
      }
      setThumbnail(file)
    }
  }

  async function uploadThumbnail(eventId: string): Promise<string | null> {
    if (!thumbnail) return null

    try {
      const fileExt = thumbnail.name.split(".").pop()
      const fileName = `${eventId}/thumbnail.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from("event-images")
        .upload(fileName, thumbnail)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from("event-images").getPublicUrl(fileName)
      return data.publicUrl
    } catch (error) {
      console.error("Error uploading thumbnail:", error)
      toast({ title: "Error", description: "Failed to upload thumbnail", variant: "destructive" })
      return null
    }
  }

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.title || !formData.category || !formData.eventDate) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" })
      return
    }

    if (!session?.user?.id) {
      toast({ title: "Error", description: "You must be logged in", variant: "destructive" })
      return
    }

    try {
      setUploading(true)

      // Create event
      const { data: newEvent, error: createError } = await supabase
        .from("events")
        .insert({
          created_by: session.user.id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          event_date: new Date(formData.eventDate).toISOString(),
          event_end_date: formData.eventEndDate ? new Date(formData.eventEndDate).toISOString() : null,
          location_name: formData.location,
          capacity: formData.capacity ? parseInt(formData.capacity) : null,
          is_free: formData.isFree,
          ticket_price: !formData.isFree ? parseFloat(formData.ticketPrice) : null,
          organizer_name: formData.organizerName,
          organizer_contact: formData.organizerContact,
          tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
          status: isAdmin ? "upcoming" : "pending", // Users start with pending (needs approval)
          thumbnail: null,
          media: [],
        })
        .select()
        .single()

      if (createError) throw createError

      // Upload thumbnail if provided
      if (thumbnail) {
        const thumbnailUrl = await uploadThumbnail(newEvent.id)
        if (thumbnailUrl) {
          const { error: updateError } = await supabase
            .from("events")
            .update({ thumbnail: thumbnailUrl })
            .eq("id", newEvent.id)

          if (updateError) throw updateError
        }
      }

      toast({
        title: "Success",
        description: isAdmin
          ? "Event created successfully"
          : "Event created! Awaiting admin approval.",
      })

      // Reset form
      setFormData({
        title: "",
        description: "",
        category: "",
        eventDate: "",
        eventEndDate: "",
        location: "",
        capacity: "",
        isFree: true,
        ticketPrice: "",
        organizerName: "",
        organizerContact: "",
        tags: "",
      })
      setThumbnail(null)
      setShowCreateDialog(false)
      fetchUserEvents()
    } catch (error) {
      console.error("Error creating event:", error)
      toast({ title: "Error", description: "Failed to create event", variant: "destructive" })
    } finally {
      setUploading(false)
    }
  }

  async function handleDeleteEvent(eventId: string) {
    if (!confirm("Are you sure you want to delete this event?")) return

    try {
      const { error } = await supabase.from("events").delete().eq("id", eventId)

      if (error) throw error

      toast({ title: "Success", description: "Event deleted" })
      fetchUserEvents()
    } catch (error) {
      console.error("Error deleting event:", error)
      toast({ title: "Error", description: "Failed to delete event", variant: "destructive" })
    }
  }

  async function handleUnregister(registrationId: string) {
    if (!confirm("There's no refund when you unregister, are you sure you want to unregister from this event?")) return

    try {
      const { error } = await supabase
        .from("event_registrations")
        .delete()
        .eq("id", registrationId)

      if (error) throw error

      toast({ title: "Success", description: "Unregistered from event" })
      fetchRegisteredEvents()
    } catch (error) {
      console.error("Error unregistering:", error)
      toast({ title: "Error", description: "Failed to unregister", variant: "destructive" })
    }
  }

  async function fetchEventTickets(eventId: string) {
    try {
      setLoadingTickets(true)
      const res = await fetch(`/api/events/${eventId}/tickets`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setEventTickets(data.tickets || [])
    } catch (error: any) {
      console.error("Error fetching tickets:", error)
      toast({ title: "Error", description: error.message || "Failed to load tickets", variant: "destructive" })
    } finally {
      setLoadingTickets(false)
    }
  }

  async function handlePurchaseTicket(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedEvent) return

    try {
      setPurchasing(true)
      if (selectedEvent.is_free || !selectedEvent.ticket_price) {
        const res = await fetch("/api/events/tickets/purchase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId: selectedEvent.id,
            ...ticketForm,
          }),
        })

        const data = await res.json()
        if (data.error) throw new Error(data.error)

        toast({
          title: "Success",
          description: "Ticket reserved successfully! Check your email for the ticket PDF.",
          duration: 5000,
        })

        setShowBuyDialog(false)
        setTicketForm({
          attendeeName: "",
          attendeeEmail: "",
          attendeePhone: "",
          attendeeAddress: "",
        })
        fetchRegisteredEvents()
        return
      }

      const res = await fetch("/api/events/initialize-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: ticketForm.attendeeEmail,
          fullName: ticketForm.attendeeName,
          eventId: selectedEvent.id,
          attendeeName: ticketForm.attendeeName,
          attendeeEmail: ticketForm.attendeeEmail,
          attendeePhone: ticketForm.attendeePhone,
          attendeeAddress: ticketForm.attendeeAddress,
        }),
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      if (data.isFree) {
        toast({
          title: "Success",
          description: "This is a free event. Ticket reserved successfully.",
        })
        setShowBuyDialog(false)
        fetchRegisteredEvents()
        return
      }

      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl
      }
    } catch (error: any) {
      console.error("Purchase error:", error)
      toast({ title: "Error", description: error.message || "Failed to purchase ticket", variant: "destructive" })
    } finally {
      setPurchasing(false)
    }
  }

  const totalSales = eventTickets.reduce((acc, t) => acc + Number(t.amount_paid || 0), 0)
  const totalFees = eventTickets.reduce((acc, t) => acc + Number(t.platform_fee || 0), 0)
  const totalPayout = eventTickets.reduce((acc, t) => acc + Number(t.payout_amount || 0), 0)

  return (
    <div className="min-h-screen w-full">
      {/* Main Content Area with proper padding */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold">Events</h1>
              <p className="text-muted-foreground mt-1">Create and manage your events</p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2 w-full sm:w-auto">
              <Plus className="w-4 h-4" />
              Create Event
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Events</TabsTrigger>
              <TabsTrigger value="my-events">My Events</TabsTrigger>
              <TabsTrigger value="registered">Registered</TabsTrigger>
            </TabsList>

            {/* My Events Tab */}
            <TabsContent value="my-events" className="space-y-6 mt-6">
              {loading ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : events.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16 px-4">
                    <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg mb-2">No events yet</h3>
                    <p className="text-muted-foreground text-center mb-6 max-w-sm">
                      Start by creating your first event
                    </p>
                    <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Create Your First Event
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events.map((event) => (
                    <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
                      {/* Event Thumbnail */}
                      <div className="relative w-full h-48 bg-muted">
                        {event.thumbnail ? (
                          <Image
                            src={event.thumbnail}
                            alt={event.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Calendar className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      <CardContent className="p-4 flex-1 flex flex-col">
                        <div className="space-y-3 flex-1">
                          <div>
                            <h3 className="font-semibold line-clamp-2 text-sm md:text-base">{event.title}</h3>
                            <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 mt-1">
                              {event.description || "No description"}
                            </p>
                          </div>

                          {/* Event Details */}
                          <div className="space-y-2 text-xs md:text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              {new Date(event.event_date).toLocaleDateString()}
                            </div>
                            {event.location_name && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="w-4 h-4" />
                                <span className="truncate">{event.location_name}</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-2 text-muted-foreground">
                                <Users className="w-4 h-4" />
                                {event.registered_count || 0}
                                {event.capacity && `/${event.capacity}`}
                              </span>
                              {event.is_free ? (
                                <Badge variant="outline" className="text-xs">Free</Badge>
                              ) : (
                                <div className="text-right">
                                  {(() => {
                                    const usd = Number(event.ticket_price) || 0
                                    const USD_TO_NGN = 1450
                                    const USD_TO_XAF = 605
                                    return (
                                      <>
                                        <Badge variant="outline" className="text-xs">${usd}</Badge>
                                        <div className="text-[10px] text-muted-foreground mt-1">
                                          NGN {Math.round(usd * USD_TO_NGN).toLocaleString()} • XAF {Math.round(usd * USD_TO_XAF).toLocaleString()}
                                        </div>
                                      </>
                                    )
                                  })()}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Badge
                              variant={event.status === "upcoming" ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {event.status === "upcoming"
                                ? "Upcoming"
                                : event.status === "inactive"
                                  ? "Past"
                                  : "Pending"}
                            </Badge>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setSelectedEvent(event)
                              fetchEventTickets(event.id)
                              setShowTicketsDialog(true)
                            }}
                            className="w-full gap-1 text-xs"
                          >
                            <Ticket className="w-3 h-3" />
                            View Tickets
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteEvent(event.id)}
                            className="w-full gap-1 text-xs text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Registered Events Tab */}
            <TabsContent value="registered" className="space-y-4 mt-6">
              {loading ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : registrations.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16 px-4">
                    <Users className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg">No registered events</h3>
                    <p className="text-muted-foreground text-center mt-2">
                      Find and register for events
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {registrations.map((reg) => (
                    <Card key={reg.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 sm:p-6">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-sm md:text-base">{reg.event?.title}</h3>
                              <p className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-2">
                                {reg.event?.description}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs whitespace-nowrap">
                              {reg.status}
                            </Badge>
                          </div>

                          {/* Event Info */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs md:text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {new Date(reg.event?.event_date).toLocaleDateString()}
                            </div>
                            {reg.event?.location_name && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span className="truncate">{reg.event.location_name}</span>
                              </div>
                            )}
                            {reg.event?.is_free ? (
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Free</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const usd = Number(reg.event?.ticket_price) || 0
                                  const USD_TO_NGN = 1450
                                  const USD_TO_XAF = 605
                                  return (
                                    <div>
                                      <span className="font-medium">${usd}</span>
                                      <div className="text-[10px] text-muted-foreground">
                                        NGN {Math.round(usd * USD_TO_NGN).toLocaleString()} • XAF {Math.round(usd * USD_TO_XAF).toLocaleString()}
                                      </div>
                                    </div>
                                  )
                                })()}
                              </div>
                            )}
                          </div>

                          <div className="text-xs text-muted-foreground">
                            Registered: {new Date(reg.registered_at).toLocaleDateString()}
                          </div>

                          <div>
                          <p className="text-xs md:text-sm text-muted-foreground mt-2">
                            Note: Unregistering from an event does not guarantee a refund, refunds are very unlikely for events tickets. Please check the event's refund policy or contact the organizer of the event. Vibe2gether is not liable or responsible for any refunds or cancellations, all sales/purchases are final.
                          </p>
                        </div>

                          {/* Unregister Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnregister(reg.id)}
                            className="w-full gap-1 text-xs"
                          >
                            <LogOut className="w-3 h-3" />
                            Unregister
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* All Events Tab */}
            <TabsContent value="all" className="space-y-6 mt-6">
              {loading ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : allEvents.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16 px-4">
                    <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg mb-2">No events available</h3>
                    <p className="text-muted-foreground text-center max-w-sm">
                      There are no upcoming events at the moment
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allEvents.map((event) => {
                    const isOwnEvent = event.created_by === session?.user?.id
                    const alreadyPurchased = registrations.some(
                      (reg) => (reg.event?.id || reg.event_id) === event.id
                    )
                    return (
                      <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
                        {/* Event Thumbnail */}
                        <div className="relative w-full h-48 bg-muted">
                          {event.thumbnail ? (
                            <Image
                              src={event.thumbnail}
                              alt={event.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Calendar className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        <CardContent className="p-4 flex-1 flex flex-col">
                          <div className="space-y-3 flex-1">
                            <div>
                              <h3 className="font-semibold line-clamp-2 text-sm md:text-base">{event.title}</h3>
                              <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 mt-1">
                                {event.description || "No description"}
                              </p>
                              <p className="text-xs md:text-sm text-muted-foreground mt-2">
                                By: {event.users?.display_name || "Unknown Organizer"}
                              </p>
                            </div>

                            {/* Event Details */}
                            <div className="space-y-2 text-xs md:text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                {new Date(event.event_date).toLocaleDateString()}
                              </div>
                              {event.location_name && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <MapPin className="w-4 h-4" />
                                  <span className="truncate">{event.location_name}</span>
                                </div>
                              )}
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-muted-foreground">
                                  <Users className="w-4 h-4" />
                                  {event.registered_count || 0}
                                  {event.capacity && `/${event.capacity}`}
                                </span>
                                {event.is_free ? (
                                  <Badge variant="outline" className="text-xs">Free</Badge>
                                ) : (
                                  <div className="text-right">
                                    {(() => {
                                      const usd = Number(event.ticket_price) || 0
                                      const USD_TO_NGN = 1450
                                      const USD_TO_XAF = 605
                                      return (
                                        <>
                                          <Badge variant="outline" className="text-xs">${usd}</Badge>
                                          <div className="text-[10px] text-muted-foreground mt-1">
                                            NGN {Math.round(usd * USD_TO_NGN).toLocaleString()} • XAF {Math.round(usd * USD_TO_XAF).toLocaleString()}
                                          </div>
                                        </>
                                      )
                                    })()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          {isOwnEvent ? (
                            <Button disabled className="w-full gap-1 text-xs mt-3 opacity-50">
                              Your Event
                            </Button>
                          ) : (
                            <div className="flex gap-2 mt-3">
                              <Button 
                                variant="outline"
                                className="flex-1 gap-1 text-xs"
                                onClick={() => {
                                  setSelectedEvent(event)
                                  setShowDetailDialog(true)
                                }}
                              >
                                <Eye className="w-3 h-3" />
                                Details
                              </Button>
                              <Button 
                                className="flex-1 gap-1 text-xs gradient-bg"
                                disabled={alreadyPurchased}
                                onClick={() => {
                                  if (alreadyPurchased) return
                                  setSelectedEvent(event)
                                  setTicketForm(prev => ({
                                    ...prev,
                                    attendeeName: user?.display_name || "",
                                    attendeeEmail: session?.user?.email || ""
                                  }))
                                  setShowBuyDialog(true)
                                }}
                              >
                                <Ticket className="w-3 h-3" />
                                {alreadyPurchased ? "Already Purchased" : "Get Ticket"}
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Create Event Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
            <DialogDescription>
              {isAdmin ? "Your event will be listed immediately." : "Your event will be pending admin approval before being visible."}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[calc(90vh-200px)]">
            <form onSubmit={handleCreateEvent} className="space-y-4 pr-4">
              {/* Basic Info */}
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Summer Music Festival"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your event in detail..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger id="category" className="text-sm">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date & Time */}
              <div className="space-y-2">
                <Label htmlFor="eventDate">Start Date & Time *</Label>
                <Input
                  id="eventDate"
                  type="datetime-local"
                  value={formData.eventDate}
                  onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventEndDate">End Date & Time</Label>
                <Input
                  id="eventEndDate"
                  type="datetime-local"
                  value={formData.eventEndDate}
                  onChange={(e) => setFormData({ ...formData, eventEndDate: e.target.value })}
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Event location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              {/* Capacity */}
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity (Leave empty for unlimited)</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  placeholder="e.g., 100"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                />
              </div>

              {/* Pricing */}
              <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isFree"
                    checked={formData.isFree}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isFree: checked as boolean })
                    }
                  />
                  <Label htmlFor="isFree" className="font-medium cursor-pointer">
                    Free Event
                  </Label>
                </div>

                {!formData.isFree && (
                  <div className="space-y-2">
                    <Label htmlFor="ticketPrice">Ticket Price ($) *</Label>
                    <Input
                      id="ticketPrice"
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      value={formData.ticketPrice}
                      onChange={(e) => setFormData({ ...formData, ticketPrice: e.target.value })}
                      required={!formData.isFree}
                    />
                  </div>
                )}
              </div>

              {/* Organizer Info */}
              <div className="space-y-2">
                <Label htmlFor="organizerName">Organizer Name</Label>
                <Input
                  id="organizerName"
                  placeholder="Your name or organization"
                  value={formData.organizerName}
                  onChange={(e) => setFormData({ ...formData, organizerName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organizerContact">Contact Information</Label>
                <Input
                  id="organizerContact"
                  placeholder="Email or phone number"
                  value={formData.organizerContact}
                  onChange={(e) => setFormData({ ...formData, organizerContact: e.target.value })}
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  placeholder="e.g., music, festival, summer"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                />
              </div>

              {/* Thumbnail */}
              <div className="space-y-2">
                <Label>Event Thumbnail</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
                    className="hidden"
                    id="thumbnail-upload"
                  />
                  <label htmlFor="thumbnail-upload" className="cursor-pointer block">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">Click to upload thumbnail</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                  </label>
                </div>
                {thumbnail && (
                  <div className="space-y-2">
                    <div className="w-full aspect-video rounded-lg overflow-hidden bg-muted border border-border">
                      <img 
                        src={URL.createObjectURL(thumbnail)} 
                        alt="Thumbnail preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      ✓ {thumbnail.name}
                    </p>
                  </div>
                )}
              </div>
            </form>
          </ScrollArea>

          <DialogFooter className="pt-4 gap-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateEvent} disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-xl sm:max-w-2xl max-h-[85vh] overflow-y-auto p-4 sm:p-6">
          {selectedEvent && (
            <div className="space-y-3 sm:space-y-4">
              <DialogHeader className="space-y-1">
                <DialogTitle className="text-base sm:text-lg">{selectedEvent.title}</DialogTitle>
              </DialogHeader>
              
              {selectedEvent.thumbnail && (
                <div className="w-full aspect-[16/8] sm:aspect-video rounded-lg overflow-hidden bg-muted">
                  <img
                    src={selectedEvent.thumbnail}
                    alt={selectedEvent.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Date</label>
                  <p className="text-sm sm:text-base font-semibold">
                    {selectedEvent.event_date ? new Date(selectedEvent.event_date).toLocaleDateString() : "Not specified"}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Price</label>
                  <div className="space-y-0.5">
                    {selectedEvent.is_free ? (
                      <p className="text-sm sm:text-base font-semibold">Free</p>
                    ) : (
                      <>
                        {(() => {
                          const usd = Number(selectedEvent.ticket_price) || 0
                          const USD_TO_NGN = 1450 // $1 = N1450 (update as needed)
                          const USD_TO_XAF = 605 // $1 = XAF605 (Central African CFA franc) — update as needed
                          return (
                            <>
                              <p className="text-sm sm:text-base font-semibold">${usd}</p>
                              <p className="text-xs text-muted-foreground">₦{Math.round(usd * USD_TO_NGN).toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground">XAF {Math.round(usd * USD_TO_XAF).toLocaleString()}</p>
                            </>
                          )
                        })()}
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Location</label>
                <p className="mt-1 text-sm sm:text-base">{selectedEvent.location_name || selectedEvent.location || "Not specified"}</p>
                {(selectedEvent.latitude || selectedEvent.longitude) && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedEvent.latitude ?? "-"}, {selectedEvent.longitude ?? "-"}
                  </p>
                )}
              </div>
              
              <div>
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <p className="mt-1 text-sm sm:text-base">{selectedEvent.description}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Capacity</label>
                  <p className="text-sm sm:text-base font-semibold">{selectedEvent.capacity || "Unlimited"}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Organizer</label>
                  <p className="text-sm sm:text-base font-semibold">{selectedEvent.organizer_name || selectedEvent.users?.display_name || "Unknown"}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Category</label>
                  <p className="text-sm sm:text-base font-semibold">{selectedEvent.category || "Not specified"}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Status</label>
                  <p className="text-sm sm:text-base font-semibold">{selectedEvent.status || "Not specified"}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Start</label>
                  <p className="text-sm sm:text-base font-semibold">
                    {selectedEvent.event_date ? new Date(selectedEvent.event_date).toLocaleString() : "Not specified"}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">End</label>
                  <p className="text-sm sm:text-base font-semibold">
                    {selectedEvent.event_end_date ? new Date(selectedEvent.event_end_date).toLocaleString() : "Not specified"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Organizer Contact</label>
                  <p className="text-sm sm:text-base font-semibold break-words">{selectedEvent.organizer_contact || "Not specified"}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Tags</label>
                  <p className="text-sm sm:text-base font-semibold break-words">
                    {Array.isArray(selectedEvent.tags)
                      ? selectedEvent.tags.join(", ")
                      : selectedEvent.tags || "Not specified"}
                  </p>
                </div>
              </div>
              
              <DialogFooter className="pt-2 gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowDetailDialog(false)}>
                  Close
                </Button>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => {
                  if (selectedEvent && selectedEvent.users?.id) {
                    window.location.href = `/dashboard/messages?userId=${selectedEvent.users.id}`
                  }
                }}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message Organizer
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Buy Ticket Dialog */}
      <Dialog open={showBuyDialog} onOpenChange={setShowBuyDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedEvent && (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle>Get Ticket: {selectedEvent.title}</DialogTitle>
                <DialogDescription>
                  Complete the form below to secure your spot.
                </DialogDescription>
              </DialogHeader>

              <div className="relative w-full h-40 rounded-xl overflow-hidden bg-muted">
                {selectedEvent.thumbnail ? (
                  <Image src={selectedEvent.thumbnail} alt={selectedEvent.title} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Calendar className="w-12 h-12 text-muted-foreground" /></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
                  <h4 className="text-white font-bold truncate">{selectedEvent.title}</h4>
                  <p className="text-white/80 text-xs flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {new Date(selectedEvent.event_date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <form onSubmit={handlePurchaseTicket} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="attendeeName">Full Name *</Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        id="attendeeName" 
                        className="pl-10" 
                        placeholder="FLAMMAH" 
                        value={ticketForm.attendeeName}
                        onChange={e => setTicketForm({...ticketForm, attendeeName: e.target.value})}
                        required 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="attendeeEmail">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        id="attendeeEmail" 
                        type="email" 
                        className="pl-10" 
                        placeholder="your@email.com" 
                        value={ticketForm.attendeeEmail}
                        onChange={e => setTicketForm({...ticketForm, attendeeEmail: e.target.value})}
                        required 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="attendeePhone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="attendeePhone" 
                          className="pl-10" 
                          placeholder="+234..." 
                          value={ticketForm.attendeePhone}
                          onChange={e => setTicketForm({...ticketForm, attendeePhone: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="attendeeAddress">Address</Label>
                      <div className="relative">
                        <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="attendeeAddress" 
                          className="pl-10" 
                          placeholder="Lagos, Nigeria" 
                          value={ticketForm.attendeeAddress}
                          onChange={e => setTicketForm({...ticketForm, attendeeAddress: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-xl space-y-2 border border-border/50">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Ticket Price</span>
                    <span className="font-bold">{selectedEvent.is_free ? "FREE" : `$${selectedEvent.ticket_price}`}</span>
                  </div>
                  {!selectedEvent.is_free && (
                    <div className="text-xs text-muted-foreground">
                      {(() => {
                        const usd = Number(selectedEvent.ticket_price) || 0
                        const USD_TO_NGN = 1450
                        const USD_TO_XAF = 605
                        return (
                          <span>
                            NGN {Math.round(usd * USD_TO_NGN).toLocaleString()} • XAF {Math.round(usd * USD_TO_XAF).toLocaleString()}
                          </span>
                        )
                      })()}
                    </div>
                  )}
                  <div className="flex justify-between items-center text-lg font-black border-t border-border/50 pt-2">
                    <span>Total Amount</span>
                    <span className="text-primary">{selectedEvent.is_free ? "FREE" : `$${selectedEvent.ticket_price}`}</span>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Note: By purchasing this ticket, you agree to the event's terms and conditions. Please review the event details and refund policy or contact the organizer before completing your purchase. Vibe2gether is not responsible for any refunds or cancellations, all sales are final.
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 rounded-xl gradient-bg text-lg font-bold shadow-lg" disabled={purchasing}>
                  {purchasing ? <Loader2 className="w-5 h-5 animate-spin" /> : (selectedEvent.is_free ? "Get Free Ticket" : "Pay & Get Ticket")}
                </Button>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Manage Tickets Dialog */}
      <Dialog open={showTicketsDialog} onOpenChange={setShowTicketsDialog}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-3xl lg:max-w-5xl xl:max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ticket Sales Management</DialogTitle>
            <DialogDescription>
              Monitor ticket purchases and revenue for your event.
            </DialogDescription>
          </DialogHeader>

          {loadingTickets ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading ticket data...</p>
            </div>
          ) : eventTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <Ticket className="w-16 h-16 text-muted-foreground/30" />
              <h3 className="text-xl font-bold">No tickets sold yet</h3>
              <p className="text-muted-foreground max-w-xs">Share your event to start getting attendees!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Sales</p>
                  <p className="text-2xl font-black text-primary">₦{totalSales.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    ${ (totalSales * NGN_TO_USD).toFixed(2) } • XAF {Math.round(totalSales * NGN_TO_XAF).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Platform Fee (3%)</p>
                  <p className="text-2xl font-black text-orange-600">-₦{totalFees.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    -${ (totalFees * NGN_TO_USD).toFixed(2) } • XAF {Math.round(totalFees * NGN_TO_XAF).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-green-500/5 border border-green-500/10">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Net Payout</p>
                  <p className="text-2xl font-black text-green-600">₦{totalPayout.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    ${ (totalPayout * NGN_TO_USD).toFixed(2) } • XAF {Math.round(totalPayout * NGN_TO_XAF).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Tickets Table (Desktop) */}
              <div className="hidden lg:block rounded-2xl border border-border/50 overflow-hidden bg-muted/20">
                <div className="overflow-x-hidden">
                  <table className="w-full table-fixed text-sm text-left">
                    <thead className="bg-muted text-muted-foreground uppercase text-[10px] font-bold">
                      <tr>
                        <th className="px-3 py-3 w-[20%]">Attendee</th>
                        <th className="px-3 py-3 w-[30%]">Contact</th>
                        <th className="px-3 py-3 w-[18%]">Amount</th>
                        <th className="px-3 py-3 w-[18%]">Net Payout</th>
                        <th className="px-3 py-3 w-[14%] text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {eventTickets.map((ticket) => (
                        <tr key={ticket.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-3 py-3 align-top">
                            <p className="font-bold">{ticket.attendee_name}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{ticket.barcode}</p>
                          </td>
                          <td className="px-3 py-3 align-top">
                            <p className="flex items-start gap-1 break-words">
                              <Mail className="w-3 h-3 mt-0.5" />
                              <span className="break-all text-xs">{ticket.attendee_email}</span>
                            </p>
                            {ticket.attendee_phone && (
                              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="w-3 h-3" /> {ticket.attendee_phone}
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-3 align-top font-medium">
                            ₦{Number(ticket.amount_paid).toFixed(2)}
                            <p className="text-[11px] text-muted-foreground leading-snug">
                              ${(Number(ticket.amount_paid) * NGN_TO_USD).toFixed(2)} • XAF {Math.round(Number(ticket.amount_paid) * NGN_TO_XAF).toLocaleString()}
                            </p>
                          </td>
                          <td className="px-3 py-3 align-top text-green-600 font-bold">
                            ₦{Number(ticket.payout_amount).toFixed(2)}
                            <p className="text-[11px] text-muted-foreground leading-snug">
                              ${(Number(ticket.payout_amount) * NGN_TO_USD).toFixed(2)} • XAF {Math.round(Number(ticket.payout_amount) * NGN_TO_XAF).toLocaleString()}
                            </p>
                          </td>
                          <td className="px-3 py-3 text-right text-muted-foreground text-xs align-top whitespace-nowrap">
                            {new Date(ticket.created_at).toLocaleDateString()}<br/>
                            {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tickets Cards (Mobile/Tablet) */}
              <div className="lg:hidden space-y-3">
                {eventTickets.map((ticket) => (
                  <div key={ticket.id} className="rounded-2xl border border-border/50 bg-muted/20 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold">{ticket.attendee_name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{ticket.barcode}</p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <div>{new Date(ticket.created_at).toLocaleDateString()}</div>
                        <div>{new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>

                    <div className="mt-3 space-y-1 text-sm">
                      <p className="flex items-center gap-2"><Mail className="w-3 h-3" /> {ticket.attendee_email}</p>
                      {ticket.attendee_phone && <p className="flex items-center gap-2 text-xs text-muted-foreground"><Phone className="w-3 h-3" /> {ticket.attendee_phone}</p>}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Amount</p>
                        <p className="font-semibold">₦{Number(ticket.amount_paid).toFixed(2)}</p>
                        <p className="text-[11px] text-muted-foreground">
                          ${(Number(ticket.amount_paid) * NGN_TO_USD).toFixed(2)} • XAF {Math.round(Number(ticket.amount_paid) * NGN_TO_XAF).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Net Payout</p>
                        <p className="font-semibold text-green-600">₦{Number(ticket.payout_amount).toFixed(2)}</p>
                        <p className="text-[11px] text-muted-foreground">
                          ${(Number(ticket.payout_amount) * NGN_TO_USD).toFixed(2)} • XAF {Math.round(Number(ticket.payout_amount) * NGN_TO_XAF).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}