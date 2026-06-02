"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, Briefcase, Eye, Bookmark, Calendar, Trash2, Edit, ExternalLink, MessageSquare } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface OpportunityCardProps {
  opportunity: any
  isOwner?: boolean
  isAuthenticated?: boolean
  onEdit?: (opp: any) => void
  onDelete?: (id: string) => void
  onRefresh?: () => void
}

export function OpportunityCard({
  opportunity,
  isOwner,
  isAuthenticated = false,
  onEdit,
  onDelete,
  onRefresh,
}: OpportunityCardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loadingBookmark, setLoadingBookmark] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(opportunity.isBookmarked)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  const handleToggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      setLoadingBookmark(true)
      const res = await fetch(`/api/opportunities/${opportunity.id}/bookmark`, { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        setIsBookmarked(data.bookmarked)
        toast({
          title: data.bookmarked ? "Bookmarked" : "Removed from bookmarks",
          description: data.bookmarked ? "Opportunity saved to your bookmarks." : "Removed successfully.",
        })
        if (onRefresh) onRefresh()
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to update bookmark", variant: "destructive" })
    } finally {
      setLoadingBookmark(false)
    }
  }

  const handleRecordView = async () => {
    try {
      await fetch(`/api/opportunities/${opportunity.id}/view`, { method: "POST" })
    } catch (err) {
      console.error("Failed to record view")
    }
  }

  const handleViewDetails = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true)
      return
    }

    await handleRecordView()

    setShowDetailsModal(true)
  }

  const handleLoginRedirect = () => {
    const callbackUrl =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : "/opportunities"

    setShowLoginModal(false)
    router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  }

  return (
    <>
      <Card className="overflow-hidden group hover:border-primary/50 transition-all duration-300 flex flex-col h-full bg-card border-border/50">
        <div className="relative aspect-video overflow-hidden bg-muted">
          {opportunity.image_url ? (
            <img
              src={opportunity.image_url}
              alt={opportunity.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-primary/5">
              <Briefcase className="w-12 h-12 opacity-20" />
            </div>
          )}
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className="bg-background/80 backdrop-blur-md text-foreground border-none">
              {opportunity.category}
            </Badge>
            {opportunity.status !== 'approved' && (
              <Badge variant="outline" className="bg-muted/80 text-muted-foreground border-border">
                {opportunity.status === "rejected" ? "Unavailable" : "Pending"}
              </Badge>
            )}
          </div>
          {!isOwner && (
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                "absolute top-3 right-3 rounded-full bg-background/80 backdrop-blur-md hover:bg-primary hover:text-white transition-all",
                isBookmarked && "text-primary"
              )}
              onClick={handleToggleBookmark}
              disabled={loadingBookmark}
            >
              <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-current")} />
            </Button>
          )}
        </div>

        <CardContent className="p-5 flex-1 space-y-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>{formatDistanceToNow(new Date(opportunity.created_at), { addSuffix: true })}</span>
          </div>

          <h3 className="text-xl font-bold leading-tight line-clamp-2 min-h-[3.5rem] group-hover:text-primary transition-colors">
            {opportunity.title}
          </h3>

          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {opportunity.description}
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            {opportunity.location && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span className="truncate max-w-[150px]">{opportunity.location}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Eye className="w-3.5 h-3.5 text-primary" />
              <span>{opportunity.views_count || 0} views</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-5 pt-0 mt-auto flex items-center justify-between gap-3 border-t border-border/50 bg-muted/30">
          {!isOwner ? (
            <>
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8 border border-background">
                  <AvatarImage src={opportunity.user?.profile_picture || opportunity.admin?.profile_picture} />
                  <AvatarFallback>{(opportunity.user?.display_name || opportunity.admin?.full_name)?.[0] || 'V'}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold truncate max-w-[100px]">
                    {opportunity.user?.display_name || opportunity.admin?.full_name || 'Vibe2Gether'}
                  </span>
                  {opportunity.admin && (
                    <span className="text-[8px] text-primary font-bold flex items-center gap-0.5">
                      OFFICIAL
                    </span>
                  )}
                </div>
              </div>
              <Button size="sm" className="rounded-full gradient-bg h-9 px-5" onClick={handleViewDetails}>
                {opportunity.status === "approved" ? "View Details" : "View Status"}
              </Button>
            </>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="h-8 rounded-full" onClick={() => onEdit?.(opportunity)}>
                  <Edit className="w-3.5 h-3.5 mr-1.5" />
                  Edit
                </Button>
                <Button size="sm" variant="ghost" className="h-8 rounded-full text-destructive hover:bg-destructive/10" onClick={() => onDelete?.(opportunity.id)}>
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Delete
                </Button>
              </div>
              <Button size="sm" className="rounded-full h-8 px-4" variant="secondary" onClick={() => {
                if (opportunity.link_url) window.open(opportunity.link_url, "_blank")
              }}>
                Preview
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>

      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="max-w-md rounded-3xl border-border/60 p-0 overflow-hidden">
          <div className="bg-[linear-gradient(135deg,#fff3f8_0%,#f7f2ff_100%)] px-6 py-5 dark:bg-[linear-gradient(135deg,rgba(255,95,149,0.16)_0%,rgba(130,104,255,0.16)_100%)]">
            <DialogHeader className="text-left">
              <DialogTitle className="text-2xl tracking-[-0.03em]">Login required</DialogTitle>
              <DialogDescription className="mt-2 text-sm leading-6">
                Sign in to view full opportunity details, open external links, and keep track of the posts that matter to you.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-6 pb-6">
            <div className="rounded-2xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
              You&apos;ll be sent back to the opportunities page after login.
            </div>
            <DialogFooter className="mt-6">
              <Button variant="outline" className="rounded-full" onClick={() => setShowLoginModal(false)}>
                Not now
              </Button>
              <Button className="rounded-full gradient-bg" onClick={handleLoginRedirect}>
                Go to login
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl">{opportunity.title}</DialogTitle>
            <DialogDescription className="mt-2 text-sm leading-6">
              {opportunity.description}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-col gap-3">
            {opportunity.link_url && (
              <Button
                variant="outline"
                className="w-full rounded-full gap-2"
                onClick={() => window.open(opportunity.link_url, "_blank", "noopener,noreferrer")}
              >
                <ExternalLink className="w-4 h-4" />
                Visit Link
              </Button>
            )}

            {!opportunity.admin && opportunity.user?.id && (
              <Button
                className="w-full rounded-full gradient-bg gap-2"
                onClick={() => {
                  router.push(`/dashboard/messages?userId=${opportunity.user.id}`);
                  setShowDetailsModal(false);
                }}
              >
                <MessageSquare className="w-4 h-4" />
                Contact User
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
