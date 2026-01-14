"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface InvestigateReportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reportId: string
  currentStatus: string
  currentNotes: string
  onSuccess?: () => void
}

export function InvestigateReportModal({
  open,
  onOpenChange,
  reportId,
  currentStatus,
  currentNotes,
  onSuccess,
}: InvestigateReportModalProps) {
  const [status, setStatus] = useState(currentStatus || "pending")
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
          status,
          admin_notes: notes,
        }),
      })

      if (!response.ok) throw new Error("Failed to update report")

      toast({
        title: "Success",
        description: "Report updated successfully",
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update report",
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
          <DialogTitle>Investigate Report</DialogTitle>
          <DialogDescription>Update the report status and add investigation notes</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Investigation Notes</label>
            <Textarea
              placeholder="Add notes about your investigation..."
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
          <Button onClick={handleSubmit} disabled={loading} className="gradient-bg">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Update Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
