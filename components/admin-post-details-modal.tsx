"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageCircle, User, Calendar, Flag } from "lucide-react"

interface PostDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  report: any
  onChatWithAuthor?: () => void
  onChatWithReporter?: () => void
}

export function PostDetailsModal({
  open,
  onOpenChange,
  report,
  onChatWithAuthor,
  onChatWithReporter,
}: PostDetailsModalProps) {
  if (!report?.posts) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Post Details</DialogTitle>
          <DialogDescription>View the reported post content and details</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Post Content */}
          <div className="space-y-3">
            <h3 className="font-semibold">Post Content</h3>
            <div className="bg-muted p-4 rounded-lg border border-border/50">
              <p className="whitespace-pre-wrap">{report.posts.content}</p>
            </div>
          </div>

          {/* Report Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Report Reason</p>
              <p className="font-medium">{report.reason?.replace(/_/g, " ")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Report Status</p>
              <Badge className={
                report.status === "pending" ? "bg-yellow-500" :
                report.status === "investigating" ? "bg-orange-500" :
                "bg-green-500"
              }>
                {report.status?.toUpperCase()}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Priority</p>
              <Badge className={
                report.priority === "high" ? "bg-red-500" :
                report.priority === "medium" ? "bg-orange-500" :
                "bg-blue-500"
              }>
                {report.priority?.toUpperCase()}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Reported Date</p>
              <p className="font-medium">{new Date(report.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Report Description */}
          {report.description && (
            <div className="space-y-2">
              <h3 className="font-semibold">Report Description</h3>
              <p className="text-sm text-muted-foreground">{report.description}</p>
            </div>
          )}

          {/* Admin Notes */}
          {report.admin_notes && (
            <div className="space-y-2">
              <h3 className="font-semibold">Admin Notes</h3>
              <p className="text-sm text-muted-foreground">{report.admin_notes}</p>
            </div>
          )}

          {/* Action Taken */}
          {report.action_taken && (
            <div className="space-y-2">
              <h3 className="font-semibold">Action Taken</h3>
              <Badge variant="outline">{report.action_taken}</Badge>
            </div>
          )}

          {/* Contact Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={onChatWithAuthor}
              className="flex-1"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat with Post Author
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onChatWithReporter}
              className="flex-1"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat with Reporter
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
