"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface ReportPostModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  postId: string
  postAuthorId: string
}

const REPORT_REASONS = [
  {
    id: "inappropriate_content",
    label: "Inappropriate or offensive content",
    description: "Contains offensive, hateful, or inappropriate material"
  },
  {
    id: "spam",
    label: "Spam or misleading",
    description: "Spam, clickbait, or misleading information"
  },
  {
    id: "harassment",
    label: "Harassment or bullying",
    description: "Contains harassment, bullying, or threats"
  },
  {
    id: "violence",
    label: "Violence or harm",
    description: "Promotes or glorifies violence or self-harm"
  },
  {
    id: "sexual_content",
    label: "Sexual or adult content",
    description: "Contains explicit or adult content"
  },
  {
    id: "copyright",
    label: "Copyright infringement",
    description: "Violates copyright or intellectual property rights"
  },
  {
    id: "misinformation",
    label: "False or misleading information",
    description: "Contains false or misleading information"
  },
  {
    id: "other",
    label: "Other",
    description: "Other reason not listed above"
  }
]

export function ReportPostModal({
  open,
  onOpenChange,
  postId,
  postAuthorId,
}: ReportPostModalProps) {
  const { toast } = useToast()
  const [selectedReason, setSelectedReason] = useState<string | null>(null)
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast({
        title: "Error",
        description: "Please select a reason for reporting",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/posts/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          postAuthorId,
          reason: selectedReason,
          description: description.trim() || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to submit report")
      }

      toast({
        title: "Success",
        description: "Thank you for reporting this post. We will review it shortly.",
      })

      // Reset form and close modal
      setSelectedReason(null)
      setDescription("")
      onOpenChange(false)
    } catch (error) {
      console.error("Error submitting report:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit report",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      onOpenChange(newOpen)
      if (!newOpen) {
        // Reset form when closing
        setSelectedReason(null)
        setDescription("")
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report Post</DialogTitle>
          <DialogDescription>
            Help us keep the community safe by reporting inappropriate content. We don't reveal who reported the post.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Reason Selection */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Why are you reporting this post?</Label>
            <RadioGroup value={selectedReason || ""} onValueChange={setSelectedReason}>
              <div className="space-y-3">
                {REPORT_REASONS.map((reason) => (
                  <div key={reason.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors">
                    <RadioGroupItem value={reason.id} id={reason.id} className="mt-1" />
                    <label htmlFor={reason.id} className="flex-1 cursor-pointer">
                      <div className="font-medium text-sm">{reason.label}</div>
                      <div className="text-xs text-muted-foreground">{reason.description}</div>
                    </label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Additional Details */}
          <div className="space-y-3">
            <Label htmlFor="description" className="text-base font-semibold">
              Additional details (optional)
            </Label>
            <Textarea
              id="description"
              placeholder="Provide any additional information that might help us review this report..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              disabled={loading}
              className="resize-none"
              rows={4}
            />
            <div className="text-xs text-muted-foreground text-right">
              {description.length}/500
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>Privacy:</strong> Your identity will remain confidential. The poster will be notified that their post was reported but won't know who reported it.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedReason || loading}
              className="gradient-bg"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
