"use client"

import { useState } from "react"
import Image from "next/image"
import { Search, Filter, MoreHorizontal, Eye, Trash2, Flag, Star, Heart, MessageCircle } from "lucide-react"
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
import { Checkbox } from "@/components/ui/checkbox"

const posts = [
  {
    id: 1,
    author: { name: "Emma Rodriguez", avatar: "/emma-woman-avatar.jpg", verified: true },
    content: "Amazing sunset at the beach today! Who wants to join me next time?",
    media: [{ type: "image", url: "/romantic-couple-sunset.png" }],
    likes: 1234,
    comments: 89,
    views: 5678,
    status: "published",
    flagged: false,
    featured: true,
    createdAt: "2 hours ago",
  },
  {
    id: 2,
    author: { name: "James Chen", avatar: "/placeholder.svg?height=40&width=40", verified: false },
    content: "Looking for someone to explore the city with this weekend!",
    media: [],
    likes: 456,
    comments: 23,
    views: 1234,
    status: "published",
    flagged: true,
    featured: false,
    createdAt: "4 hours ago",
  },
  {
    id: 3,
    author: { name: "Sofia Martinez", avatar: "/placeholder.svg?height=40&width=40", verified: true },
    content: "Coffee date anyone? ☕",
    media: [
      { type: "image", url: "/couple-coffee-date.png" },
      { type: "image", url: "/couple-coffee-date.png" },
    ],
    likes: 789,
    comments: 45,
    views: 2345,
    status: "published",
    flagged: false,
    featured: false,
    createdAt: "6 hours ago",
  },
  {
    id: 4,
    author: { name: "Marcus Williams", avatar: "/placeholder.svg?height=40&width=40", verified: false },
    content: "This is some inappropriate content that was flagged",
    media: [],
    likes: 12,
    comments: 3,
    views: 156,
    status: "under_review",
    flagged: true,
    featured: false,
    createdAt: "1 day ago",
  },
]

const stats = [
  { label: "Total Posts", value: "156,892" },
  { label: "Published Today", value: "2,341" },
  { label: "Pending Review", value: "23" },
  { label: "Flagged", value: "8" },
]

export default function AdminPostsPage() {
  const [selectedPosts, setSelectedPosts] = useState<number[]>([])

  const toggleSelect = (id: number) => {
    setSelectedPosts((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
  }

  const toggleSelectAll = () => {
    if (selectedPosts.length === posts.length) {
      setSelectedPosts([])
    } else {
      setSelectedPosts(posts.map((p) => p.id))
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Post Management</h1>
        <p className="text-muted-foreground">View, moderate, and manage all platform posts</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-border/50 mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search posts by content or author..." className="pl-10" />
            </div>
            <div className="flex gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="removed">Removed</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="text">Text Only</SelectItem>
                  <SelectItem value="image">With Images</SelectItem>
                  <SelectItem value="video">With Video</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="bg-transparent">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedPosts.length > 0 && (
        <div className="flex items-center gap-4 mb-4 p-4 bg-muted rounded-xl">
          <span className="text-sm font-medium">{selectedPosts.length} selected</span>
          <Button size="sm" variant="outline" className="bg-transparent">
            <Star className="w-4 h-4 mr-2" />
            Feature
          </Button>
          <Button size="sm" variant="outline" className="bg-transparent">
            <Flag className="w-4 h-4 mr-2" />
            Flag
          </Button>
          <Button size="sm" variant="destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      )}

      {/* Posts List */}
      <Card className="border-border/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="py-4 px-4 w-10">
                    <Checkbox checked={selectedPosts.length === posts.length} onCheckedChange={toggleSelectAll} />
                  </th>
                  <th className="text-left py-4 px-4 font-medium text-muted-foreground">Post</th>
                  <th className="text-left py-4 px-4 font-medium text-muted-foreground">Media</th>
                  <th className="text-left py-4 px-4 font-medium text-muted-foreground">Engagement</th>
                  <th className="text-left py-4 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-4 px-4 font-medium text-muted-foreground">Date</th>
                  <th className="text-right py-4 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr
                    key={post.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <Checkbox
                        checked={selectedPosts.includes(post.id)}
                        onCheckedChange={() => toggleSelect(post.id)}
                      />
                    </td>
                    <td className="py-4 px-4 max-w-md">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10 flex-shrink-0">
                          <AvatarImage src={post.author.avatar || "/placeholder.svg"} />
                          <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{post.author.name}</span>
                            {post.featured && (
                              <Badge className="gradient-bg text-xs">
                                <Star className="w-3 h-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{post.content}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {post.media.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-12 rounded-lg overflow-hidden relative bg-muted">
                            <Image
                              src={post.media[0].url || "/placeholder.svg"}
                              alt="Post media"
                              fill
                              className="object-cover"
                            />
                          </div>
                          {post.media.length > 1 && <Badge variant="outline">+{post.media.length - 1}</Badge>}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">No media</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4 text-primary" />
                          {post.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4 text-muted-foreground" />
                          {post.comments}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4 text-muted-foreground" />
                          {post.views}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={post.status === "published" ? "default" : "secondary"}
                          className={post.status === "published" ? "bg-green-500" : ""}
                        >
                          {post.status.replace("_", " ")}
                        </Badge>
                        {post.flagged && (
                          <Badge variant="destructive">
                            <Flag className="w-3 h-3 mr-1" />
                            Flagged
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">{post.createdAt}</td>
                    <td className="py-4 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-full">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View Post
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Star className="w-4 h-4 mr-2" />
                            {post.featured ? "Unfeature" : "Feature"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-orange-500">
                            <Flag className="w-4 h-4 mr-2" />
                            Flag for Review
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Post
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
