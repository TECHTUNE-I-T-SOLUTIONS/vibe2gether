"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useUserProfile } from "@/hooks/use-user-profile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Star, Loader2, MessageCircle } from "lucide-react"

export default function TestimoniesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { user } = useUserProfile()
  const { toast } = useToast()
  
  const [showForm, setShowForm] = useState(false)
  const [myTestimonies, setMyTestimonies] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  // Form state
  const [rating, setRating] = useState("5")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")

  // Auth check
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  // Fetch user's testimonies
  useEffect(() => {
    if (user?.id) {
      fetchTestimonies()
    }
  }, [user?.id])

  const fetchTestimonies = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/testimonies?status=all`)
      if (response.ok) {
        const data = await response.json()
        const userTestimonies = data.data.filter((t: any) => t.user_id === user?.id)
        setMyTestimonies(userTestimonies)
      }
    } catch (error) {
      console.error("Failed to fetch testimonies:", error)
      toast({
        title: "Error",
        description: "Failed to load your testimonies",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !content.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch("/api/testimonies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.id,
          user_name: user?.full_name || user?.display_name || "Anonymous",
          user_location: user?.city && user?.country ? `${user.city}, ${user.country}` : "Nigeria",
          user_avatar_url: user?.profile_picture,
          rating: parseInt(rating),
          title,
          content,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Testimony submitted for approval! Thank you for your feedback.",
        })
        setTitle("")
        setContent("")
        setRating("5")
        setShowForm(false)
        fetchTestimonies()
      } else {
        const data = await response.json()
        throw new Error(data.error || "Failed to submit testimony")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit testimony",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
            <MessageCircle className="w-8 h-8" />
            My Testimonies
          </h1>
          <p className="text-muted-foreground">
            Share your experience on Vibe2gether. Your feedback helps our community!
          </p>
        </div>

        <Button
          onClick={() => setShowForm(true)}
          className="rounded-full gradient-bg"
        >
          Share Your Testimony
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : myTestimonies.length === 0 ? (
        <Card className="border-border/50 text-center py-12">
          <p className="text-muted-foreground mb-4">
            You haven't shared any testimonies yet.
          </p>
          <Button
            onClick={() => setShowForm(true)}
            className="rounded-full gradient-bg w-full px-6 py-2"
          >
            Share Your First Testimony
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {myTestimonies.map((testimony) => (
            <Card key={testimony.id} className="border-border/50 hover:border-primary/30 transition">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">{testimony.title}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < testimony.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        ({testimony.rating}/5)
                      </span>
                    </div>
                  </div>
                  <Badge className={getStatusColor(testimony.status)}>
                    {testimony.status.charAt(0).toUpperCase() + testimony.status.slice(1)}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  {testimony.content}
                </p>

                <div className="text-xs text-muted-foreground">
                  Submitted on {new Date(testimony.created_at).toLocaleDateString()}
                  {testimony.status === "rejected" && testimony.approval_notes && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-red-700">
                      <strong>Reason:</strong> {testimony.approval_notes}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Share Your Testimony</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Rating */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Rating</label>
              <Select value={rating} onValueChange={setRating}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">⭐⭐⭐⭐⭐ 5 Stars - Excellent!</SelectItem>
                  <SelectItem value="4">⭐⭐⭐⭐ 4 Stars - Very Good</SelectItem>
                  <SelectItem value="3">⭐⭐⭐ 3 Stars - Good</SelectItem>
                  <SelectItem value="2">⭐⭐ 2 Stars - Fair</SelectItem>
                  <SelectItem value="1">⭐ 1 Star - Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="Give your testimony a title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">{title.length}/100</p>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Message</label>
              <Textarea
                placeholder="Share your experience on Vibe2gether. Tell us about your journey, what you loved, and how the platform has impacted you..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground">{content.length}/1000</p>
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
              <strong>Note:</strong> Your testimony will be reviewed and approved by our team before being displayed on the platform. This helps us maintain quality and authenticity.
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="rounded-full gradient-bg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Testimony"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
