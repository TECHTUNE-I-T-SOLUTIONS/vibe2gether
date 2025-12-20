"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Plus, Edit2, Trash2, Eye, EyeOff, Loader2, Search, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import { getEvents, deleteEvent, updateEvent } from "@/lib/supabase/queries"

export default function EventsAdminPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [editingEvent, setEditingEvent] = useState<any>(null)

  useEffect(() => {
    fetchEvents()
  }, [])

  async function fetchEvents() {
    try {
      setLoading(true)
      const { data, error } = await getEvents(100, 0)
      if (!error && data) {
        setEvents(data)
      }
    } catch (err) {
      console.error("Failed to fetch events:", err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(eventId: string) {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await deleteEvent(eventId)
        setEvents((prev) => prev.filter((e) => e.id !== eventId))
      } catch (err) {
        console.error("Failed to delete event:", err)
      }
    }
  }

  async function handleToggleAvailability(event: any) {
    try {
      await updateEvent(event.id, {
        is_cancelled: !event.is_cancelled,
      })
      setEvents((prev) =>
        prev.map((e) =>
          e.id === event.id ? { ...e, is_cancelled: !e.is_cancelled } : e
        )
      )
    } catch (err) {
      console.error("Failed to update event:", err)
    }
  }

  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Events Management</h1>
        <Button className="gradient-bg gap-2">
          <Plus className="w-4 h-4" />
          Create Event
        </Button>
      </div>

      {/* Search */}
      <Card className="border-border/50">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>All Events ({filteredEvents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEvents.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No events found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-4">Event</th>
                    <th className="text-left py-3 px-4">Organizer</th>
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Location</th>
                    <th className="text-left py-3 px-4">Registrations</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((event) => (
                    <tr key={event.id} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {event.image_url && (
                            <div className="relative w-10 h-10 rounded overflow-hidden">
                              <Image
                                src={event.image_url}
                                alt={event.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-sm">{event.title}</p>
                            <p className="text-xs text-muted-foreground">{event.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm">{event.user?.display_name}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(event.event_date)}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm">{event.location_name}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold">
                          {event.registered_count || 0}
                          {event.capacity ? `/${event.capacity}` : ""}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          className={
                            event.is_cancelled
                              ? "bg-red-500/20 text-red-600"
                              : "bg-green-500/20 text-green-600"
                          }
                        >
                          {event.is_cancelled ? "Cancelled" : "Active"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleAvailability(event)}
                            title={event.is_cancelled ? "Activate" : "Cancel"}
                          >
                            {event.is_cancelled ? (
                              <Eye className="w-4 h-4" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )}
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setEditingEvent(event)}>
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Event</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Title</Label>
                                  <Input
                                    value={editingEvent?.title || ""}
                                    onChange={(e) =>
                                      setEditingEvent({
                                        ...editingEvent,
                                        title: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <Label>Description</Label>
                                  <Textarea
                                    value={editingEvent?.description || ""}
                                    onChange={(e) =>
                                      setEditingEvent({
                                        ...editingEvent,
                                        description: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <Button
                                  className="w-full gradient-bg"
                                  onClick={async () => {
                                    await updateEvent(editingEvent.id, editingEvent)
                                    setEditingEvent(null)
                                    await fetchEvents()
                                  }}
                                >
                                  Save Changes
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(event.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
