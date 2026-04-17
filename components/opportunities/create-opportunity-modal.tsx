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
import { uploadOpportunityMedia } from "@/lib/supabase/storage"
import { Loader2, Upload, X, Briefcase } from "lucide-react"

const CATEGORIES = [
  "Job Posting",
  "Hiring Notice",
  "Funding/Grants",
  "Internship",
  "Partnership",
  "Volunteering",
  "Gig/Freelance",
  "Other"
]

interface CreateOpportunityModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  opportunity?: any // For editing
  onSuccess: () => void
}

export function CreateOpportunityModal({ open, onOpenChange, opportunity, onSuccess }: CreateOpportunityModalProps) {
  const { toast } = useToast()
  const { user } = useUserProfile()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>(opportunity?.image_url || "")

  const [formData, setFormData] = useState({
    title: opportunity?.title || "",
    description: opportunity?.description || "",
    category: opportunity?.category || "Job Posting",
    location: opportunity?.location || "",
    link_url: opportunity?.link_url || "",
    content: opportunity?.content || ""
  })

  useEffect(() => {
    if (opportunity) {
      setFormData({
        title: opportunity.title,
        description: opportunity.description,
        category: opportunity.category,
        location: opportunity.location || "",
        link_url: opportunity.link_url || "",
        content: opportunity.content || ""
      })
      setImagePreview(opportunity.image_url || "")
    } else {
      setFormData({
        title: "",
        description: "",
        category: "Job Posting",
        location: "",
        link_url: "",
        content: ""
      })
      setImagePreview("")
      setImageFile(null)
    }
  }, [opportunity, open])

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
        const { url, error } = await uploadOpportunityMedia(user.id, imageFile)
        if (error) throw new Error(error)
        imageUrl = url || ""
        setUploading(false)
      }

      const method = opportunity ? "PATCH" : "POST"
      const url = opportunity ? `/api/opportunities/${opportunity.id}` : "/api/opportunities"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, image_url: imageUrl })
      })

      if (!res.ok) throw new Error("Failed to save opportunity")

      toast({
        title: "Success",
        description: opportunity ? "Opportunity updated successfully" : "Opportunity created and submitted for approval",
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
          <DialogTitle className="text-xl md:text-2xl font-bold">{opportunity ? "Edit Opportunity" : "Create Official Opportunity"}</DialogTitle>
          <DialogDescription className="text-sm">
            {opportunity ? "Update the details of this community posting." : "This will be automatically approved and visible to all users."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6 pt-2 md:pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs md:text-sm font-semibold">Title <span className="text-destructive">*</span></Label>
                <Input 
                  id="title" 
                  placeholder="e.g. Senior Frontend Developer" 
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="h-11 rounded-xl bg-muted/20 border-border/50 focus-visible:ring-primary/50"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-xs md:text-sm font-semibold">Category <span className="text-destructive">*</span></Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(val) => setFormData({ ...formData, category: val })}
                >
                  <SelectTrigger className="h-11 rounded-xl bg-muted/20 border-border/50 focus:ring-primary/50">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="location" className="text-xs md:text-sm font-semibold">Location (Optional)</Label>
                <Input 
                  id="location" 
                  placeholder="e.g. Lagos, Nigeria / Remote" 
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="h-11 rounded-xl bg-muted/20 border-border/50 focus-visible:ring-primary/50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs md:text-sm font-semibold">Opportunity Image</Label>
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
                    <Upload className="w-8 h-8 text-muted-foreground mb-2 group-hover:text-primary transition-colors" />
                    <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Click to upload image</span>
                    <span className="text-[10px] text-muted-foreground/60 mt-1">Recommended: 16:9 aspect ratio</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs md:text-sm font-semibold">Short Description <span className="text-destructive">*</span></Label>
            <Textarea 
              id="description" 
              placeholder="Briefly describe the opportunity (max 200 chars)" 
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="h-20 rounded-xl bg-muted/20 border-border/50 focus-visible:ring-primary/50 resize-none"
              required
              maxLength={200}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="content" className="text-xs md:text-sm font-semibold">Full Details / Requirements</Label>
            <Textarea 
              id="content" 
              placeholder="Provide more details, eligibility, requirements, etc." 
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="h-32 rounded-xl bg-muted/20 border-border/50 focus-visible:ring-primary/50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-1.5">
              <Label htmlFor="link_url" className="text-xs md:text-sm font-semibold">External Link / Application URL</Label>
              <Input 
                id="link_url" 
                type="url"
                placeholder="https://example.com/apply" 
                value={formData.link_url}
                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                className="h-11 rounded-xl bg-muted/20 border-border/50 focus-visible:ring-primary/50"
              />
            </div>
            {/* Added for symmetry or future use */}
            <div className="hidden md:block" />
          </div>

          <div className="flex flex-col md:flex-row gap-3 pt-4 border-t border-border/30">
            <Button type="submit" className="w-full md:order-2 h-12 md:h-11 rounded-xl md:rounded-full gradient-bg font-bold shadow-lg shadow-primary/20" disabled={loading || uploading}>
              {loading || uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploading ? "Uploading..." : "Saving..."}
                </>
              ) : (
                opportunity ? "Update Posting" : "Post Opportunity"
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full md:order-1 h-12 md:h-11 rounded-xl md:rounded-full font-bold border-border/50" disabled={loading}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
