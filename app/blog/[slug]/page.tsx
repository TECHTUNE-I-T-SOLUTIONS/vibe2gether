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
import { Loader2, Heart, MessageCircle, Share2, User, Clock, ArrowLeft, Send } from "lucide-react"
import { getBlogPost } from "@/lib/supabase/queries"
import { createClient } from "@/lib/supabase/client"

export default function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const { data: session } = useSession()
  const router = useRouter()
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [comments, setComments] = useState<any[]>([])
  const [commentText, setCommentText] = useState("")
  const [submittingComment, setSubmittingComment] = useState(false)
  const [loadingComments, setLoadingComments] = useState(false)

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
    } catch (err) {
      console.error("Failed to load comments:", err)
    } finally {
      setLoadingComments(false)
    }
  }

  const handleLike = async () => {
    if (!session?.user?.id) {
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
    }
  }

  const handleAddComment = async () => {
    if (!session?.user?.id) {
      router.push("/login")
      return
    }

    if (!commentText.trim()) return

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
            user: userData,
          },
          ...comments,
        ])

        // Increment comment count
        await createClient()
          .from("blog_posts")
          .update({ comments_count: (post.comments_count || 0) + 1 })
          .eq("id", post.id)
      }
    } catch (err) {
      console.error("Failed to add comment:", err)
    } finally {
      setSubmittingComment(false)
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
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-4 pb-4 border-b border-border/50 last:border-0">
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
                          <p className="text-sm">{comment.content}</p>
                        </div>
                      </div>
                    ))}
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
