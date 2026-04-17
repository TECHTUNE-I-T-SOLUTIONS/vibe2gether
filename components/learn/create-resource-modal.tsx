"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useUserProfile } from "@/hooks/use-user-profile"
import { uploadLearnMedia } from "@/lib/supabase/storage"
import { Loader2, Upload, X, BookOpen } from "lucide-react"

const CATEGORIES = [
  "Course",
  "Tutorial",
  "Article/Blog",
  "E-book",
  "Video",
  "Webinar",
  "Case Study",
  "Other"
]

interface CreateResourceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  resource?: any
  onSuccess: () => void
}

export function CreateResourceModal({ open, onOpenChange, resource, onSuccess }: CreateResourceModalProps) {
  const { toast } = useToast()
  const { user } = useUserProfile()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>(resource?.image_url || "")

  const [formData, setFormData] = useState({
    title: resource?.title || "",
    description: resource?.description || "",
    category: resource?.category || "Course",
    link_url: resource?.link_url || "",
    content: resource?.content || ""
  })

  useEffect(() => {
    if (resource) {
      setFormData({
        title: resource.title,
        description: resource.description,
        category: resource.category,
        link_url: resource.link_url || "",
        content: resource.content || ""
      })
      setImagePreview(resource.image_url || "")
    } else {
      setFormData({
        title: "",
        description: "",
        category: "Course",
        link_url: "",
        content: ""
      })
      setImagePreview("")
      setImageFile(null)
    }
  }, [resource, open])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setLoading(true)
      let imageUrl = imagePreview

      if (imageFile) {
        setUploading(true)
        const { url, error } = await uploadLearnMedia(user.id, imageFile)
        if (error) throw new Error(error)
        imageUrl = url || ""
        setUploading(false)
      }

      const method = resource ? "PATCH" : "POST"
      const url = resource ? `/api/learn/${resource.id}` : "/api/learn"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, image_url: imageUrl })
      })

      if (!res.ok) throw new Error("Failed to save resource")

      toast({
        title: "Success",
        description: resource ? "Resource updated successfully" : "Resource created and submitted for approval",
      })
      
      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "An error occurred",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto p-4 md:p-6 rounded-2xl md:rounded-3xl">
        <DialogHeader className="space-y-2 text-center md:text-left">
          <DialogTitle className="text-xl md:text-2xl font-bold">{resource ? "Edit Resource" : "Add Official Resource"}</DialogTitle>
          <DialogDescription className="text-sm">
            {resource ? "Update the details of this learning material." : "Share educational content, courses, or guides with the community."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6 pt-2 md:pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs md:text-sm font-semibold text-muted-foreground">Title <span className="text-destructive">*</span></Label>
                <Input 
                  id="title" 
                  placeholder="e.g. Master React in 30 Days" 
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="h-11 rounded-xl bg-muted/20 border-border/50 focus-visible:ring-secondary/50"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-xs md:text-sm font-semibold text-muted-foreground">Category <span className="text-destructive">*</span></Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(val) => setFormData({ ...formData, category: val })}
                >
                  <SelectTrigger className="h-11 rounded-xl bg-muted/20 border-border/50 focus:ring-secondary/50">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs md:text-sm font-semibold text-muted-foreground">Cover Image</Label>
              <div className="relative">
                {imagePreview ? (
                  <div className="relative w-full h-40 md:h-44 rounded-xl overflow-hidden border border-border/50 group">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null)
                        setImagePreview("")
                      }}
                      className="absolute top-2 right-2 bg-black/60 text-white p-2 rounded-full backdrop-blur-sm opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-40 md:h-44 border-2 border-dashed border-border/40 rounded-xl cursor-pointer bg-muted/10 hover:bg-muted/20 transition-all group">
                    <Upload className="w-8 h-8 text-muted-foreground mb-2 group-hover:text-secondary transition-colors" />
                    <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Click to upload cover</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs md:text-sm font-semibold text-muted-foreground">Short Description <span className="text-destructive">*</span></Label>
            <Textarea 
              id="description" 
              placeholder="What will users learn? (max 200 chars)" 
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="h-20 rounded-xl bg-muted/20 border-border/50 focus-visible:ring-secondary/50 resize-none"
              required
              maxLength={200}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="content" className="text-xs md:text-sm font-semibold text-muted-foreground">Resource Overview / Content</Label>
            <Textarea 
              id="content" 
              placeholder="Detailed description, syllabus, or course roadmap..." 
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="h-32 rounded-xl bg-muted/20 border-border/50 focus-visible:ring-secondary/50"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="link_url" className="text-xs md:text-sm font-semibold text-muted-foreground">External Resource Link / URL</Label>
            <Input 
              id="link_url" 
              type="url"
              placeholder="https://example.com/resource" 
              value={formData.link_url}
              onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
              className="h-11 rounded-xl bg-muted/20 border-border/50 focus-visible:ring-secondary/50"
            />
          </div>

          <div className="flex flex-col md:flex-row gap-3 pt-4 border-t border-border/30">
            <Button type="submit" variant="secondary" className="w-auto md:order-2 h-12 md:h-11 rounded-xl md:rounded-full font-bold shadow-lg shadow-secondary/10" disabled={loading || uploading}>
              {loading || uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploading ? "Uploading..." : "Saving..."}
                </>
              ) : (
                resource ? "Update Resource" : "Add Resource"
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-auto md:order-1 h-12 md:h-11 rounded-xl md:rounded-full font-bold border-border/50" disabled={loading}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
