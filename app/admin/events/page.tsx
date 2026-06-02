"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import Image from "next/image"
import { Plus, Edit2, Trash2, Loader2, CheckCircle, XCircle, Upload, X, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import AdminEventEditModal from "@/components/admin-event-edit-modal"

export default function EventsAdminPage() {
  const router = useRouter()
  const { admin, loading: authLoading, isAuthenticated } = useAdminAuth()
  const { toast } = useToast()
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState<"admin" | "pending" | "all">("admin")
  const [adminEvents, setAdminEvents] = useState<any[]>([])
  const [pendingEvents, setPendingEvents] = useState<any[]>([])
  const [allEvents, setAllEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [creatingEvent, setCreatingEvent] = useState(false)
  const [creatingEventLoading, setCreatingEventLoading] = useState(false)
  const [editingEventLoading, setEditingEventLoading] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [statusEvent, setStatusEvent] = useState<any>(null)
  const [newStatus, setNewStatus] = useState("upcoming")
  const [activationDialogOpen, setActivationDialogOpen] = useState(false)
  const [activationEvent, setActivationEvent] = useState<any>(null)
  const [activatingLoading, setActivatingLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    category: "",
    eventDate: "",
    eventEndDate: "",
    location: "",
    capacity: "",
    is_free: true,
    ticketPrice: "",
    organizer_name: "",
    organizer_contact: "",
    tags: "",
    thumbnail: null as File | null,
    thumbnailPreview: null as string | null,
  })

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/admin/login")
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchAllData()
    }
  }, [authLoading, isAuthenticated])

  async function fetchAllData() {
    try {
      setLoading(true)
      const { data: adminEventsData } = await supabase
        .from("events")
        .select("*")
        .eq("created_by", admin?.id)
        .neq("status", "rejected")
        .order("event_date", { ascending: true })

      const { data: pending } = await supabase
        .from("events")
        .select("*")
        .eq("status", "pending")
        .order("event_date", { ascending: true })

      const { data: all } = await supabase
        .from("events")
        .select("*")
        .neq("status", "rejected")
        .order("event_date", { ascending: true })

      const updatedAdminEvents = await updatePastEvents(adminEventsData || [])
      const updatedAllEvents = await updatePastEvents(all || [])

      setAdminEvents(updatedAdminEvents)
      setPendingEvents(pending || [])
      setAllEvents(updatedAllEvents)
    } catch (error: any) {
      console.error("Error fetching events:", error?.message || JSON.stringify(error))
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setNewEvent((prev) => ({
          ...prev,
          thumbnail: file,
          thumbnailPreview: reader.result as string,
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  async function uploadThumbnail(eventId: string, file: File) {
    const fileExt = file.name.split(".").pop()
    const fileName = `${eventId}-${Date.now()}.${fileExt}`
    const { data, error } = await supabase.storage.from("event-images").upload(fileName, file)

    if (error) throw error
    const { data: publicUrl } = supabase.storage.from("event-images").getPublicUrl(fileName)
    return publicUrl.publicUrl
  }

  async function handleCreateEvent() {
    if (!newEvent.title || !newEvent.eventDate || !newEvent.location) {
      toast({
        title: "Validation Error",
        description: "Please fill in title, date, and location",
        variant: "destructive",
      })
      return
    }

    try {
      setCreatingEventLoading(true)
      const { data: event, error: insertError } = await supabase
        .from("events")
        .insert({
          created_by: admin?.id,
          title: newEvent.title,
          description: newEvent.description,
          category: newEvent.category,
          event_date: newEvent.eventDate,
          event_end_date: newEvent.eventEndDate,
          location_name: newEvent.location,
          capacity: newEvent.capacity ? parseInt(newEvent.capacity) : null,
          is_free: newEvent.is_free,
          ticket_price: !newEvent.is_free ? parseFloat((parseFloat(newEvent.ticketPrice) / 1450).toFixed(2)) : null,
          organizer_name: newEvent.organizer_name,
          organizer_contact: newEvent.organizer_contact,
          tags: newEvent.tags.split(",").map((t) => t.trim()),
          status: "upcoming", // Admin events are directly upcoming
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Upload thumbnail if provided
      if (newEvent.thumbnail) {
        const thumbnailUrl = await uploadThumbnail(event.id, newEvent.thumbnail)
        await supabase
          .from("events")
          .update({ thumbnail: thumbnailUrl })
          .eq("id", event.id)
      }

      toast({
        title: "Success",
        description: "Event created successfully",
      })

      setNewEvent({
        title: "",
        description: "",
        category: "",
        eventDate: "",
        eventEndDate: "",
        location: "",
        capacity: "",
        is_free: true,
        ticketPrice: "",
        organizer_name: "",
        organizer_contact: "",
        tags: "",
        thumbnail: null,
        thumbnailPreview: null,
      })
      setCreatingEvent(false)
      await fetchAllData()
    } catch (error: any) {
      console.error("Error creating event:", error?.message || JSON.stringify(error))
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive",
      })
    } finally {
      setCreatingEventLoading(false)
    }
  }

  async function handleEditEvent(edited?: any) {
    const target = edited ?? editingEvent

    if (!target?.title || !target?.event_date || !(target?.location || target?.location_name)) {
      toast({
        title: "Validation Error",
        description: "Please fill in title, date, and location",
        variant: "destructive",
      })
      return
    }

    setEditingEventLoading(true)

    try {
      let thumbnailUrl = target.thumbnail || target.thumbnail_url
      if (target.newThumbnail) {
        thumbnailUrl = await uploadThumbnail(target.id, target.newThumbnail)
      }

      const { error } = await supabase
        .from("events")
        .update({
          title: target.title,
          description: target.description,
          category: target.category,
          event_date: target.event_date,
          event_end_date: target.event_end_date,
          location_name: target.location || target.location_name,
          capacity: target.capacity ? parseInt(target.capacity) : null,
          is_free: target.is_free,
          ticket_price: !target.is_free ? parseFloat((parseFloat(target.ticket_price) / 1450).toFixed(2)) : null,
          organizer_name: target.organizer_name,
          organizer_contact: target.organizer_contact,
          tags: Array.isArray(target?.tags) ? target.tags : (typeof target.tags === "string" ? target.tags.split(",").map((t: string) => t.trim()) : []),
          thumbnail: thumbnailUrl,
        })
        .eq("id", target.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Event updated successfully",
      })

      setEditingEvent(null)
      await fetchAllData()
    } catch (error: any) {
      console.error("Error updating event:", error?.message || JSON.stringify(error))
      toast({
        title: "Error",
        description: "Failed to update event",
        variant: "destructive",
      })
    } finally {
      setEditingEventLoading(false)
    }
  }

  async function handleDeleteEvent(eventId: string) {
    if (!window.confirm("Are you sure you want to delete this event?")) return

    try {
      await supabase.from("events").delete().eq("id", eventId)

      toast({
        title: "Success",
        description: "Event deleted successfully",
      })

      await fetchAllData()
    } catch (error: any) {
      console.error("Error deleting event:", error?.message || JSON.stringify(error))
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      })
    }
  }

  async function handleActivateEvent() {
    if (!activationEvent) return
    setActivatingLoading(true)

    try {
      await supabase
        .from("events")
        .update({ status: "upcoming" })
        .eq("id", activationEvent.id)

      toast({
        title: "Success",
        description: "Event activated successfully",
      })

      setActivationDialogOpen(false)
      setActivationEvent(null)
      await fetchAllData()
    } catch (error: any) {
      console.error("Error activating event:", error?.message || JSON.stringify(error))
      toast({
        title: "Error",
        description: "Failed to activate event",
        variant: "destructive",
      })
    } finally {
      setActivatingLoading(false)
    }
  }

  async function handleStatusUpdate() {
    if (!statusEvent) return

    try {
      await supabase
        .from("events")
        .update({ status: newStatus })
        .eq("id", statusEvent.id)

      toast({
        title: "Success",
        description: `Event ${newStatus === "upcoming" ? "approved" : "rejected"} successfully`,
      })

      setStatusDialogOpen(false)
      setStatusEvent(null)
      await fetchAllData()
    } catch (error: any) {
      console.error("Error updating status:", error?.message || JSON.stringify(error))
      toast({
        title: "Error",
        description: "Failed to update event status",
        variant: "destructive",
      })
    }
  }

  // Show loading while authentication is being determined
  if (authLoading) {
    return (
      <>
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>

        <AdminEventEditModal
          open={!!editingEvent}
          event={editingEvent}
          loading={editingEventLoading}
          onOpenChange={(open) => {
            if (!open) setEditingEvent(null)
          }}
          onSave={(edited: any) => handleEditEvent(edited)}
        />
      </>
    )
  }

  // Show loading while data is being fetched
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const EventCard = ({ event, showStatusButton = false }: { event: any; showStatusButton?: boolean }) => {
    // Use thumbnail field from database (direct URL)
    const thumbnailUrl = event.thumbnail || event.thumbnail_url
    const soldOut = Boolean(event.capacity && (event.registered_count || 0) >= event.capacity)

    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative h-48 bg-muted">
          {thumbnailUrl ? (
            <Image loading="eager" src={thumbnailUrl} alt={event.title} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">No thumbnail</div>
          )}
          <Badge className="absolute top-2 right-2">{event.category}</Badge>
        </div>
        <CardContent className="pt-4">
          <h3 className="font-semibold line-clamp-2 mb-2">{event.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{event.description}</p>
          <div className="flex items-center gap-2 mb-2 text-sm">
            <Calendar className="w-4 h-4" />
            {formatDate(event.event_date)}
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Capacity: {event.registered_count || 0}{event.capacity ? `/${event.capacity}` : " / Unlimited"}
          </p>
          <p className="text-sm text-muted-foreground mb-3">📍 {event.location_name || event.location}</p>
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              {event.is_free ? (
                <span className="font-semibold">Free</span>
              ) : (
                <>
                  {(() => {
                    const usd = Number(event.ticket_price) || 0
                    const USD_TO_NGN = 1450
                    const USD_TO_XAF = 605
                    return (
                      <>
                        <span className="font-semibold">₦{Math.round(usd * USD_TO_NGN).toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground">${usd} • XAF {Math.round(usd * USD_TO_XAF).toLocaleString()}</span>
                      </>
                    )
                  })()}
                </>
              )}
            </div>
            <Badge
              variant="secondary"
              className={
                event.status === "upcoming"
                  ? "bg-green-500/20 text-green-600"
                  : event.status === "inactive"
                    ? "bg-yellow-500/20 text-yellow-600"
                    : "bg-red-500/20 text-red-600"
              }
            >
              {soldOut ? "sold out" : event.status}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setEditingEvent({ ...event, location: event.location_name, newThumbnail: null, thumbnailPreview: null })}
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="flex-1"
              onClick={() => handleDeleteEvent(event.id)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            {event.status === "inactive" && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setActivationEvent(event)
                  setActivationDialogOpen(true)
                }}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Activate
              </Button>
            )}
            {showStatusButton && (
              <Dialog open={statusDialogOpen && statusEvent?.id === event.id} onOpenChange={setStatusDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setStatusEvent(event)
                      setNewStatus(event.status === "pending" ? "upcoming" : "rejected")
                    }}
                  >
                    {event.status === "pending" ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Update Event Status</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>New Status</Label>
                      <select
                        title="Select new status"
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      >
                        <option value="upcoming">Approve (Upcoming)</option>
                        <option value="pending">Keep Pending</option>
                        <option value="rejected">Reject</option>
                      </select>
                    </div>
                    <Button className="w-full gradient-bg" onClick={handleStatusUpdate}>
                      Update Status
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardContent>
      </Card>
    )
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

  return (
    <div className="space-y-6">
      <AdminEventEditModal
        open={!!editingEvent}
        event={editingEvent}
        loading={editingEventLoading}
        onOpenChange={(open) => {
          if (!open) setEditingEvent(null)
        }}
        onSave={(edited: any) => handleEditEvent(edited)}
      />
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Events Admin</h1>
        <Dialog open={creatingEvent} onOpenChange={setCreatingEvent}>
          <DialogTrigger asChild>
            <Button className="gradient-bg gap-2">
              <Plus className="w-4 h-4" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
              <DialogDescription>Admin events are directly published as upcoming</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input
                  placeholder="Event title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="Event description"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Input
                    placeholder="Category"
                    value={newEvent.category}
                    onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Location *</Label>
                  <Input
                    placeholder="Location"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Event Date *</Label>
                  <Input
                    type="datetime-local"
                    value={newEvent.eventDate}
                    onChange={(e) => setNewEvent({ ...newEvent, eventDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Event End Date</Label>
                  <Input
                    type="datetime-local"
                    value={newEvent.eventEndDate}
                    onChange={(e) => setNewEvent({ ...newEvent, eventEndDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Capacity</Label>
                  <Input
                    type="number"
                    placeholder="Max attendees"
                    value={newEvent.capacity}
                    onChange={(e) => setNewEvent({ ...newEvent, capacity: e.target.value })}
                  />
                </div>
                <div>
                  <Label>
                    <input
                      type="checkbox"
                      checked={newEvent.is_free}
                      onChange={(e) => setNewEvent({ ...newEvent, is_free: e.target.checked })}
                      className="mr-2"
                    />
                    Free Event
                  </Label>
                </div>
              </div>
              {!newEvent.is_free && (
                <div>
                  <Label>Ticket Price (₦)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newEvent.ticketPrice}
                    onChange={(e) => setNewEvent({ ...newEvent, ticketPrice: e.target.value })}
                  />
                  {newEvent.ticketPrice && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Equivalent: ${(parseFloat(newEvent.ticketPrice) / 1450).toFixed(2)}
                    </p>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Organizer Name</Label>
                  <Input
                    placeholder="Organizer name"
                    value={newEvent.organizer_name}
                    onChange={(e) => setNewEvent({ ...newEvent, organizer_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Organizer Contact</Label>
                  <Input
                    placeholder="Email or phone"
                    value={newEvent.organizer_contact}
                    onChange={(e) => setNewEvent({ ...newEvent, organizer_contact: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Tags (comma separated)</Label>
                <Input
                  placeholder="tag1, tag2, tag3"
                  value={newEvent.tags}
                  onChange={(e) => setNewEvent({ ...newEvent, tags: e.target.value })}
                />
              </div>
              <div>
                <Label>Thumbnail</Label>
                {newEvent.thumbnailPreview && (
                  <div className="mb-2 relative w-32 h-24">
                    <Image
                      src={newEvent.thumbnailPreview}
                      alt="Preview"
                      fill
                      className="object-cover rounded"
                    />
                    <button
                      onClick={() => setNewEvent({ ...newEvent, thumbnail: null, thumbnailPreview: null })}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Select Thumbnail
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleThumbnailSelect}
                />
              </div>
              <Button className="w-full gradient-bg" onClick={handleCreateEvent} disabled={creatingEventLoading}>
                {creatingEventLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Event"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="admin">
            Admin Events ({adminEvents.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending Approvals ({pendingEvents.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All Events ({allEvents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="admin" className="space-y-4">
          {adminEvents.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No admin events yet. Create one to get started!
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {adminEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingEvents.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No pending events to review
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingEvents.map((event) => (
                <EventCard key={event.id} event={event} showStatusButton={true} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {allEvents.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No events available
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Activation Confirmation Dialog */}
      <Dialog open={activationDialogOpen} onOpenChange={setActivationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activate Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to activate this event? It will be marked as upcoming and visible to users.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setActivationDialogOpen(false)
                setActivationEvent(null)
              }}
              disabled={activatingLoading}
            >
              Cancel
            </Button>
            <Button
              className="gradient-bg"
              onClick={handleActivateEvent}
              disabled={activatingLoading}
            >
              {activatingLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Activating...
                </>
              ) : (
                "Activate Event"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
