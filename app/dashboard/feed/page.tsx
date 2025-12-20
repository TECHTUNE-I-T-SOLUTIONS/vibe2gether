"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  MapPin,
  Loader2,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUserProfile } from "@/hooks/use-user-profile"
import { getPosts, savePost, unsavePost } from "@/lib/supabase/queries"
import { cn } from "@/lib/utils"

export default function FeedPage() {
  const { user } = useUserProfile()
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set())
  const observerTarget = useRef<HTMLDivElement>(null)

  const fetchPosts = useCallback(async (newOffset: number) => {
    try {
      const { data, error } = await getPosts(20, newOffset)
      if (!error && data) {
        setPosts((prev) => (newOffset === 0 ? data : [...prev, ...data]))
        setHasMore(data.length === 20)
        setOffset(newOffset + 20)
      }
    } catch (err) {
      console.error("Failed to fetch posts:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts(0)
  }, [fetchPosts])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchPosts(offset)
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [offset, hasMore, loading, fetchPosts])

  const handleLikePost = async (postId: string) => {
    // TODO: Implement like functionality with API
    setLikedPosts((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(postId)) {
        newSet.delete(postId)
      } else {
        newSet.add(postId)
      }
      return newSet
    })
  }

  const handleSavePost = async (postId: string) => {
    if (!user) return

    try {
      if (savedPosts.has(postId)) {
        await unsavePost(user.id, postId)
        setSavedPosts((prev) => {
          const newSet = new Set(prev)
          newSet.delete(postId)
          return newSet
        })
      } else {
        await savePost(user.id, postId)
        setSavedPosts((prev) => new Set(prev).add(postId))
      }
    } catch (err) {
      console.error("Failed to save/unsave post:", err)
    }
  }

  const getMediaUrl = (media: any) => {
    if (!media) return null
    if (Array.isArray(media) && media.length > 0) {
      return media[0].url || media[0]
    }
    return null
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* Create Post Card */}
      <Card className="border-border/50 mb-6 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Avatar className="w-10 h-10 ring-2 ring-primary/20">
              <AvatarImage src={user?.profile_picture} />
              <AvatarFallback>{user?.display_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <Link href="/dashboard/create-post" className="flex-1">
              <div className="bg-muted/50 rounded-full px-4 py-2.5 cursor-pointer hover:bg-muted transition-colors">
                <p className="text-sm text-muted-foreground">What's on your mind?</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Posts Feed */}
      <div className="space-y-4">
        {posts.map((post) => {
          const mediaUrl = getMediaUrl(post.media)
          const timeAgo = new Date(post.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })

          return (
            <Card key={post.id} className="border-border/50 overflow-hidden hover:shadow-md transition-shadow">
              {/* Post Header */}
              <CardContent className="p-4">
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
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="w-4 h-4" />
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
                <p className="text-sm text-foreground mb-4 whitespace-pre-wrap">{post.content}</p>

                {/* Media */}
                {mediaUrl && (
                  <div className="relative w-full h-96 rounded-lg overflow-hidden mb-4 bg-muted">
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
                    <span>{post.saves_count || 0} saves</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-around">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "flex-1 gap-2",
                      likedPosts.has(post.id) && "text-red-500"
                    )}
                    onClick={() => handleLikePost(post.id)}
                  >
                    <Heart
                      className={cn(
                        "w-4 h-4",
                        likedPosts.has(post.id) && "fill-current"
                      )}
                    />
                    <span className="hidden sm:inline">Like</span>
                  </Button>

                  <Link href={`/dashboard/post/${post.id}`} className="flex-1">
                    <Button variant="ghost" size="sm" className="w-full gap-2">
                      <MessageCircle className="w-4 h-4" />
                      <span className="hidden sm:inline">Comment</span>
                    </Button>
                  </Link>

                  <Button variant="ghost" size="sm" className="flex-1 gap-2">
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Share</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "flex-1 gap-2",
                      savedPosts.has(post.id) && "text-amber-500"
                    )}
                    onClick={() => handleSavePost(post.id)}
                  >
                    <Bookmark
                      className={cn(
                        "w-4 h-4",
                        savedPosts.has(post.id) && "fill-current"
                      )}
                    />
                    <span className="hidden sm:inline">Save</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Loading indicator */}
      {loading && posts.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Infinite scroll trigger */}
      {hasMore && <div ref={observerTarget} className="h-10" />}

      {/* No posts message */}
      {!loading && posts.length === 0 && (
        <Card className="border-border/50 p-12 text-center">
          <p className="text-muted-foreground">No posts yet. Start following people to see their posts!</p>
        </Card>
      )}
    </div>
  )
}
