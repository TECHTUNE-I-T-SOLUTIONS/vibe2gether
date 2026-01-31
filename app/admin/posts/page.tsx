"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Search, Eye, Trash2, Flag, Heart, MessageCircle, Loader2, MoreVertical, Check, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Post {
  id: string
  content: string
  created_at: string
  status: string
  is_flagged: boolean
  is_featured: boolean
  user_id: string
  users: {
    id: string
    full_name: string
    profile_picture?: string
    email: string
  }
  likes_count?: number
  comments_count?: number
  views_count?: number
  media?: Array<{
    type?: string
    url?: string
  } | string>
}

interface Stats {
  total: number
  published: number
  underReview: number
  flagged: number
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, published: 0, underReview: 0, flagged: 0 })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [flaggedFilter, setFlaggedFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [previewPostId, setPreviewPostId] = useState<string | null>(null)

  useEffect(() => {
    fetchPosts()
  }, [statusFilter, flaggedFilter])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (flaggedFilter !== "all") params.append("flagged", flaggedFilter)

      const response = await fetch(`/api/admin/posts?${params}`)
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts || [])
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/admin/posts?id=${postId}`, { method: "DELETE" })
      if (response.ok) {
        setPosts(posts.filter(p => p.id !== postId))
        setDeleteId(null)
      }
    } catch (error) {
      console.error("Failed to delete post:", error)
    }
  }

  const handleFlagToggle = async (postId: string, currentFlag: boolean) => {
    try {
      const response = await fetch(`/api/admin/posts`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: postId, is_flagged: !currentFlag })
      })
      if (response.ok) {
        setPosts(posts.map(p => p.id === postId ? { ...p, is_flagged: !currentFlag } : p))
      }
    } catch (error) {
      console.error("Failed to toggle flag:", error)
    }
  }

  const handleFeatureToggle = async (postId: string, currentFeature: boolean) => {
    try {
      const response = await fetch(`/api/admin/posts`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: postId, is_featured: !currentFeature })
      })
      if (response.ok) {
        setPosts(posts.map(p => p.id === postId ? { ...p, is_featured: !currentFeature } : p))
      }
    } catch (error) {
      console.error("Failed to toggle feature:", error)
    }
  }

  const handleStatusChange = async (postId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/posts`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: postId, status: newStatus })
      })
      if (response.ok) {
        setPosts(posts.map(p => p.id === postId ? { ...p, status: newStatus } : p))
      }
    } catch (error) {
      console.error("Failed to update post status:", error)
    }
  }

  const filteredPosts = posts.filter((post) => {
    if (searchQuery && !post.content.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (activeTab !== "all" && post.status !== activeTab) {
      return false
    }
    return true
  })

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 w-4xl max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Manage Posts</h1>
        <p className="text-muted-foreground">Review, moderate, and manage user posts</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Posts</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Published</p>
              <p className="text-3xl font-bold">{stats.published}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Under Review</p>
              <p className="text-3xl font-bold">{stats.underReview}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Flagged</p>
              <p className="text-3xl font-bold text-destructive">{stats.flagged}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border/50 mb-6">
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search posts..."
                  className="pl-10 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Flagged</label>
              <Select value={flaggedFilter} onValueChange={setFlaggedFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Posts</SelectItem>
                  <SelectItem value="true">Flagged Only</SelectItem>
                  <SelectItem value="false">Not Flagged</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 p-1 rounded-lg mb-6 grid grid-cols-3 w-auto max-w-5xl">
          <TabsTrigger value="all" className="rounded">All</TabsTrigger>
          <TabsTrigger value="published" className="rounded">Published</TabsTrigger>
          <TabsTrigger value="under_review" className="rounded">Review</TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground text-lg">No posts found</p>
            </CardContent>
          </Card>
        ) : (
          <TabsContent value={activeTab} className="space-y-4 w-xl">
            {filteredPosts.map((post) => (
              <Card key={post.id} className="border-border/50 hover:border-border/80 transition-colors">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Left Section */}
                    <div className="flex-1 min-w-0">
                      {/* Author */}
                      <div className="flex items-center gap-3 mb-4">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={post.users?.profile_picture} />
                          <AvatarFallback>{post.users?.full_name?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{post.users?.full_name || "Unknown User"}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(post.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Content */}
                      <p className="text-foreground mb-3">{post.content}</p>

                      {/* Media - Images/Videos */}
                      {post.media && Array.isArray(post.media) && post.media.length > 0 && (
                        <div className="mb-3 space-y-2">
                          {post.media.map((item: any, index: number) => {
                            const mediaUrl = typeof item === "string" ? item : item?.url || ""
                            const isVideo = typeof mediaUrl === "string" && /\.(mp4|webm|mov)$/i.test(mediaUrl)
                            
                            if (!mediaUrl) return null
                            
                            return (
                              <div key={index} className="relative w-full rounded-sm overflow-hidden flex justify-center">
                                {/* Blurred background */}
                                <div
                                  className="absolute inset-0 rounded-sm"
                                  style={{
                                    backgroundImage: `url(${mediaUrl})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    filter: 'blur(40px) brightness(0.6)',
                                    zIndex: 0,
                                  }}
                                />
                                {/* Main media */}
                                <div className="relative z-10 flex items-center justify-center" style={{ minHeight: '250px' }}>
                                  {isVideo ? (
                                    <video
                                      src={mediaUrl}
                                      controls
                                      autoPlay
                                      muted
                                      className="blur(40px) w-2xl h-auto max-h-auto object-contain rounded-lg"
                                    />
                                  ) : (
                                    <img
                                      src={mediaUrl}
                                      alt={`Post media ${index + 1}`}
                                      className="w-auto max-h-auto object-contain rounded-lg hover:scale-105 transition-transform cursor-pointer"
                                    />
                                  )}
                                </div>
                                {/* Inset shadow for blending */}
                                <div
                                  className="absolute inset-0 rounded-sm"
                                  style={{
                                    boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.3)',
                                    zIndex: 5,
                                    pointerEvents: 'none',
                                  }}
                                />
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Badges */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant={post.status === "published" ? "default" : "secondary"}>
                          {post.status?.replace(/_/g, " ")}
                        </Badge>
                        {post.is_flagged && (
                          <Badge className="bg-destructive text-white">Flagged</Badge>
                        )}
                        {post.is_featured && (
                          <Badge className="bg-purple-500 text-white">Featured</Badge>
                        )}
                      </div>

                      {/* Engagement */}
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          <span>{post.likes_count || 0} likes</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{post.comments_count || 0} comments</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>{post.views_count || 0} views</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Section - Actions */}
                    <div className="flex flex-col gap-2 w-full lg:w-auto">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full lg:w-auto">
                            <MoreVertical className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setPreviewPostId(post.id)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleFeatureToggle(post.id, post.is_featured)}
                          >
                            {post.is_featured ? (
                              <>
                                <X className="w-4 h-4 mr-2" />
                                Unfeature
                              </>
                            ) : (
                              <>
                                <Check className="w-4 h-4 mr-2" />
                                Feature
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleFlagToggle(post.id, post.is_flagged)}
                            className={post.is_flagged ? "text-destructive" : ""}
                          >
                            <Flag className="w-4 h-4 mr-2" />
                            {post.is_flagged ? "Unflag" : "Flag"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <div onClick={(e) => e.stopPropagation()} className="w-full">
                              <Select value={post.status} onValueChange={(val) => handleStatusChange(post.id, val)}>
                                <SelectTrigger className="w-full border-0 p-0 h-auto">
                                  <span className="text-sm">Change Status</span>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="published">Publish</SelectItem>
                                  <SelectItem value="under_review">Under Review</SelectItem>
                                  <SelectItem value="archived">Archive</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive cursor-pointer"
                            onClick={() => setDeleteId(post.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        )}
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Post</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this post? This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex justify-end gap-3 mt-6">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDeletePost(deleteId)}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Post Modal */}
      <Dialog open={!!previewPostId} onOpenChange={(open) => !open && setPreviewPostId(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Post Details</DialogTitle>
          </DialogHeader>
          {previewPostId && posts.find(p => p.id === previewPostId) && (
            (() => {
              const post = posts.find(p => p.id === previewPostId)!
              return (
                <div className="space-y-4">
                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={post.users?.profile_picture} />
                      <AvatarFallback>{post.users?.full_name?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{post.users?.full_name || "Unknown User"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(post.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Content */}
                  <p className="text-foreground">{post.content}</p>

                  {/* Media */}
                  {post.media && Array.isArray(post.media) && post.media.length > 0 && (
                    <div className="space-y-2">
                      {post.media.map((item: any, index: number) => {
                        const mediaUrl = typeof item === "string" ? item : item?.url || ""
                        const isVideo = typeof mediaUrl === "string" && /\.(mp4|webm|mov)$/i.test(mediaUrl)
                        
                        if (!mediaUrl) return null
                        
                        return (
                          <div key={index} className="relative w-full rounded-lg overflow-hidden">
                            {/* Blurred background */}
                            <div
                              className="absolute inset-0 rounded-lg"
                              style={{
                                backgroundImage: `url(${mediaUrl})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                filter: 'blur(40px) brightness(0.6)',
                                zIndex: 0,
                              }}
                            />
                            {/* Main media */}
                            <div className="relative z-10 flex items-center justify-center" style={{ minHeight: '200px' }}>
                              {isVideo ? (
                                <video
                                  src={mediaUrl}
                                  controls
                                  autoPlay
                                  muted
                                  className="w-full max-h-160 object-contain rounded-lg"
                                />
                              ) : (
                                <img
                                  src={mediaUrl}
                                  alt={`Post media ${index + 1}`}
                                  className="w-full max-h-160 object-contain rounded-sm"
                                />
                              )}
                            </div>
                            {/* Inset shadow for blending */}
                            <div
                              className="absolute inset-0 rounded-sm"
                              style={{
                                boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.3)',
                                zIndex: 5,
                                pointerEvents: 'none',
                              }}
                            />
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={post.status === "published" ? "default" : "secondary"}>
                      {post.status?.replace(/_/g, " ")}
                    </Badge>
                    {post.is_flagged && (
                      <Badge className="bg-destructive text-white">Flagged</Badge>
                    )}
                    {post.is_featured && (
                      <Badge className="bg-purple-500 text-white">Featured</Badge>
                    )}
                  </div>

                  {/* Engagement */}
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      <span>{post.likes_count || 0} likes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.comments_count || 0} comments</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{post.views_count || 0} views</span>
                    </div>
                  </div>
                </div>
              )
            })()
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
