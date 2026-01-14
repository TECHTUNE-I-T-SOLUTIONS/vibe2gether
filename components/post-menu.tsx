"use client"

import { useState } from "react"
import { MoreHorizontal, Trash2, Share2, Flag, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useUserProfile } from "@/hooks/use-user-profile"
import { useToast } from "@/hooks/use-toast"
import { ReportPostModal } from "@/components/report-post-modal"

interface PostMenuProps {
  postId: string
  postAuthorId: string
  postLink: string
  onDelete?: (postId: string) => Promise<void>
}

export function PostMenu({ postId, postAuthorId, postLink, onDelete }: PostMenuProps) {
  const { user } = useUserProfile()
  const { toast } = useToast()
  const [showReportModal, setShowReportModal] = useState(false)
  const isAuthor = user?.id === postAuthorId

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postLink)
      toast({
        title: "Copied",
        description: "Post link copied to clipboard",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      })
    }
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Check out this post",
          url: postLink,
        })
      } else {
        await handleCopyLink()
      }
    } catch (err) {
      console.error("Share error:", err)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return

    if (!confirm("Are you sure you want to delete this post?")) return

    try {
      await onDelete(postId)
      toast({
        title: "Success",
        description: "Post deleted",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      })
    }
  }

  const handleReport = () => {
    setShowReportModal(true)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Post menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleCopyLink}>
            <Copy className="h-4 w-4 mr-2" />
            Copy link
          </DropdownMenuItem>

          {isAuthor && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete post
              </DropdownMenuItem>
            </>
          )}

          {!isAuthor && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleReport} className="text-amber-600 focus:text-amber-600 focus:bg-amber-50">
                <Flag className="h-4 w-4 mr-2" />
                Report post
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ReportPostModal
        open={showReportModal}
        onOpenChange={setShowReportModal}
        postId={postId}
        postAuthorId={postAuthorId}
      />
    </>
  )
}
