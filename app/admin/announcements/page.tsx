"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Plus, Edit2, Trash2, Eye, MessageSquare, Clock } from "lucide-react"
import Image from "next/image"

interface Announcement {
  id: string
  title: string
  message: string
  description?: string
  type: string
  priority: string
  background_color: string
  text_color: string
  icon?: string
  image_url?: string
  action_url?: string
  action_label?: string
  is_active: boolean
  is_published: boolean
  scheduled_at?: string
  expires_at?: string
  views_count: number
  clicks_count: number
  created_at: string
  updated_at: string
}

const ANNOUNCEMENT_TYPES = ["general", "alert", "promotion", "event", "maintenance"]
const PRIORITIES = ["low", "normal", "high", "critical"]
const COLORS = [
  { name: "Indigo", value: "#6366f1" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Green", value: "#10b981" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Purple", value: "#a855f7" },
  { name: "Orange", value: "#f97316" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Yellow", value: "#eab308" },
]

export default function AdminAnnouncementsPage() {
  const { toast } = useToast()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    description: "",
    type: "general",
    priority: "normal",
    background_color: "#6366f1",
    text_color: "#ffffff",
    icon: "",
    image_url: "",
    action_url: "",
    action_label: "",
    is_active: true,
    is_published: true,
    scheduled_at: "",
    expires_at: "",
  })

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/announcements")
      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data.announcements || [])
      }
    } catch (error) {
      console.error("Failed to fetch announcements:", error)
      toast({
        title: "Error",
        description: "Failed to load announcements",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.message) {
      toast({
        title: "Error",
        description: "Title and message are required",
        variant: "destructive",
      })
      return
    }

    try {
      setUploading(true)
      const url = editingId ? `/api/announcements/${editingId}` : "/api/announcements"
      const method = editingId ? "PATCH" : "POST"

      // Convert form data to API format, handling empty strings as nulls
      const payload = {
        title: formData.title,
        message: formData.message,
        description: formData.description || null,
        type: formData.type,
        priority: formData.priority,
        backgroundColor: formData.background_color,
        textColor: formData.text_color,
        icon: formData.icon || null,
        imageUrl: formData.image_url || null,
        actionUrl: formData.action_url || null,
        actionLabel: formData.action_label || null,
        isActive: formData.is_active,
        isPublished: formData.is_published,
        scheduledAt: formData.scheduled_at ? new Date(formData.scheduled_at).toISOString() : null,
        expiresAt: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error("Failed to save announcement")

      toast({
        title: "Success",
        description: editingId ? "Announcement updated successfully" : "Announcement created successfully",
      })

      setShowDialog(false)
      resetForm()
      fetchAnnouncements()
    } catch (error) {
      console.error("Error saving announcement:", error)
      toast({
        title: "Error",
        description: "Failed to save announcement",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleEdit = (announcement: Announcement) => {
    const convertToDatetimeLocal = (isoString?: string) => {
      if (!isoString) return ""
      // Convert ISO string to datetime-local format (YYYY-MM-DDTHH:mm)
      const date = new Date(isoString)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const day = String(date.getDate()).padStart(2, "0")
      const hours = String(date.getHours()).padStart(2, "0")
      const minutes = String(date.getMinutes()).padStart(2, "0")
      return `${year}-${month}-${day}T${hours}:${minutes}`
    }

    setEditingId(announcement.id)
    setFormData({
      title: announcement.title,
      message: announcement.message,
      description: announcement.description || "",
      type: announcement.type,
      priority: announcement.priority,
      background_color: announcement.background_color,
      text_color: announcement.text_color,
      icon: announcement.icon || "",
      image_url: announcement.image_url || "",
      action_url: announcement.action_url || "",
      action_label: announcement.action_label || "",
      is_active: announcement.is_active,
      is_published: announcement.is_published,
      scheduled_at: convertToDatetimeLocal(announcement.scheduled_at),
      expires_at: convertToDatetimeLocal(announcement.expires_at),
    })
    setShowDialog(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return

    try {
      const response = await fetch(`/api/announcements/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete announcement")

      toast({
        title: "Success",
        description: "Announcement deleted successfully",
      })

      fetchAnnouncements()
    } catch (error) {
      console.error("Error deleting announcement:", error)
      toast({
        title: "Error",
        description: "Failed to delete announcement",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({
      title: "",
      message: "",
      description: "",
      type: "general",
      priority: "normal",
      background_color: "#6366f1",
      text_color: "#ffffff",
      icon: "",
      image_url: "",
      action_url: "",
      action_label: "",
      is_active: true,
      is_published: true,
      scheduled_at: "",
      expires_at: "",
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-500"
      case "high":
        return "bg-orange-500"
      case "normal":
        return "bg-blue-500"
      case "low":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const activeAnnouncements = announcements.filter((a) => a.is_active && a.is_published)
  const scheduledAnnouncements = announcements.filter((a) => a.scheduled_at && new Date(a.scheduled_at) > new Date())
  const inactiveAnnouncements = announcements.filter((a) => !a.is_active || !a.is_published)

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 w-full max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Announcements</h1>
          <p className="text-muted-foreground">Create and manage announcements for all users</p>
        </div>
        <Button onClick={() => {
          resetForm()
          setShowDialog(true)
        }} className="gradient-bg gap-2">
          <Plus className="w-4 h-4" />
          Create Announcement
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active</p>
                <p className="text-3xl font-bold">{activeAnnouncements.length}</p>
              </div>
              <div className="bg-green-500/10 p-3 rounded-lg">
                <Eye className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Scheduled</p>
                <p className="text-3xl font-bold">{scheduledAnnouncements.length}</p>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Announcements</p>
                <p className="text-3xl font-bold">{announcements.length}</p>
              </div>
              <div className="bg-purple-500/10 p-3 rounded-lg">
                <MessageSquare className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="bg-muted/50 p-1 rounded-lg mb-6 grid grid-cols-3 w-full md:w-auto">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>

        {/* Active Announcements */}
        <TabsContent value="active">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : activeAnnouncements.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">No active announcements</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeAnnouncements.map((announcement) => (
                <Card key={announcement.id} className="border-border/50 overflow-hidden">
                  <div className="flex flex-col md:flex-row gap-4 p-6">
                    {/* Preview */}
                    <div className="md:w-48 flex-shrink-0">
                      <div
                        className="w-full h-32 rounded-lg flex items-center justify-center text-white font-semibold"
                        style={{
                          backgroundColor: announcement.background_color,
                          color: announcement.text_color,
                        }}
                      >
                        {announcement.image_url ? (
                          <img
                            src={announcement.image_url}
                            alt={announcement.title}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          announcement.title
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{announcement.title}</h3>
                          <Badge className={`${getPriorityColor(announcement.priority)}`}>
                            {announcement.priority.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">{announcement.type}</Badge>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {announcement.message}
                      </p>

                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-4">
                        <div>Views: {announcement.views_count}</div>
                        <div>Clicks: {announcement.clicks_count}</div>
                        <div>Created: {new Date(announcement.created_at).toLocaleDateString()}</div>
                        <div>Updated: {new Date(announcement.updated_at).toLocaleDateString()}</div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(announcement)}
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(announcement.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Scheduled Announcements */}
        <TabsContent value="scheduled">
          {scheduledAnnouncements.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">No scheduled announcements</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {scheduledAnnouncements.map((announcement) => (
                <Card key={announcement.id} className="border-border/50 p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{announcement.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{announcement.message}</p>
                      <div className="text-xs text-muted-foreground">
                        Scheduled for: {new Date(announcement.scheduled_at!).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(announcement)}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(announcement.id)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Inactive Announcements */}
        <TabsContent value="inactive">
          {inactiveAnnouncements.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">No inactive announcements</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {inactiveAnnouncements.map((announcement) => (
                <Card key={announcement.id} className="border-border/50 p-6 opacity-60">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{announcement.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{announcement.message}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(announcement)}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(announcement.id)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Announcement" : "Create New Announcement"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Update the announcement details" : "Create a new announcement for all users"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title & Message */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Announcement title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Main announcement message"
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional details (optional)"
                  rows={2}
                />
              </div>
            </div>

            {/* Type & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ANNOUNCEMENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bg-color">Background Color</Label>
                <div className="flex gap-2 flex-wrap mt-2">
                  {COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className="w-8 h-8 rounded border-2 transition-all"
                      style={{
                        backgroundColor: color.value,
                        borderColor: formData.background_color === color.value ? "#000" : "transparent",
                      }}
                      onClick={() => setFormData({ ...formData, background_color: color.value })}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="text-color">Text Color</Label>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    className="flex-1 py-2 px-3 rounded border-2 transition-all"
                    style={{
                      backgroundColor: "#ffffff",
                      borderColor: formData.text_color === "#ffffff" ? "#000" : "#e5e7eb",
                    }}
                    onClick={() => setFormData({ ...formData, text_color: "#ffffff" })}
                  >
                    White
                  </button>
                  <button
                    type="button"
                    className="flex-1 py-2 px-3 rounded border-2 transition-all text-white"
                    style={{
                      backgroundColor: "#000000",
                      borderColor: formData.text_color === "#000000" ? "#888" : "transparent",
                    }}
                    onClick={() => setFormData({ ...formData, text_color: "#000000" })}
                  >
                    Black
                  </button>
                </div>
              </div>
            </div>

            {/* Image & Icon */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="image-url">Image URL</Label>
                <Input
                  id="image-url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label htmlFor="icon">Icon</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="Icon name or emoji"
                />
              </div>
            </div>

            {/* Action */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="action-label">Action Label</Label>
                <Input
                  id="action-label"
                  value={formData.action_label}
                  onChange={(e) => setFormData({ ...formData, action_label: e.target.value })}
                  placeholder="e.g., Learn More"
                />
              </div>

              <div>
                <Label htmlFor="action-url">Action URL</Label>
                <Input
                  id="action-url"
                  value={formData.action_url}
                  onChange={(e) => setFormData({ ...formData, action_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="scheduled-at">Schedule For (optional)</Label>
                <Input
                  id="scheduled-at"
                  type="datetime-local"
                  value={formData.scheduled_at}
                  onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">Leave empty to publish immediately</p>
              </div>

              <div>
                <Label htmlFor="expires-at">Expires At (optional)</Label>
                <Input
                  id="expires-at"
                  type="datetime-local"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">Leave empty to never expire</p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is-published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked as boolean })}
                />
                <Label htmlFor="is-published" className="cursor-pointer">
                  Published
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="is-active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })}
                />
                <Label htmlFor="is-active" className="cursor-pointer">
                  Active
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploading} className="gradient-bg">
                {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {editingId ? "Update Announcement" : "Create Announcement"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
