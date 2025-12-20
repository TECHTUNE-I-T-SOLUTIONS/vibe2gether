"use client"

import { useState, useEffect } from "react"
import { Loader2, ArrowLeft, User, Calendar, Share2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useUserProfile } from "@/hooks/use-user-profile"
import { getBlogPostBySlug, getBlogComments } from "@/lib/supabase/queries"
import Image from "next/image"
import { Textarea } from "@/components/ui/textarea"

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const { user } = useUserProfile()
  const [post, setPost] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState("")
  const [submittingComment, setSubmittingComment] = useState(false)

  useEffect(() => {
    fetchPost()
  }, [params.slug])

  async function fetchPost() {
    try {
      setLoading(true)
      const { data } = await getBlogPostBySlug(params.slug)
      setPost(data)

      if (data?.id) {
        const { data: commentsData } = await getBlogComments(data.id)
        setComments(commentsData || [])
      }
    } catch (err) {
      console.error("Failed to fetch post:", err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmitComment() {
    if (!user || !post || !newComment.trim()) return

    try {
      setSubmittingComment(true)
      // In a real app, would call createBlogComment
      // For now, just refresh comments
      await fetchPost()
      setNewComment("")
    } catch (err) {
      console.error("Failed to submit comment:", err)
    } finally {
      setSubmittingComment(false)
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  function formatReadTime(content: string) {
    const wordsPerMinute = 200
    const words = content.split(/\s+/).length
    const minutes = Math.ceil(words / wordsPerMinute)
    return `${minutes} min read`
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
      <div className="space-y-6">
        <Link href="/dashboard/blog">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Button>
        </Link>
        <p className="text-muted-foreground">Post not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <Link href="/dashboard/blog">
        <Button variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Blog
        </Button>
      </Link>

      {post.thumbnail && (
        <div className="relative h-96 w-full rounded-lg overflow-hidden">
          <Image
            src={post.thumbnail}
            alt={post.title}
            fill
            className="object-cover"
          />
        </div>
      )}

      <article className="space-y-6">
        <div className="space-y-3">
          {post.category && (
            <div className="inline-block">
              <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">
                {post.category}
              </span>
            </div>
          )}
          <h1 className="text-4xl font-bold">{post.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {post.user && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-muted overflow-hidden">
                  {post.user.profile_picture && (
                    <Image
                      src={post.user.profile_picture}
                      alt={post.user.display_name}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <span>{post.user.display_name}</span>
              </div>
            )}
            {post.created_at && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(post.created_at)}</span>
              </div>
            )}
            {post.content && (
              <span>{formatReadTime(post.content)}</span>
            )}
          </div>
        </div>

        <div className="prose dark:prose-invert max-w-none">
          {post.excerpt && (
            <p className="text-lg text-muted-foreground italic">{post.excerpt}</p>
          )}

          <div className="whitespace-pre-wrap text-foreground">
            {post.content}
          </div>
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-4 border-t border-border/50">
            {post.tags.map((tag: string) => (
              <span key={tag} className="text-xs bg-muted px-2 py-1 rounded">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </article>

      {/* Comments Section */}
      <Card className="border-border/50 mt-8">
        <CardHeader>
          <h2 className="text-2xl font-bold">Comments ({comments.length})</h2>
        </CardHeader>
        <CardContent className="space-y-6">
          {user && (
            <div className="space-y-3 pb-6 border-b border-border/50">
              <Textarea
                placeholder="Share your thoughts..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-24"
              />
              <Button
                onClick={handleSubmitComment}
                disabled={submittingComment || !newComment.trim()}
              >
                {submittingComment ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  "Post Comment"
                )}
              </Button>
            </div>
          )}

          {comments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No comments yet. Be the first!</p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {comment.user?.profile_picture && (
                        <div className="w-8 h-8 rounded-full overflow-hidden">
                          <Image
                            src={comment.user.profile_picture}
                            alt={comment.user.display_name}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-sm">{comment.user?.display_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
