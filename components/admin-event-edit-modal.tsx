"use client"

import React, { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Upload, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: any | null
  onSave?: (edited: any) => Promise<void>
  loading?: boolean
}

export default function AdminEventEditModal({ open, onOpenChange, event, onSave, loading }: Props) {
  const { toast } = useToast()
  const [local, setLocal] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Initialize local form when event changes
  useEffect(() => {
    if (!event) {
      setLocal(null)
      return
    }

    setLocal({
      ...event,
      ticket_price: event.ticket_price ? String(Math.round(event.ticket_price * 1450)) : "",
      location: event.location_name ?? event.location,
      tags: Array.isArray(event.tags) ? event.tags.join(", ") : event.tags ?? "",
      newThumbnail: null,
      thumbnailPreview: null,
    })
  }, [event?.id, open])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setLocal((prev: any) => ({ ...prev, newThumbnail: file, thumbnailPreview: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  async function handleSave() {
    if (!local) return
    if (!local.title || !local.event_date || !local.location) {
      toast({ title: "Validation Error", description: "Please fill in title, date, and location", variant: "destructive" })
      return
    }

    try {
      if (onSave) await onSave(local)
      onOpenChange(false)
    } catch (err: any) {
      console.error("Error saving event:", err)
      toast({ title: "Error", description: "Failed to save event", variant: "destructive" })
    }
  }

  if (!local) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Title *</Label>
            <Input value={local.title || ""} onChange={(e) => setLocal({ ...local, title: e.target.value })} />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea value={local.description || ""} onChange={(e) => setLocal({ ...local, description: e.target.value })} rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Input value={local.category || ""} onChange={(e) => setLocal({ ...local, category: e.target.value })} />
            </div>
            <div>
              <Label>Location *</Label>
              <Input value={local.location || ""} onChange={(e) => setLocal({ ...local, location: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Event Date *</Label>
              <Input type="datetime-local" value={local.event_date?.slice?.(0, 16) || ""} onChange={(e) => setLocal({ ...local, event_date: e.target.value })} />
            </div>
            <div>
              <Label>Event End Date</Label>
              <Input type="datetime-local" value={local.event_end_date?.slice?.(0, 16) || ""} onChange={(e) => setLocal({ ...local, event_end_date: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Capacity</Label>
              <Input type="number" value={local.capacity || ""} onChange={(e) => setLocal({ ...local, capacity: e.target.value })} />
            </div>
            <div>
              <Label>
                <input type="checkbox" checked={!!local.is_free} onChange={(e) => setLocal({ ...local, is_free: e.target.checked })} className="mr-2" />
                Free Event
              </Label>
            </div>
          </div>

          {!local.is_free && (
            <div>
              <Label>Ticket Price (₦)</Label>
              <Input type="number" step="0.01" value={local.ticket_price || ""} onChange={(e) => setLocal({ ...local, ticket_price: e.target.value })} />
              {local.ticket_price && (
                <p className="text-xs text-muted-foreground mt-1">
                  Equivalent: ${(parseFloat(local.ticket_price) / 1450).toFixed(2)}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Organizer Name</Label>
              <Input value={local.organizer_name || ""} onChange={(e) => setLocal({ ...local, organizer_name: e.target.value })} />
            </div>
            <div>
              <Label>Organizer Contact</Label>
              <Input value={local.organizer_contact || ""} onChange={(e) => setLocal({ ...local, organizer_contact: e.target.value })} />
            </div>
          </div>

          <div>
            <Label>Tags (comma separated)</Label>
            <Input value={local.tags || ""} onChange={(e) => setLocal({ ...local, tags: e.target.value })} />
          </div>

          <div>
            <Label>Thumbnail</Label>
            {local.thumbnailPreview && (
              <div className="mb-3 relative w-40 h-24">
                <img src={local.thumbnailPreview} alt="New Thumbnail" className="w-full h-full object-cover rounded border-2 border-green-500" />
                <p className="text-xs text-green-600 mt-1">New thumbnail</p>
              </div>
            )}

            {local.thumbnail_url && !local.thumbnailPreview && (
              <div className="mb-3 relative w-40 h-24">
                <Image src={local.thumbnail_url} alt="Current Thumbnail" fill className="object-cover rounded" />
                <p className="text-xs text-muted-foreground mt-1">Current thumbnail</p>
              </div>
            )}

            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="w-full">
              <Upload className="w-4 h-4 mr-2" />
              {local.thumbnailPreview ? "Change" : "Upload"} Thumbnail
            </Button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          <div className="flex gap-2">
            <Button className="flex-1 gradient-bg" onClick={handleSave} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
