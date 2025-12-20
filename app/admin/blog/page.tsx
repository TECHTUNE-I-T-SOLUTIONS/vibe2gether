"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Plus, Edit2, Trash2, Eye, EyeOff, Loader2, Search, Star } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { getBlogPosts, deleteBlogPost, updateBlogPost } from "@/lib/supabase/queries"

export default function BlogAdminPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [editingPost, setEditingPost] = useState<any>(null)

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    try {
      setLoading(true)
      const { data, error } = await getBlogPosts(100, 0)
      if (!error && data) {
        setPosts(data)
      }
    } catch (err) {
      console.error("Failed to fetch posts:", err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(postId: string) {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        await deleteBlogPost(postId)
        setPosts((prev) => prev.filter((p) => p.id !== postId))
      } catch (err) {
        console.error("Failed to delete post:", err)
      }
    }
  }

  async function handleToggleFeatured(post: any) {
    try {
      await updateBlogPost(post.id, {
        is_featured: !post.is_featured,
      })
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id ? { ...p, is_featured: !p.is_featured } : p
        )
      )
    } catch (err) {
      console.error("Failed to update post:", err)
    }
  }

  const filteredPosts = posts.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Blog Management</h1>
        <Button className="gradient-bg gap-2">
          <Plus className="w-4 h-4" />
          Create Post
        </Button>
      </div>

      {/* Search */}
      <Card className="border-border/50">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Blog Posts Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>All Posts ({filteredPosts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPosts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No posts found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-4">Post</th>
                    <th className="text-left py-3 px-4">Author</th>
                    <th className="text-left py-3 px-4">Category</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Views</th>
                    <th className="text-left py-3 px-4">Featured</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPosts.map((post) => (
                    <tr key={post.id} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {post.thumbnail_url && (
                            <div className="relative w-10 h-10 rounded overflow-hidden">
                              <Image
                                src={post.thumbnail_url}
                                alt={post.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-sm line-clamp-1">{post.title}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(post.published_at)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm">{post.user?.display_name}</p>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary">{post.category}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          className={
                            post.status === "published"
                              ? "bg-green-500/20 text-green-600"
                              : "bg-yellow-500/20 text-yellow-600"
                          }
                        >
                          {post.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm font-semibold">{post.views_count || 0}</p>
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleFeatured(post)}
                          className={post.is_featured ? "text-accent" : "text-muted-foreground"}
                        >
                          <Star
                            className="w-4 h-4"
                            fill={post.is_featured ? "currentColor" : "none"}
                          />
                        </Button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setEditingPost(post)}>
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Edit Post</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 max-h-96 overflow-y-auto">
                                <div>
                                  <Label>Title</Label>
                                  <Input
                                    value={editingPost?.title || ""}
                                    onChange={(e) =>
                                      setEditingPost({
                                        ...editingPost,
                                        title: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <Label>Excerpt</Label>
                                  <Textarea
                                    value={editingPost?.excerpt || ""}
                                    onChange={(e) =>
                                      setEditingPost({
                                        ...editingPost,
                                        excerpt: e.target.value,
                                      })
                                    }
                                    className="h-20"
                                  />
                                </div>
                                <div>
                                  <Label>Content</Label>
                                  <Textarea
                                    value={editingPost?.content || ""}
                                    onChange={(e) =>
                                      setEditingPost({
                                        ...editingPost,
                                        content: e.target.value,
                                      })
                                    }
                                    className="h-40"
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    id="featured"
                                    checked={editingPost?.is_featured || false}
                                    onCheckedChange={(checked) =>
                                      setEditingPost({
                                        ...editingPost,
                                        is_featured: checked,
                                      })
                                    }
                                  />
                                  <Label htmlFor="featured" className="cursor-pointer">
                                    Mark as Featured
                                  </Label>
                                </div>
                                <Button
                                  className="w-full gradient-bg"
                                  onClick={async () => {
                                    await updateBlogPost(editingPost.id, editingPost)
                                    setEditingPost(null)
                                    await fetchPosts()
                                  }}
                                >
                                  Save Changes
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(post.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
