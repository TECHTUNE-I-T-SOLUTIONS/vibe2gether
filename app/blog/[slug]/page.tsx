"use client"

import { useState, useEffect, use } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { Loader2, Heart, MessageCircle, Share2, User, Clock, ArrowLeft, Send, ThumbsUp, X } from "lucide-react"
import { getBlogPost } from "@/lib/supabase/queries"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export default function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [comments, setComments] = useState<any[]>([])
  const [commentText, setCommentText] = useState("")
  const [submittingComment, setSubmittingComment] = useState(false)
  const [loadingComments, setLoadingComments] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [submittingReply, setSubmittingReply] = useState(false)
  const [commentLikes, setCommentLikes] = useState<{ [key: string]: boolean }>({})
  const [commentLikeCounts, setCommentLikeCounts] = useState<{ [key: string]: number }>({})

  useEffect(() => {
    async function loadPost() {
      try {
        setLoading(true)
        const { data, error } = await getBlogPost(slug)
        if (error) {
          setError("Post not found")
        } else if (data) {
          setPost(data)
          setLikeCount(data.likes_count || 0)
          
          // Track view - increment views_count
          try {
            await createClient()
              .from("blog_posts")
              .update({ views_count: (data.views_count || 0) + 1 })
              .eq("id", data.id)
          } catch (err) {
            console.error("Failed to track view:", err)
          }
          
          // Check if user has liked
          if (session?.user?.id) {
            checkUserLike(data.id)
          }
          // Load comments
          loadComments(data.id)
        }
      } catch (err) {
        setError("Failed to load post")
      } finally {
        setLoading(false)
      }
    }
    loadPost()
  }, [slug, session?.user?.id])

  const checkUserLike = async (postId: string) => {
    try {
      const { data } = await createClient()
        .from("blog_likes")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", session?.user?.id)
        .single()
      setLiked(!!data)
    } catch {
      setLiked(false)
    }
  }

  const loadComments = async (postId: string) => {
    try {
      setLoadingComments(true)
      const { data } = await createClient()
        .from("blog_comments")
        .select(`
          id,
          content,
          created_at,
          parent_id,
          likes_count,
          user:user_id(
            id,
            display_name,
            profile_picture
          )
        `)
        .eq("post_id", postId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
      setComments(data || [])
      
      // Load user's comment likes if logged in
      if (session?.user?.id) {
        loadCommentLikes(postId, session.user.id)
      }
    } catch (err) {
      console.error("Failed to load comments:", err)
    } finally {
      setLoadingComments(false)
    }
  }

  const loadCommentLikes = async (postId: string, userId: string) => {
    try {
      const { data } = await createClient()
        .from("blog_comment_likes")
        .select("comment_id")
        .eq("comment_id", postId)
        .eq("user_id", userId)
      
      const likedCommentsMap: { [key: string]: boolean } = {}
      data?.forEach((like: any) => {
        likedCommentsMap[like.comment_id] = true
      })
      setCommentLikes(likedCommentsMap)
    } catch (err) {
      console.error("Failed to load comment likes:", err)
    }
  }

  const handleLike = async () => {
    if (!session?.user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to like this post",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    try {
      if (liked) {
        // Unlike
        await createClient()
          .from("blog_likes")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", session.user.id)
        setLiked(false)
        setLikeCount(Math.max(0, likeCount - 1))
      } else {
        // Like
        await createClient()
          .from("blog_likes")
          .insert({
            post_id: post.id,
            user_id: session.user.id,
          })
        setLiked(true)
        setLikeCount(likeCount + 1)
      }

      // Update post likes
      await createClient()
        .from("blog_posts")
        .update({ likes_count: liked ? likeCount - 1 : likeCount + 1 })
        .eq("id", post.id)
    } catch (err) {
      console.error("Failed to like post:", err)
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddComment = async () => {
    if (!session?.user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to comment on this post",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    if (!commentText.trim()) {
      toast({
        title: "Empty Comment",
        description: "Please enter a comment",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmittingComment(true)
      const { data, error } = await createClient()
        .from("blog_comments")
        .insert({
          post_id: post.id,
          user_id: session.user.id,
          content: commentText,
          is_approved: true,
        })
        .select()
        .single()

      if (!error && data) {
        setCommentText("")
        // Add to comments list
        const { data: userData } = await createClient()
          .from("users")
          .select("id, display_name, profile_picture")
          .eq("id", session.user.id)
          .single()

        setComments([
          {
            id: data.id,
            content: data.content,
            created_at: data.created_at,
            parent_id: null,
            likes_count: 0,
            user: userData,
          },
          ...comments,
        ])

        // Increment comment count
        await createClient()
          .from("blog_posts")
          .update({ comments_count: (post.comments_count || 0) + 1 })
          .eq("id", post.id)
        
        toast({
          title: "Success",
          description: "Comment posted successfully!",
        })
      }
    } catch (err) {
      console.error("Failed to add comment:", err)
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleAddReply = async (parentCommentId: string) => {
    if (!session?.user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to reply to a comment",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    if (!replyText.trim()) {
      toast({
        title: "Empty Reply",
        description: "Please enter a reply",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmittingReply(true)
      const { data, error } = await createClient()
        .from("blog_comments")
        .insert({
          post_id: post.id,
          user_id: session.user.id,
          content: replyText,
          parent_id: parentCommentId,
          is_approved: true,
        })
        .select()
        .single()

      if (!error && data) {
        setReplyText("")
        setReplyingTo(null)
        
        // Add to comments list
        const { data: userData } = await createClient()
          .from("users")
          .select("id, display_name, profile_picture")
          .eq("id", session.user.id)
          .single()

        setComments([
          ...comments,
          {
            id: data.id,
            content: data.content,
            created_at: data.created_at,
            parent_id: parentCommentId,
            likes_count: 0,
            user: userData,
          },
        ])

        // Increment comment count
        await createClient()
          .from("blog_posts")
          .update({ comments_count: (post.comments_count || 0) + 1 })
          .eq("id", post.id)
        
        toast({
          title: "Success",
          description: "Reply posted successfully!",
        })
      }
    } catch (err) {
      console.error("Failed to add reply:", err)
      toast({
        title: "Error",
        description: "Failed to post reply. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmittingReply(false)
    }
  }

  const handleLikeComment = async (commentId: string, currentLikesCount: number) => {
    if (!session?.user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to like a comment",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    try {
      if (commentLikes[commentId]) {
        // Unlike
        await createClient()
          .from("blog_comment_likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", session.user.id)
        
        setCommentLikes((prev) => ({
          ...prev,
          [commentId]: false,
        }))
        setCommentLikeCounts((prev) => ({
          ...prev,
          [commentId]: Math.max(0, (prev[commentId] || currentLikesCount) - 1),
        }))
      } else {
        // Like
        await createClient()
          .from("blog_comment_likes")
          .insert({
            comment_id: commentId,
            user_id: session.user.id,
          })
        
        setCommentLikes((prev) => ({
          ...prev,
          [commentId]: true,
        }))
        setCommentLikeCounts((prev) => ({
          ...prev,
          [commentId]: (prev[commentId] || currentLikesCount) + 1,
        }))
      }

      // Update comment likes count in database
      const newLikesCount = commentLikes[commentId]
        ? Math.max(0, currentLikesCount - 1)
        : currentLikesCount + 1
      
      await createClient()
        .from("blog_comments")
        .update({ likes_count: newLikesCount })
        .eq("id", commentId)
    } catch (err) {
      console.error("Failed to like comment:", err)
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-20 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-20">
          <div className="container mx-auto px-4 py-12 text-center">
            <p className="text-red-500 mb-6">{error || "Post not found"}</p>
            <Button onClick={() => router.push("/blog")} className="gradient-bg">
              Back to Blog
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header />
      <MobileNav />
      <main className="pt-20">
        {/* Back button */}
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => router.push("/blog")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Button>
        </div>

        {/* Hero */}
        {post.thumbnail && (
          <div className="relative h-64 md:h-96 w-full">
            <Image
              src={post.thumbnail}
              alt={post.title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        )}

        <article className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Badge className="gradient-bg text-primary-foreground">{post.category}</Badge>
                {post.tags && post.tags.length > 0 && (
                  <div className="flex gap-2">
                    {post.tags.slice(0, 3).map((tag: string) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.title}</h1>
              <p className="text-lg text-muted-foreground mb-6">{post.excerpt}</p>

              {/* Author and date */}
              <div className="flex flex-col md:flex-row md:items-center gap-4 pb-6 border-b border-border">
                <div className="flex items-center gap-3">
                  {post.author?.profile_picture && (
                    <Image
                      src={post.author.profile_picture}
                      alt={post.author.full_name}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full"
                    />
                  )}
                  <div>
                    <p className="font-semibold">{post.author?.full_name || "Admin"}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(post.published_at || post.created_at).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 md:ml-auto">
                  <Button
                    variant={liked ? "default" : "outline"}
                    size="sm"
                    onClick={handleLike}
                    className="gap-2"
                  >
                    <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
                    {likeCount}
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <MessageCircle className="w-4 h-4" />
                    {comments.length}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="prose prose-invert max-w-none mb-12">
              <div className="text-lg leading-relaxed whitespace-pre-wrap">{post.content}</div>
            </div>

            {/* Comments section */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Comments ({comments.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add comment form */}
                {session?.user?.id ? (
                  <div className="space-y-4 pb-6 border-b border-border">
                    <Label htmlFor="comment-text" className="text-base font-semibold">
                      Add a comment
                    </Label>
                    <Textarea
                      id="comment-text"
                      placeholder="Share your thoughts..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="resize-none"
                      rows={4}
                    />
                    <Button
                      onClick={handleAddComment}
                      disabled={!commentText.trim() || submittingComment}
                      className="gradient-bg gap-2"
                    >
                      {submittingComment ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      Post Comment
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6 border-b border-border">
                    <p className="text-muted-foreground mb-4">Sign in to comment</p>
                    <Button onClick={() => router.push("/login")} className="gradient-bg">
                      Sign In
                    </Button>
                  </div>
                )}

                {/* Comments list */}
                {loadingComments ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6">No comments yet. Be the first to comment!</p>
                ) : (
                  <div className="space-y-6">
                    {comments.filter((c) => !c.parent_id).map((comment) => {
                      const replies = comments.filter((c) => c.parent_id === comment.id)
                      const likeCount = commentLikeCounts[comment.id] !== undefined ? commentLikeCounts[comment.id] : (comment.likes_count || 0)
                      const isLiked = commentLikes[comment.id] || false

                      return (
                        <div key={comment.id}>
                          {/* Parent comment */}
                          <div className="flex gap-4 pb-4">
                            {comment.user?.profile_picture && (
                              <Image
                                src={comment.user.profile_picture}
                                alt={comment.user.display_name}
                                width={40}
                                height={40}
                                className="w-10 h-10 rounded-full flex-shrink-0"
                              />
                            )}
                            <div className="flex-1">
                              <p className="font-semibold text-sm">{comment.user?.display_name || "User"}</p>
                              <p className="text-xs text-muted-foreground mb-2">
                                {new Date(comment.created_at).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </p>
                              <p className="text-sm mb-3">{comment.content}</p>
                              <div className="flex gap-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleLikeComment(comment.id, comment.likes_count || 0)}
                                  className={`gap-2 h-8 text-xs ${isLiked ? "text-primary" : "text-muted-foreground"}`}
                                >
                                  <ThumbsUp className={`w-3 h-3 ${isLiked ? "fill-current" : ""}`} />
                                  {likeCount > 0 && likeCount}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                  className="gap-2 h-8 text-xs text-muted-foreground"
                                >
                                  <MessageCircle className="w-3 h-3" />
                                  Reply
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Replies */}
                          {replies.length > 0 && (
                            <div className="ml-8 mt-4 space-y-4 border-l-2 border-border/50 pl-4">
                              {replies.map((reply) => {
                                const replyLikeCount = commentLikeCounts[reply.id] !== undefined ? commentLikeCounts[reply.id] : (reply.likes_count || 0)
                                const isReplyLiked = commentLikes[reply.id] || false

                                return (
                                  <div key={reply.id} className="flex gap-4">
                                    {reply.user?.profile_picture && (
                                      <Image
                                        src={reply.user.profile_picture}
                                        alt={reply.user.display_name}
                                        width={32}
                                        height={32}
                                        className="w-8 h-8 rounded-full flex-shrink-0"
                                      />
                                    )}
                                    <div className="flex-1">
                                      <p className="font-semibold text-sm">{reply.user?.display_name || "User"}</p>
                                      <p className="text-xs text-muted-foreground mb-2">
                                        {new Date(reply.created_at).toLocaleDateString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                        })}
                                      </p>
                                      <p className="text-sm mb-2">{reply.content}</p>
                                      <div className="flex gap-3">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleLikeComment(reply.id, reply.likes_count || 0)}
                                          className={`gap-2 h-8 text-xs ${isReplyLiked ? "text-primary" : "text-muted-foreground"}`}
                                        >
                                          <ThumbsUp className={`w-3 h-3 ${isReplyLiked ? "fill-current" : ""}`} />
                                          {replyLikeCount > 0 && replyLikeCount}
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {/* Reply form */}
                          {replyingTo === comment.id && (
                            <div className="ml-8 mt-4 space-y-3 bg-muted/30 p-4 rounded-lg">
                              <Textarea
                                placeholder="Write a reply..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                className="resize-none text-sm"
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleAddReply(comment.id)}
                                  disabled={!replyText.trim() || submittingReply}
                                  size="sm"
                                  className="gradient-bg gap-2"
                                >
                                  {submittingReply ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Send className="w-3 h-3" />
                                  )}
                                  Reply
                                </Button>
                                <Button
                                  onClick={() => {
                                    setReplyingTo(null)
                                    setReplyText("")
                                  }}
                                  variant="ghost"
                                  size="sm"
                                  className="gap-2"
                                >
                                  <X className="w-3 h-3" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Divider */}
                          <div className="border-b border-border/50 mt-4 last:border-0" />
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  )
}
