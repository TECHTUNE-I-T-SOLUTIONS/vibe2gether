"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Plus, Edit2, Trash2, Eye, EyeOff, Loader2, Search, Star, Upload, X } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getBlogPosts, deleteBlogPost, updateBlogPost } from "@/lib/supabase/queries"
import { createClient } from "@/lib/supabase/client"

export default function BlogAdminPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [editingPost, setEditingPost] = useState<any>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingLoading, setEditingLoading] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "tech",
    thumbnail_url: "",
    status: "draft",
    is_featured: false,
  })
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const imageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/admin/auth/me")
      if (!response.ok) {
        router.push("/auth/login")
        return
      }
      setAuthChecked(true)
      fetchPosts()
    } catch (error) {
      console.error("Auth check failed:", error)
      router.push("/auth/login")
    }
  }

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

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setPreviewUrl(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  async function uploadImage() {
    if (!selectedImage) return

    setUploading(true)
    try {
      const supabase = createClient()
      const fileName = `${Date.now()}-${selectedImage.name}`

      const { data, error } = await supabase.storage
        .from("blog-thumbnails")
        .upload(fileName, selectedImage, { cacheControl: "3600", upsert: true })

      if (error) throw error

      const { data: urlData } = supabase.storage.from("blog-thumbnails").getPublicUrl(fileName)

      setFormData({ ...formData, thumbnail_url: urlData.publicUrl })
      setSelectedImage(null)
      setPreviewUrl("")
    } catch (error) {
      console.error("Image upload error:", error)
    } finally {
      setUploading(false)
    }
  }

  // Generate slug from title
  function generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 255)
  }

  async function handleCreatePost() {
    if (!formData.title || !formData.content) {
      alert("Please fill in title and content")
      return
    }

    // Get admin ID from session
    const sessionRes = await fetch("/api/admin/auth/me")
    const sessionData = await sessionRes.json()

    if (!sessionData.id) {
      alert("Unable to determine admin ID. Please log in again.")
      return
    }

    setCreating(true)
    try {
      const supabase = createClient()

      // Verify that the admin user exists in the users table
      const { data: authorUser, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("id", sessionData.id)
        .single()

      if (userError || !authorUser) {
        console.error("User validation error:", userError)
        alert("Your user account was not found. Your account may have been deactivated. Please contact support.")
        return
      }

      const slug = generateSlug(formData.title)

      const { data, error } = await supabase
        .from("blog_posts")
        .insert([
          {
            author_id: sessionData.id,
            title: formData.title,
            slug: slug,
            excerpt: formData.excerpt,
            content: formData.content,
            category: formData.category,
            thumbnail: formData.thumbnail_url,
            tags: [],
            is_published: formData.status === "published",
            is_featured: formData.is_featured,
            published_at: formData.status === "published" ? new Date().toISOString() : null,
          },
        ])
        .select()

      if (error) {
        console.error("Error creating post:", error)
        alert("Failed to create post: " + error.message)
        return
      }

      await fetchPosts()
      setCreateDialogOpen(false)
      setFormData({
        title: "",
        excerpt: "",
        content: "",
        category: "tech",
        thumbnail_url: "",
        status: "draft",
        is_featured: false,
      })
    } catch (err) {
      console.error("Failed to create post:", err)
      alert("Failed to create post. Please try again.")
    } finally {
      setCreating(false)
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

  async function handleEditPost() {
    if (!editingPost?.title) {
      alert("Title is required")
      return
    }

    setEditingLoading(true)
    try {
      let thumbnailUrl = editingPost.thumbnail_url
      if (editingPost.newThumbnail) {
        const file = editingPost.newThumbnail
        const fileExt = file.name.split(".").pop()
        const fileName = `${editingPost.id}-${Date.now()}.${fileExt}`
        const { error: uploadError } = await createClient()
          .storage
          .from("blog-thumbnails")
          .upload(fileName, file, { upsert: true })

        if (uploadError) throw uploadError
        const { data } = createClient().storage.from("blog-thumbnails").getPublicUrl(fileName)
        thumbnailUrl = data.publicUrl
      }

      await updateBlogPost(editingPost.id, {
        title: editingPost.title,
        excerpt: editingPost.excerpt,
        content: editingPost.content,
        category: editingPost.category,
        status: editingPost.status,
        is_featured: editingPost.is_featured,
        thumbnail_url: thumbnailUrl,
      })

      setPosts((prev) =>
        prev.map((p) => (p.id === editingPost.id ? { ...p, ...editingPost } : p))
      )
      setEditingPost(null)
      setEditDialogOpen(false)
    } catch (err: any) {
      console.error("Failed to update post:", err)
      alert("Failed to update post: " + err.message)
    } finally {
      setEditingLoading(false)
    }
  }

  async function handleToggleFeatured(post: any) {
    try {
      await updateBlogPost(post.id, {
        is_featured: !post.is_featured,
      })
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, is_featured: !p.is_featured } : p))
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

  if (!authChecked || loading) {
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
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-bg gap-2">
              <Plus className="w-4 h-4" />
              Create Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Blog Post</DialogTitle>
              <DialogDescription>Add a new blog post with thumbnail image</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input
                  placeholder="Post title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tech">Technology</SelectItem>
                    <SelectItem value="lifestyle">Lifestyle</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Excerpt</Label>
                <Textarea
                  placeholder="Short summary of the post"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="mt-2 h-20"
                />
              </div>

              <div>
                <Label>Content *</Label>
                <Textarea
                  placeholder="Full blog post content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="mt-2 h-40"
                />
              </div>

              <div>
                <Label>Thumbnail Image</Label>
                <div className="mt-2 space-y-4">
                  {previewUrl ? (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={previewUrl}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setPreviewUrl("")
                          setSelectedImage(null)
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      onClick={() => imageInputRef.current?.click()}
                      className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">Click to upload or drag and drop</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  )}
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  {selectedImage && !uploading && (
                    <Button
                      onClick={uploadImage}
                      variant="outline"
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Image
                    </Button>
                  )}
                  {uploading && (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Uploading...
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_featured: checked as boolean })
                  }
                />
                <Label htmlFor="featured" className="cursor-pointer">
                  Mark as Featured
                </Label>
              </div>

              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full gradient-bg"
                onClick={handleCreatePost}
                disabled={creating}
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Post"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Blog Post</DialogTitle>
              <DialogDescription>Update your blog post details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input
                  placeholder="Post title"
                  value={editingPost?.title || ""}
                  onChange={(e) =>
                    setEditingPost((prev: any) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Excerpt</Label>
                <Textarea
                  placeholder="Brief summary of the post"
                  value={editingPost?.excerpt || ""}
                  onChange={(e) =>
                    setEditingPost((prev: any) => ({
                      ...prev,
                      excerpt: e.target.value,
                    }))
                  }
                  className="mt-2"
                  rows={2}
                />
              </div>

              <div>
                <Label>Content</Label>
                <Textarea
                  placeholder="Full post content"
                  value={editingPost?.content || ""}
                  onChange={(e) =>
                    setEditingPost((prev: any) => ({
                      ...prev,
                      content: e.target.value,
                    }))
                  }
                  className="mt-2"
                  rows={6}
                />
              </div>

              <div>
                <Label>Category</Label>
                <Select
                  value={editingPost?.category || "tech"}
                  onValueChange={(value) =>
                    setEditingPost((prev: any) => ({
                      ...prev,
                      category: value,
                    }))
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tech">Technology</SelectItem>
                    <SelectItem value="lifestyle">Lifestyle</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Thumbnail Image</Label>
                {editingPost?.thumbnailPreview ? (
                  <div className="mt-2 relative">
                    <img
                      src={editingPost.thumbnailPreview}
                      alt="New thumbnail preview"
                      className="max-h-48 rounded border-2 border-green-500"
                    />
                    <p className="text-xs text-green-600 mt-2">New thumbnail (not yet saved)</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 w-full"
                      onClick={() => {
                        setEditingPost((prev: any) => ({
                          ...prev,
                          newThumbnail: null,
                          thumbnailPreview: null,
                        }))
                      }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remove New Image
                    </Button>
                  </div>
                ) : editingPost?.thumbnail_url ? (
                  <div className="mt-2 relative">
                    <img
                      src={editingPost.thumbnail_url}
                      alt="Current thumbnail"
                      className="max-h-48 rounded"
                    />
                    <p className="text-xs text-muted-foreground mt-2">Current thumbnail</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 w-full"
                      onClick={() => {
                        const input = document.createElement("input")
                        input.type = "file"
                        input.accept = "image/*"
                        input.onchange = (e: any) => {
                          const file = e.target.files[0]
                          const reader = new FileReader()
                          reader.onloadend = () => {
                            setEditingPost((prev: any) => ({
                              ...prev,
                              newThumbnail: file,
                              thumbnailPreview: reader.result as string,
                            }))
                          }
                          reader.readAsDataURL(file)
                        }
                        input.click()
                      }}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Change Thumbnail
                    </Button>
                  </div>
                ) : editingPost?.thumbnail_url ? (
                  <div className="mt-2 relative">
                    <img
                      src={editingPost.thumbnail_url}
                      alt="Current thumbnail"
                      className="max-h-40 rounded"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 w-full"
                      onClick={() => {
                        const input = document.createElement("input")
                        input.type = "file"
                        input.accept = "image/*"
                        input.onchange = (e: any) => {
                          const file = e.target.files[0]
                          const reader = new FileReader()
                          reader.onloadend = () => {
                            setEditingPost((prev: any) => ({
                              ...prev,
                              newThumbnail: file,
                              thumbnailPreview: reader.result as string,
                            }))
                          }
                          reader.readAsDataURL(file)
                        }
                        input.click()
                      }}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Change Image
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={() => {
                      const input = document.createElement("input")
                      input.type = "file"
                      input.accept = "image/*"
                      input.onchange = (e: any) => {
                        const file = e.target.files[0]
                        const reader = new FileReader()
                        reader.onloadend = () => {
                          setEditingPost((prev: any) => ({
                            ...prev,
                            newThumbnail: file,
                            thumbnailPreview: reader.result as string,
                          }))
                        }
                        reader.readAsDataURL(file)
                      }
                      input.click()
                    }}
                    className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">Click to upload thumbnail</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit-featured"
                  checked={editingPost?.is_featured || false}
                  onCheckedChange={(checked) =>
                    setEditingPost((prev: any) => ({
                      ...prev,
                      is_featured: checked as boolean,
                    }))
                  }
                />
                <Label htmlFor="edit-featured" className="cursor-pointer">
                  Mark as Featured
                </Label>
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  value={editingPost?.status || "draft"}
                  onValueChange={(value) =>
                    setEditingPost((prev: any) => ({
                      ...prev,
                      status: value,
                    }))
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full gradient-bg"
                onClick={handleEditPost}
                disabled={editingLoading}
              >
                {editingLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingPost(post)
                              setEditDialogOpen(true)
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
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
