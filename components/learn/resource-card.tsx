"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Eye, Bookmark, ExternalLink, Calendar, Trash2, Edit, BookOpen, GraduationCap } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface ResourceCardProps {
  resource: any
  isOwner?: boolean
  onEdit?: (res: any) => void
  onDelete?: (id: string) => void
  onRefresh?: () => void
}

export function ResourceCard({ resource, isOwner, onEdit, onDelete, onRefresh }: ResourceCardProps) {
  const { toast } = useToast()
  const [loadingSave, setLoadingSave] = useState(false)
  const [isSaved, setIsSaved] = useState(resource.isSaved)

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      setLoadingSave(true)
      const res = await fetch(`/api/learn/${resource.id}/save`, { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        setIsSaved(data.saved)
        toast({
          title: data.saved ? "Saved" : "Removed from saved",
          description: data.saved ? "Resource added to your collection." : "Removed successfully.",
        })
        if (onRefresh) onRefresh()
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to update save", variant: "destructive" })
    } finally {
      setLoadingSave(false)
    }
  }

  const handleRecordView = async () => {
    try {
      await fetch(`/api/learn/${resource.id}/view`, { method: "POST" })
    } catch (err) {
      console.error("Failed to record view")
    }
  }

  return (
    <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 flex flex-col h-full bg-card border-border/50">
      <div className="relative aspect-video overflow-hidden bg-muted">
        {resource.image_url ? (
          <img 
            src={resource.image_url} 
            alt={resource.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary/5">
            <BookOpen className="w-12 h-12 opacity-20" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className="bg-secondary/90 text-white border-none">
            {resource.category}
          </Badge>
          {resource.status === 'pending' && (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pending</Badge>
          )}
        </div>
        {!isOwner && (
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              "absolute top-3 right-3 rounded-full bg-white/80 dark:bg-black/80 backdrop-blur-md hover:bg-secondary hover:text-white transition-all",
              isSaved && "text-secondary"
            )}
            onClick={handleToggleSave}
            disabled={loadingSave}
          >
            <Bookmark className={cn("w-4 h-4", isSaved && "fill-current")} />
          </Button>
        )}
      </div>

      <CardContent className="p-5 flex-1 space-y-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <span>{formatDistanceToNow(new Date(resource.created_at), { addSuffix: true })}</span>
        </div>
        
        <h3 className="text-xl font-bold leading-tight line-clamp-2 min-h-[3.5rem] group-hover:text-secondary transition-colors">
          {resource.title}
        </h3>

        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
          {resource.description}
        </p>

        <div className="flex items-center gap-4 pt-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Eye className="w-3.5 h-3.5 text-secondary" />
            <span>{resource.views_count || 0} views</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-0 mt-auto flex items-center justify-between gap-3">
        {!isOwner ? (
          <>
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8 border border-background">
                <AvatarImage src={resource.user?.profile_picture || resource.admin?.profile_picture} />
                <AvatarFallback>{(resource.user?.display_name || resource.admin?.full_name)?.[0] || 'V'}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold truncate max-w-[100px]">
                  {resource.user?.display_name || resource.admin?.full_name || 'Vibe2Gether'}
                </span>
                {resource.admin && (
                  <span className="text-[8px] text-secondary font-bold">OFFICIAL</span>
                )}
              </div>
            </div>
            <Button size="sm" variant="secondary" className="rounded-full h-9 px-5" onClick={() => {
              handleRecordView()
              if (resource.link_url) window.open(resource.link_url, "_blank")
            }}>
              Access Resource
            </Button>
          </>
        ) : (
          <div className="flex items-center justify-between w-full border-t border-border/50 pt-4">
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-8 rounded-full" onClick={() => onEdit?.(resource)}>
                <Edit className="w-3.5 h-3.5 mr-1.5" />
                Edit
              </Button>
              <Button size="sm" variant="ghost" className="h-8 rounded-full text-destructive hover:bg-destructive/10" onClick={() => onDelete?.(resource.id)}>
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Delete
              </Button>
            </div>
            <Button size="sm" className="rounded-full h-8 px-4" variant="secondary" onClick={() => {
              if (resource.link_url) window.open(resource.link_url, "_blank")
            }}>
              Preview
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
