"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MapPin,
  Loader2,
  ChevronDown,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUserProfile } from "@/hooks/use-user-profile"
import { useToast } from "@/hooks/use-toast"
import {
  getPostComments,
  deletePost,
} from "@/lib/supabase/queries"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { PostMenu } from "@/components/post-menu"

export default function FeedPage() {
  const router = useRouter()
  const { user } = useUserProfile()
  const { toast } = useToast()
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [likedPosts, setLikedPosts] = useState<Map<string, boolean>>(new Map())
  const [savedPosts, setSavedPosts] = useState<Map<string, boolean>>(new Map())
  const [likeCounts, setLikeCounts] = useState<Map<string, number>>(new Map())
  const [commentCounts, setCommentCounts] = useState<Map<string, number>>(new Map())
  const [saveCounts, setSaveCounts] = useState<Map<string, number>>(new Map())
  const [viewCounts, setViewCounts] = useState<Map<string, number>>(new Map())
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [postComments, setPostComments] = useState<Map<string, any[]>>(new Map())
  const [newComments, setNewComments] = useState<Map<string, string>>(new Map())
  const [submittingComment, setSubmittingComment] = useState<Map<string, boolean>>(new Map())
  const observerTarget = useRef<HTMLDivElement>(null)

  const fetchPosts = useCallback(async (newOffset: number) => {
    try {
      const page = Math.floor(newOffset / 20) + 1
      console.log(`[Feed] Fetching posts - page: ${page}`)

      const response = await fetch(`/api/posts/get-feed?page=${page}&limit=20`)
      if (!response.ok) {
        throw new Error("Failed to fetch posts")
      }

      const { data: posts } = await response.json()
      
      if (!posts || posts.length === 0) {
        setHasMore(false)
        return
      }

      console.log(`[Feed] Fetched ${posts.length} posts with counts`)

      setPosts((prev) => (newOffset === 0 ? posts : [...prev, ...posts]))
      setHasMore(posts.length === 20)
      setOffset(newOffset + 20)

      // Initialize count maps for all posts (API returns them directly)
      const likesCountMap = new Map<string, number>()
      const commentsCountMap = new Map<string, number>()
      const savesCountMap = new Map<string, number>()
      const viewsCountMap = new Map<string, number>()
      const likesMap = new Map<string, boolean>()
      const savesMap = new Map<string, boolean>()

      for (const post of posts) {
        likesCountMap.set(post.id, post.likes_count || 0)
        commentsCountMap.set(post.id, post.comments_count || 0)
        savesCountMap.set(post.id, post.saves_count || 0)
        viewsCountMap.set(post.id, post.views_count || 0)
        likesMap.set(post.id, post.userLiked || false)
        savesMap.set(post.id, post.userSaved || false)

        console.log(
          `[Feed] Post ${post.id} - likes: ${post.likes_count}, saves: ${post.saves_count}, views: ${post.views_count}`
        )
      }

      // Update all states
      if (newOffset === 0) {
        setLikedPosts(likesMap)
        setSavedPosts(savesMap)
        setLikeCounts(likesCountMap)
        setCommentCounts(commentsCountMap)
        setSaveCounts(savesCountMap)
        setViewCounts(viewsCountMap)
      } else {
        setLikedPosts((prev) => new Map([...prev, ...likesMap]))
        setSavedPosts((prev) => new Map([...prev, ...savesMap]))
        setLikeCounts((prev) => new Map([...prev, ...likesCountMap]))
        setCommentCounts((prev) => new Map([...prev, ...commentsCountMap]))
        setSaveCounts((prev) => new Map([...prev, ...savesCountMap]))
        setViewCounts((prev) => new Map([...prev, ...viewsCountMap]))
      }
    } catch (err) {
      console.error("[Feed] Failed to fetch posts:", err)
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
    if (!user) {
      router.push("/login")
      return
    }

    const wasLiked = likedPosts.get(postId) || false
    const currentCount = likeCounts.get(postId) || 0

    // Optimistic update
    setLikedPosts((prev) => new Map(prev).set(postId, !wasLiked))
    setLikeCounts((prev) => new Map(prev).set(postId, wasLiked ? currentCount - 1 : currentCount + 1))

    try {
      console.log(`[Feed] Toggling like for post ${postId}`)

      const response = await fetch("/api/posts/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      })

      if (!response.ok) {
        throw new Error("Failed to toggle like")
      }

      const { liked, likesCount } = await response.json()
      
      // Update with actual counts from server
      console.log(`[Feed] Like toggled - liked: ${liked}, count: ${likesCount}`)
      setLikedPosts((prev) => new Map(prev).set(postId, liked))
      setLikeCounts((prev) => new Map(prev).set(postId, likesCount))

      toast({
        title: liked ? "Liked" : "Unliked",
        description: liked ? "Post added to likes" : "Post removed from likes",
      })
    } catch (err) {
      // Revert on error
      console.error(`[Feed] Error toggling like:`, err)
      setLikedPosts((prev) => new Map(prev).set(postId, wasLiked))
      setLikeCounts((prev) => new Map(prev).set(postId, currentCount))
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive",
      })
    }
  }

  const handleSavePost = async (postId: string) => {
    if (!user) {
      router.push("/login")
      return
    }

    const wasSaved = savedPosts.get(postId) || false
    const currentSaveCount = saveCounts.get(postId) || 0

    // Optimistic update
    setSavedPosts((prev) => new Map(prev).set(postId, !wasSaved))
    setSaveCounts((prev) => new Map(prev).set(postId, wasSaved ? currentSaveCount - 1 : currentSaveCount + 1))

    try {
      console.log(`[Feed] Toggling save for post ${postId}`)

      const response = await fetch("/api/posts/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      })

      if (!response.ok) {
        throw new Error("Failed to toggle save")
      }

      const { saved, savesCount } = await response.json()
      
      // Update with actual counts from server
      console.log(`[Feed] Save toggled - saved: ${saved}, count: ${savesCount}`)
      setSavedPosts((prev) => new Map(prev).set(postId, saved))
      setSaveCounts((prev) => new Map(prev).set(postId, savesCount))

      toast({
        title: saved ? "Saved" : "Unsaved",
        description: saved ? "Added to saved posts" : "Removed from saved posts",
      })
    } catch (err) {
      // Revert on error
      console.error(`[Feed] Error toggling save:`, err)
      setSavedPosts((prev) => new Map(prev).set(postId, wasSaved))
      setSaveCounts((prev) => new Map(prev).set(postId, currentSaveCount))
      toast({
        title: "Error",
        description: "Failed to update save status",
        variant: "destructive",
      })
    }
  }

  const handleShowComments = async (postId: string) => {
    const isExpanded = expandedComments.has(postId)

    if (!isExpanded) {
      // Fetch comments
      try {
        const { data, error } = await getPostComments(postId, 10)
        if (error) throw error
        setPostComments((prev) => new Map(prev).set(postId, data || []))
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to load comments",
          variant: "destructive",
        })
      }
    }

    setExpandedComments((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(postId)) {
        newSet.delete(postId)
      } else {
        newSet.add(postId)
      }
      return newSet
    })
  }

  const handleSubmitComment = async (postId: string) => {
    if (!user) {
      router.push("/login")
      return
    }

    const comment = newComments.get(postId) || ""
    if (!comment.trim()) return

    setSubmittingComment((prev) => new Map(prev).set(postId, true))

    try {
      const response = await fetch("/api/posts/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content: comment }),
      })

      if (!response.ok) {
        throw new Error("Failed to post comment")
      }

      const { comment: newComment, commentsCount } = await response.json()

      setPostComments((prev) => {
        const comments = prev.get(postId) || []
        return new Map(prev).set(postId, [newComment, ...comments])
      })

      setNewComments((prev) => new Map(prev).set(postId, ""))
      setCommentCounts((prev) => new Map(prev).set(postId, commentsCount || (prev.get(postId) || 0) + 1))

      toast({
        title: "Success",
        description: "Comment posted",
      })
    } catch (err) {
      console.error("Comment error:", err)
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      })
    } finally {
      setSubmittingComment((prev) => new Map(prev).set(postId, false))
    }
  }

  const handleDeletePost = async (postId: string) => {
    try {
      const { error } = await deletePost(postId)
      if (error) throw error

      // Remove from posts list
      setPosts((prev) => prev.filter((post) => post.id !== postId))

      // Clean up state maps
      setLikedPosts((prev) => {
        const newMap = new Map(prev)
        newMap.delete(postId)
        return newMap
      })
      setSavedPosts((prev) => {
        const newMap = new Map(prev)
        newMap.delete(postId)
        return newMap
      })
      setLikeCounts((prev) => {
        const newMap = new Map(prev)
        newMap.delete(postId)
        return newMap
      })
      setCommentCounts((prev) => {
        const newMap = new Map(prev)
        newMap.delete(postId)
        return newMap
      })

      toast({
        title: "Success",
        description: "Post deleted",
      })
    } catch (err) {
      console.error("Failed to delete post:", err)
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      })
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
    <div className="p-4 md:p-6 max-w-8xl mx-auto w-auto">
      {/* Create Post Card */}
      <Card className="border-border/50 mb-6 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Avatar className="w-10 h-10 ring-2 ring-primary/20">
              <AvatarImage src={user?.profile_picture || undefined} />
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

          const isLiked = likedPosts.get(post.id) || false
          const isSaved = savedPosts.get(post.id) || false
          const currentLikes = likeCounts.get(post.id) || 0
          const currentComments = commentCounts.get(post.id) || 0
          const currentSaves = saveCounts.get(post.id) || 0
          const currentViews = viewCounts.get(post.id) || 0
          const isExpanded = expandedComments.has(post.id)
          const comments = postComments.get(post.id) || []
          const commentValue = newComments.get(post.id) || ""
          const isSubmittingComment = submittingComment.get(post.id) || false
          const displayedComments = comments.slice(0, 2)

          return (
            <Card key={post.id} className="border-border/50 overflow-hidden hover:shadow-md transition-shadow">
              {/* Post Header */}
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => router.push(`/user/${post.user_id}`)}
                  >
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
                  <PostMenu
                    postId={post.id}
                    postAuthorId={post.user_id}
                    postLink={`${typeof window !== "undefined" ? window.location.origin : ""}/post/${post.id}`}
                    onDelete={handleDeletePost}
                  />
                </div>

                {/* Location */}
                {post.location_name && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                    <MapPin className="w-3.5 h-3.5" />
                    {post.location_name}
                  </div>
                )}

                {/* Post Content */}
                <p
                  className="text-sm text-foreground mb-4 whitespace-pre-wrap cursor-pointer hover:text-primary transition-colors"
                  onClick={() => router.push(`/post/${post.id}`)}
                >
                  {post.content}
                </p>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex gap-2 flex-wrap mb-4">
                    {post.tags.map((tag: string) => (
                      <span key={tag} className="text-xs bg-muted px-2 py-1 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Media */}
                {mediaUrl && (
                  <div
                  className="relative w-full rounded-lg overflow-hidden mb-4 bg-muted"
                  onClick={() => router.push(`/post/${post.id}`)}
                  >
                  {mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                    <video
                    className="w-full h-96 object-cover"
                    controls
                    autoPlay
                    muted
                    onClick={(e) => e.stopPropagation()}
                    >
                    <source src={mediaUrl} />
                    Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="relative w-full h-96 cursor-pointer hover:opacity-90 transition-opacity">
                    <Image
                      src={mediaUrl}
                      alt="Post media"
                      fill
                      className="object-cover"
                    />
                    </div>
                  )}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4 pb-4 border-b border-border/50">
                  <span>{currentLikes} likes</span>
                  <div className="flex gap-4">
                    <span>{currentComments} comments</span>
                    <span>{currentSaves || 0} saves</span>
                    <span>{currentViews || 0} views</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-around mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn("flex-1 gap-2", isLiked && "text-red-500")}
                    onClick={() => handleLikePost(post.id)}
                  >
                    <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
                    <span className="hidden sm:inline text-xs">Like</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn("flex-1 gap-2", isExpanded && "text-primary")}
                    onClick={() => handleShowComments(post.id)}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="hidden sm:inline text-xs">Comment</span>
                  </Button>

                  <Button variant="ghost" size="sm" className="flex-1 gap-2">
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline text-xs">Share</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn("flex-1 gap-2", isSaved && "text-amber-500")}
                    onClick={() => handleSavePost(post.id)}
                  >
                    <Bookmark className={cn("w-4 h-4", isSaved && "fill-current")} />
                    <span className="hidden sm:inline text-xs">Save</span>
                  </Button>
                </div>

                {/* Comments Section */}
                {isExpanded && (
                  <div className="space-y-3 pt-4 border-t border-border/50">
                    {user && (
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Write a comment..."
                          value={commentValue}
                          onChange={(e) => setNewComments((prev) => new Map(prev).set(post.id, e.target.value))}
                          className="min-h-20 text-sm"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSubmitComment(post.id)}
                          disabled={isSubmittingComment || !commentValue.trim()}
                          className="w-full"
                        >
                          {isSubmittingComment ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                              Posting...
                            </>
                          ) : (
                            "Post Comment"
                          )}
                        </Button>
                      </div>
                    )}

                    {comments.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first!</p>
                    ) : (
                      <div className="space-y-3">
                        {displayedComments.map((comment) => (
                          <div key={comment.id} className="space-y-1">
                            <div className="flex items-start gap-2">
                              <Avatar className="w-7 h-7">
                                <AvatarImage src={comment.user?.profile_picture} />
                                <AvatarFallback>{comment.user?.display_name?.[0] || "U"}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-xs">{comment.user?.display_name}</p>
                                <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                                  {comment.content}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}

                        {comments.length > 2 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-primary text-xs"
                          >
                            <ChevronDown className="w-3 h-3 mr-1" />
                            Show {comments.length - 2} more comments
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
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
