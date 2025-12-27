"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, Bookmark, Share2, Loader2, ChevronDown } from "lucide-react"
import { useUserProfile } from "@/hooks/use-user-profile"
import {
  getPostComments,
  createComment,
  likePost,
  checkIfUserLikedPost,
  checkIfUserSavedPost,
  savePost,
  unsavePost,
} from "@/lib/supabase/queries"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"

interface PostDetailProps {
  post: any
  onPostUpdate?: (post: any) => void
}

export function PostDetail({ post, onPostUpdate }: PostDetailProps) {
  const router = useRouter()
  const { user } = useUserProfile()
  const { toast } = useToast()

  const [isLiked, setIsLiked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [likesCount, setLikesCount] = useState(post?.likes_count || 0)
  const [commentsCount, setCommentsCount] = useState(post?.comments_count || 0)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [submittingComment, setSubmittingComment] = useState(false)
  const [showAllComments, setShowAllComments] = useState(false)

  // Check initial state
  useEffect(() => {
    if (user) {
      checkInitialState()
    }
  }, [user, post?.id])

  // Fetch comments when expanding
  useEffect(() => {
    if (showComments && comments.length === 0) {
      fetchComments()
    }
  }, [showComments])

  async function checkInitialState() {
    if (!user) return

    try {
      const [likeRes, saveRes] = await Promise.all([
        checkIfUserLikedPost(user.id, post.id),
        checkIfUserSavedPost(user.id, post.id),
      ])

      setIsLiked(!!likeRes.liked)
      setIsSaved(!!saveRes.saved)
    } catch (err) {
      console.error("Failed to check initial state:", err)
    }
  }

  async function fetchComments() {
    if (!post?.id) return

    setLoading(true)
    try {
      const { data, error } = await getPostComments(post.id)
      if (error) throw error
      setComments(data || [])
    } catch (err) {
      console.error("Failed to fetch comments:", err)
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleLike() {
    if (!user) {
      router.push("/login")
      return
    }

    const prevLiked = isLiked
    const prevCount = likesCount

    // Optimistic update
    setIsLiked(!prevLiked)
    setLikesCount(!prevLiked ? prevCount + 1 : prevCount - 1)

    try {
      const { liked, error } = await likePost(user.id, post.id)
      if (error) throw error

      // Sync actual state
      setIsLiked(liked)
      toast({
        title: liked ? "Liked" : "Unliked",
        description: liked ? "You liked this post" : "You unliked this post",
      })
    } catch (err) {
      // Revert on error
      setIsLiked(prevLiked)
      setLikesCount(prevCount)
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive",
      })
    }
  }

  async function handleSave() {
    if (!user) {
      router.push("/login")
      return
    }

    try {
      if (isSaved) {
        await unsavePost(user.id, post.id)
      } else {
        await savePost(user.id, post.id)
      }

      setIsSaved(!isSaved)
      toast({
        title: !isSaved ? "Saved" : "Unsaved",
        description: !isSaved ? "Added to your saved posts" : "Removed from saved posts",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save post",
        variant: "destructive",
      })
    }
  }

  async function handleCommentSubmit() {
    if (!user || !newComment.trim()) return

    setSubmittingComment(true)
    try {
      const { data: comment, error } = await createComment(post.id, user.id, newComment)
      if (error) throw error

      setComments([comment, ...comments])
      setNewComment("")
      setCommentsCount(commentsCount + 1)

      // Update post
      if (onPostUpdate) {
        onPostUpdate({ ...post, comments_count: commentsCount + 1 })
      }

      toast({
        title: "Success",
        description: "Comment posted",
      })
    } catch (err) {
      console.error("Failed to post comment:", err)
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      })
    } finally {
      setSubmittingComment(false)
    }
  }

  const displayedComments = showAllComments ? comments : comments.slice(0, 2)

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push(`/user/${post.user?.id}`)}>
            <Avatar className="w-10 h-10">
              <AvatarImage src={post.user?.profile_picture} />
              <AvatarFallback>{post.user?.display_name?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm hover:underline">{post.user?.display_name}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(post.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Content */}
        <p className="text-sm leading-relaxed">{post.content}</p>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {post.tags.map((tag: string) => (
              <span key={tag} className="text-xs bg-muted px-2 py-1 rounded">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Media */}
        {post.media && post.media.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            {post.media.map((m: any, idx: number) => (
              <div key={idx} className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted">
                <Image
                  src={m.url || m}
                  alt="Post media"
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Location */}
        {post.location_name && (
          <p className="text-xs text-muted-foreground">📍 {post.location_name}</p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground py-3 border-y border-border/50">
          <span>{likesCount} likes</span>
          <div className="flex gap-4">
            <span>{commentsCount} comments</span>
            <span>{post.views_count || 0} views</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-around gap-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn("flex-1 gap-2", isLiked && "text-red-500")}
            onClick={handleLike}
          >
            <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
            <span className="hidden sm:inline text-xs">Like</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={cn("flex-1 gap-2", showComments && "text-primary")}
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline text-xs">Comment</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={cn("flex-1 gap-2", isSaved && "text-amber-500")}
            onClick={handleSave}
          >
            <Bookmark className={cn("w-4 h-4", isSaved && "fill-current")} />
            <span className="hidden sm:inline text-xs">Save</span>
          </Button>

          <Button variant="ghost" size="sm" className="flex-1 gap-2">
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline text-xs">Share</span>
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="space-y-4 pt-4 border-t border-border/50">
            {user && (
              <div className="space-y-2">
                <Textarea
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-20 text-sm"
                />
                <Button
                  size="sm"
                  onClick={handleCommentSubmit}
                  disabled={submittingComment || !newComment.trim()}
                  className="w-full"
                >
                  {submittingComment ? (
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

            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first!</p>
            ) : (
              <div className="space-y-3">
                {displayedComments.map((comment) => (
                  <div key={comment.id} className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={comment.user?.profile_picture} />
                        <AvatarFallback>{comment.user?.display_name?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs">{comment.user?.display_name}</p>
                        <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                          {comment.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {comments.length > 2 && !showAllComments && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-primary"
                    onClick={() => setShowAllComments(true)}
                  >
                    <ChevronDown className="w-4 h-4 mr-2" />
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
}
