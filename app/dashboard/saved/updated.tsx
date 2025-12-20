"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Bookmark, Heart, MessageCircle, Loader2, MapPin, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUserProfile } from "@/hooks/use-user-profile"
import { getSavedPosts, unsavePost } from "@/lib/supabase/queries"
import { cn } from "@/lib/utils"

export default function SavedPage() {
  const { user } = useUserProfile()
  const [savedPosts, setSavedPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSavedPosts() {
      if (!user) return

      try {
        setLoading(true)
        const { data, error } = await getSavedPosts(user.id, 50)
        if (!error && data) {
          setSavedPosts(data)
        }
      } catch (err) {
        console.error("Failed to fetch saved posts:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchSavedPosts()
  }, [user])

  const handleUnsavePost = async (postId: string) => {
    if (!user) return

    try {
      await unsavePost(user.id, postId)
      setSavedPosts((prev) => prev.filter((item) => item.post_id !== postId))
    } catch (err) {
      console.error("Failed to unsave post:", err)
    }
  }

  const getMediaUrl = (media: any) => {
    if (!media) return null
    if (Array.isArray(media) && media.length > 0) {
      return media[0].url || media[0]
    }
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Saved Posts</h1>

      {savedPosts.length === 0 ? (
        <Card className="border-border/50 p-12 text-center">
          <Bookmark className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">
            You haven't saved any posts yet. Start saving posts to view them here!
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {savedPosts.map((item) => {
            const post = item.post
            const mediaUrl = getMediaUrl(post.media)
            const timeAgo = new Date(post.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })

            return (
              <Card key={item.id} className="border-border/50 overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  {/* Post Header */}
                  <div className="flex items-start justify-between mb-4">
                    <Link href={`/dashboard/user/${post.user_id}`}>
                      <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={post.user?.profile_picture} />
                          <AvatarFallback>
                            {post.user?.display_name?.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-sm">{post.user?.display_name}</p>
                          <p className="text-xs text-muted-foreground">{timeAgo}</p>
                        </div>
                      </div>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleUnsavePost(post.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Location */}
                  {post.location_name && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                      <MapPin className="w-3.5 h-3.5" />
                      {post.location_name}
                    </div>
                  )}

                  {/* Post Content */}
                  <p className="text-sm text-foreground mb-4 whitespace-pre-wrap line-clamp-3">{post.content}</p>

                  {/* Media */}
                  {mediaUrl && (
                    <div className="relative w-full h-64 rounded-lg overflow-hidden mb-4 bg-muted">
                      <Image
                        src={mediaUrl}
                        alt="Post media"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4 pb-4 border-b border-border/50">
                    <span>{post.likes_count || 0} likes</span>
                    <div className="flex gap-4">
                      <span>{post.comments_count || 0} comments</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="gap-2 flex-1">
                      <Heart className="w-4 h-4" />
                      <span className="hidden sm:inline">Like</span>
                    </Button>

                    <Link href={`/dashboard/post/${post.id}`} className="flex-1">
                      <Button variant="ghost" size="sm" className="gap-2 w-full">
                        <MessageCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">Comment</span>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
