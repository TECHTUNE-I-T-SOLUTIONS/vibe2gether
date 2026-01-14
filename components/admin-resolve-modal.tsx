"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface ResolveReportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reportId: string
  currentNotes: string
  onSuccess?: () => void
}

export function ResolveReportModal({
  open,
  onOpenChange,
  reportId,
  currentNotes,
  onSuccess,
}: ResolveReportModalProps) {
  const [action, setAction] = useState("no_action")
  const [notes, setNotes] = useState(currentNotes || "")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/posts/report/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "resolved",
          action_taken: action,
          admin_notes: notes,
          handled_at: new Date().toISOString(),
        }),
      })

      if (!response.ok) throw new Error("Failed to resolve report")

      toast({
        title: "Success",
        description: "Report resolved successfully",
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resolve report",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Resolve Report</DialogTitle>
          <DialogDescription>Mark report as resolved and document the action taken</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Action Taken</label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no_action">No Action</SelectItem>
                <SelectItem value="post_removed">Post Removed</SelectItem>
                <SelectItem value="post_flagged">Post Flagged</SelectItem>
                <SelectItem value="user_warned">User Warned</SelectItem>
                <SelectItem value="user_suspended">User Suspended</SelectItem>
                <SelectItem value="user_banned">User Banned</SelectItem>
                <SelectItem value="report_dismissed">Report Dismissed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Resolution Notes</label>
            <Textarea
              placeholder="Explain the resolution and action taken..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">{notes.length}/500 characters</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-green-600 hover:bg-green-700">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Resolve Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
