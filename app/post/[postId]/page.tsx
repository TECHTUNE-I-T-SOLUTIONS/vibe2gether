"use client"

import { useState, useEffect } from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Heart, MessageCircle, Bookmark, MapPin, Loader2, ArrowLeft, Share2, ChevronLeft, ChevronRight } from "lucide-react"
import { useUserProfile } from "@/hooks/use-user-profile"
import { useToast } from "@/hooks/use-toast"
import {
  getPostComments,
} from "@/lib/supabase/queries"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { PostMenu } from "@/components/post-menu"

export default function PostPage({ params }: { params: Promise<{ postId: string }> }) {
  const router = useRouter()
  const { user: currentUser } = useUserProfile()
  const { toast } = useToast()
  const unwrappedParams = use(params)
  
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [saveCount, setSaveCount] = useState(0)
  const [viewCount, setViewCount] = useState(0)
  const [commentCount, setCommentCount] = useState(0)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [mediaIndex, setMediaIndex] = useState(0)

  useEffect(() => {
    fetchPost()
  }, [unwrappedParams.postId])

  async function fetchPost() {
    try {
      setLoading(true)
      console.log(`[Post Detail] Fetching post ${unwrappedParams.postId}`)

      // Fetch post from API endpoint
      const response = await fetch(`/api/posts/get-post/${unwrappedParams.postId}`)
      if (!response.ok) {
        throw new Error("Post not found")
      }

      const { data: post } = await response.json()

      if (!post) {
        toast({
          title: "Post not found",
          description: "This post may have been deleted",
          variant: "destructive",
        })
        return
      }

      console.log(
        `[Post Detail] Post loaded - likes: ${post.likes_count}, saves: ${post.saves_count}, views: ${post.views_count}`
      )

      setPost(post)
      setLikeCount(post.likes_count || 0)
      setSaveCount(post.saves_count || 0)
      setViewCount(post.views_count || 0)
      setCommentCount(post.comments_count || 0)
      setIsLiked(post.userLiked || false)
      setIsSaved(post.userSaved || false)

      // Record view (IP-gated, one count per IP per 24 hours)
      try {
        console.log(`[Post Detail] Recording view for post ${unwrappedParams.postId}`)
        const viewResponse = await fetch("/api/posts/record-view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId: unwrappedParams.postId }),
        })

        if (viewResponse.ok) {
          const { viewsCount, alreadyViewed } = await viewResponse.json()
          if (alreadyViewed) {
            console.log(`[Post Detail] View already recorded from this IP within 24 hours - count: ${viewsCount}`)
          } else {
            console.log(`[Post Detail] View recorded - new count: ${viewsCount}`)
          }
          setViewCount(viewsCount)
        }
      } catch (err) {
        console.error("[Post Detail] Failed to record view:", err)
      }

      // Fetch comments
      const { data: postComments } = await getPostComments(unwrappedParams.postId, 50)
      setComments(postComments || [])
    } catch (err) {
      console.error("[Post Detail] Failed to fetch post:", err)
      toast({
        title: "Error",
        description: "Failed to load post",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleLike() {
    if (!currentUser) {
      router.push("/login")
      return
    }

    const wasLiked = isLiked
    const currentCount = likeCount

    // Optimistic update
    setIsLiked(!wasLiked)
    setLikeCount(wasLiked ? currentCount - 1 : currentCount + 1)

    try {
      console.log(`[Post Detail] Toggling like for post ${unwrappedParams.postId}`)

      const response = await fetch("/api/posts/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: unwrappedParams.postId }),
      })

      if (!response.ok) {
        throw new Error("Failed to toggle like")
      }

      const { liked, likesCount } = await response.json()
      
      console.log(`[Post Detail] Like toggled - liked: ${liked}, count: ${likesCount}`)
      setIsLiked(liked)
      setLikeCount(likesCount)
      
      toast({
        title: liked ? "Liked" : "Disliked",
        description: liked ? "Post added to likes" : "Post removed from likes",
      })
    } catch (err) {
      // Revert
      console.error(`[Post Detail] Error toggling like:`, err)
      setIsLiked(wasLiked)
      setLikeCount(currentCount)
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive",
      })
    }
  }

  async function handleSave() {
    if (!currentUser) {
      router.push("/login")
      return
    }

    const wasSaved = isSaved
    const currentCount = saveCount

    // Optimistic update
    setIsSaved(!wasSaved)
    setSaveCount(wasSaved ? currentCount - 1 : currentCount + 1)

    try {
      console.log(`[Post Detail] Toggling save for post ${unwrappedParams.postId}`)

      const response = await fetch("/api/posts/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: unwrappedParams.postId }),
      })

      if (!response.ok) {
        throw new Error("Failed to toggle save")
      }

      const { saved, savesCount } = await response.json()
      
      console.log(`[Post Detail] Save toggled - saved: ${saved}, count: ${savesCount}`)
      setIsSaved(saved)
      setSaveCount(savesCount)
      
      toast({
        title: saved ? "Saved" : "Unsaved",
        description: saved ? "Added to saved posts" : "Removed from saved posts",
      })
    } catch (err) {
      // Revert
      console.error(`[Post Detail] Error toggling save:`, err)
      setIsSaved(wasSaved)
      setSaveCount(currentCount)
      toast({
        title: "Error",
        description: "Failed to save post",
        variant: "destructive",
      })
    }
  }

  async function handleSubmitComment() {
    if (!currentUser || !newComment.trim()) return

    setIsSubmittingComment(true)

    try {
      const response = await fetch("/api/posts/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: unwrappedParams.postId, content: newComment }),
      })

      if (!response.ok) {
        throw new Error("Failed to post comment")
      }

      const { comment: createdComment, commentsCount } = await response.json()

      setComments([createdComment, ...comments])
      setNewComment("")
      setCommentCount(commentsCount || commentCount + 1)

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
      setIsSubmittingComment(false)
    }
  }

  function handlePrevMedia() {
    setMediaIndex((prev) => (prev === 0 ? mediaList.length - 1 : prev - 1))
  }

  function handleNextMedia() {
    setMediaIndex((prev) => (prev === mediaList.length - 1 ? 0 : prev + 1))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Card className="border-border/50 p-12 text-center">
          <p className="text-muted-foreground">Post not found</p>
        </Card>
      </div>
    )
  }

  const mediaList = post.media && post.media.length > 0 
    ? post.media.map((m: any) => (typeof m === 'string' ? m : m.url || m))
    : []
  
  const currentMedia = mediaList[mediaIndex] || null
  const isVideo = currentMedia?.match(/\.(mp4|webm|ogg)$/i)

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Back Button */}
      <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      {/* Post Card */}
      <Card className="border-border/50 overflow-hidden">
        <CardContent className="p-6">
          {/* Post Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 flex-1">
              <div
                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => router.push(`/user/${post.user_id}`)}
              >
                <Avatar className="w-12 h-12">
                  <AvatarImage src={post.user?.profile_picture} />
                  <AvatarFallback>{post.user?.display_name?.[0] || "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{post.user?.display_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(post.created_at).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
            
            {currentUser && currentUser.id === post.user_id && (
              <PostMenu
                postId={post.id}
                postAuthorId={post.user_id}
                postLink={`${typeof window !== "undefined" ? window.location.origin : ""}/post/${post.id}`}
              />
            )}
          </div>

          {/* Location */}
          {post.location_name && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
              <MapPin className="w-4 h-4" />
              {post.location_name}
            </div>
          )}

          {/* Post Content */}
          <p className="text-lg text-foreground mb-4 whitespace-pre-wrap">{post.content}</p>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-4">
              {post.tags.map((tag: string) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Media Carousel */}
          {currentMedia && (
            <div className="relative w-full rounded-lg overflow-hidden mb-4 bg-muted">
              {isVideo ? (
                <video
                  className="w-full h-96 object-cover"
                  controls
                  autoPlay
                  muted
                  onClick={(e) => e.stopPropagation()}
                  controlsList="nofullscreen"
                >
                  <source src={currentMedia} />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="relative w-full h-96 cursor-pointer hover:opacity-90 transition-opacity">
                  <Image
                    src={currentMedia}
                    alt="Post media"
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              {/* Navigation Arrows - Only show if multiple media items */}
              {mediaList.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50"
                    onClick={handlePrevMedia}
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50"
                    onClick={handleNextMedia}
                  >
                    <ChevronRight className="w-5 h-5 text-white" />
                  </Button>

                  {/* Media Counter */}
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    {mediaIndex + 1} / {mediaList.length}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 text-center mb-6 pb-6 border-b border-border/50">
            <div>
              <p className="font-semibold text-lg">{likeCount}</p>
              <p className="text-xs text-muted-foreground">Likes</p>
            </div>
            <div>
              <p className="font-semibold text-lg">{commentCount}</p>
              <p className="text-xs text-muted-foreground">Comments</p>
            </div>
            <div>
              <p className="font-semibold text-lg">{saveCount}</p>
              <p className="text-xs text-muted-foreground">Saves</p>
            </div>
            <div>
              <p className="font-semibold text-lg">{viewCount}</p>
              <p className="text-xs text-muted-foreground">Views</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-around mb-6">
            <Button
              variant="ghost"
              size="sm"
              className={cn("flex-1 gap-2", isLiked && "text-red-500")}
              onClick={handleLike}
            >
              <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
              <span>Like</span>
            </Button>

            <Button variant="ghost" size="sm" className="flex-1 gap-2">
              <MessageCircle className="w-5 h-5" />
              <span>Comment</span>
            </Button>

            <Button variant="ghost" size="sm" className="flex-1 gap-2">
              <Share2 className="w-5 h-5" />
              <span>Share</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={cn("flex-1 gap-2", isSaved && "text-amber-500")}
              onClick={handleSave}
            >
              <Bookmark className={cn("w-5 h-5", isSaved && "fill-current")} />
              <span>Save</span>
            </Button>
          </div>

          {/* Comments Section */}
          <div className="space-y-4 pt-6 border-t border-border/50">
            <h3 className="font-semibold">Comments ({commentCount})</h3>

            {/* New Comment */}
            {currentUser && (
              <div className="space-y-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-20"
                />
                <Button
                  onClick={handleSubmitComment}
                  disabled={isSubmittingComment || !newComment.trim()}
                  className="w-full"
                >
                  {isSubmittingComment ? "Posting..." : "Post Comment"}
                </Button>
              </div>
            )}

            {!currentUser && (
              <p className="text-sm text-muted-foreground">
                <Button
                  variant="link"
                  className="p-0"
                  onClick={() => router.push("/login")}
                >
                  Sign in
                </Button>
                {" "}to comment
              </p>
            )}

            {/* Comments List */}
            <div className="space-y-3 mt-4">
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No comments yet. Be the first!</p>
              ) : (
                comments.map((comment) => (
                  <Card key={comment.id} className="border-border/50 p-3">
                    <div className="flex gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={comment.user?.profile_picture} />
                        <AvatarFallback>
                          {comment.user?.display_name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{comment.user?.display_name}</p>
                        <p className="text-sm text-foreground">{comment.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(comment.created_at).toLocaleDateString("en-US", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
