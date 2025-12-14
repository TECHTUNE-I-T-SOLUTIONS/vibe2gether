"use client"

import { useState } from "react"
import Image from "next/image"
import { Bookmark, Heart, Trash2, Grid, List, Filter, MapPin, Verified, Star, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const savedProfiles = [
  {
    id: 1,
    name: "Emma",
    age: 28,
    location: "New York, USA",
    image: "/emma-woman-avatar.jpg",
    vibeScore: 95,
    verified: true,
    premium: true,
    savedAt: "2 days ago",
  },
  {
    id: 2,
    name: "Sofia",
    age: 26,
    location: "Miami, USA",
    image: "/professional-woman-avatar.png",
    vibeScore: 92,
    verified: true,
    premium: false,
    savedAt: "3 days ago",
  },
  {
    id: 3,
    name: "Yuki",
    age: 27,
    location: "Los Angeles, USA",
    image: "/smiling-woman-avatar.png",
    vibeScore: 89,
    verified: true,
    premium: false,
    savedAt: "5 days ago",
  },
  {
    id: 4,
    name: "Isabella",
    age: 25,
    location: "Chicago, USA",
    image: "/placeholder.svg?height=400&width=400",
    vibeScore: 87,
    verified: false,
    premium: false,
    savedAt: "1 week ago",
  },
]

const savedPosts = [
  {
    id: 1,
    author: { name: "Emma R.", avatar: "/emma-woman-avatar.jpg" },
    content: "Amazing sunset at the beach today!",
    image: "/romantic-couple-sunset.png",
    likes: 1234,
    savedAt: "1 day ago",
  },
  {
    id: 2,
    author: { name: "James C.", avatar: "/placeholder.svg?height=40&width=40" },
    content: "Best coffee spot in the city!",
    image: "/couple-coffee-date.png",
    likes: 567,
    savedAt: "3 days ago",
  },
  {
    id: 3,
    author: { name: "Sofia M.", avatar: "/placeholder.svg?height=40&width=40" },
    content: "Travel tips for solo adventurers",
    image: "/placeholder.svg?height=300&width=400",
    likes: 890,
    savedAt: "1 week ago",
  },
]

const savedProducts = [
  {
    id: 1,
    name: "Romantic Dinner Experience",
    price: "$150",
    image: "/placeholder.svg?height=200&width=200",
    seller: "Date Night Co.",
    savedAt: "2 days ago",
  },
  {
    id: 2,
    name: "Custom Love Letter",
    price: "$25",
    image: "/placeholder.svg?height=200&width=200",
    seller: "Love Letters Inc.",
    savedAt: "5 days ago",
  },
]

export default function SavedPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Saved Items</h1>
          <p className="text-muted-foreground">Your bookmarked profiles, posts, and products</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            className={`rounded-full ${viewMode === "grid" ? "gradient-bg" : "bg-transparent"}`}
            onClick={() => setViewMode("grid")}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            className={`rounded-full ${viewMode === "list" ? "gradient-bg" : "bg-transparent"}`}
            onClick={() => setViewMode("list")}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="profiles" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TabsList className="bg-muted/50 p-1 rounded-full">
            <TabsTrigger value="profiles" className="rounded-full">
              Profiles ({savedProfiles.length})
            </TabsTrigger>
            <TabsTrigger value="posts" className="rounded-full">
              Posts ({savedPosts.length})
            </TabsTrigger>
            <TabsTrigger value="products" className="rounded-full">
              Products ({savedProducts.length})
            </TabsTrigger>
          </TabsList>
          <Button variant="outline" className="rounded-full bg-transparent">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>

        {/* Saved Profiles */}
        <TabsContent value="profiles">
          <div className={`grid gap-4 ${viewMode === "grid" ? "sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1"}`}>
            {savedProfiles.map((profile) => (
              <Card key={profile.id} className="border-border/50 overflow-hidden group">
                {viewMode === "grid" ? (
                  <>
                    <div className="relative aspect-[4/5]">
                      <Image
                        src={profile.image || "/placeholder.svg"}
                        alt={profile.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40"
                      >
                        <Bookmark className="w-4 h-4 text-white fill-white" />
                      </Button>
                      <Badge className="absolute top-2 left-2 gradient-bg">{profile.vibeScore}%</Badge>
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="flex items-center gap-1 mb-1">
                          <h3 className="text-white font-semibold">
                            {profile.name}, {profile.age}
                          </h3>
                          {profile.verified && <Verified className="w-4 h-4 text-blue-400 fill-blue-400" />}
                          {profile.premium && <Star className="w-4 h-4 text-accent fill-accent" />}
                        </div>
                        <p className="text-white/80 text-sm flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {profile.location}
                        </p>
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Saved {profile.savedAt}
                        </span>
                        <Button size="sm" variant="ghost" className="text-destructive h-7 px-2">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                      <Image
                        src={profile.image || "/placeholder.svg"}
                        alt={profile.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">
                          {profile.name}, {profile.age}
                        </h3>
                        {profile.verified && <Verified className="w-4 h-4 text-blue-500 fill-blue-500" />}
                        <Badge className="gradient-bg text-xs">{profile.vibeScore}%</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {profile.location}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Saved {profile.savedAt}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="rounded-full gradient-bg">
                        View Profile
                      </Button>
                      <Button size="icon" variant="ghost" className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Saved Posts */}
        <TabsContent value="posts">
          <div className={`grid gap-4 ${viewMode === "grid" ? "sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
            {savedPosts.map((post) => (
              <Card key={post.id} className="border-border/50 overflow-hidden">
                {viewMode === "grid" ? (
                  <>
                    <div className="relative aspect-video">
                      <Image src={post.image || "/placeholder.svg"} alt={post.content} fill className="object-cover" />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40"
                      >
                        <Bookmark className="w-4 h-4 text-white fill-white" />
                      </Button>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden">
                          <Image src={post.author.avatar || "/placeholder.svg"} alt={post.author.name} fill />
                        </div>
                        <span className="text-sm font-medium">{post.author.name}</span>
                      </div>
                      <p className="text-sm line-clamp-2 mb-2">{post.content}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {post.likes}
                        </span>
                        <span>Saved {post.savedAt}</span>
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                      <Image src={post.image || "/placeholder.svg"} alt={post.content} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="relative w-6 h-6 rounded-full overflow-hidden">
                          <Image src={post.author.avatar || "/placeholder.svg"} alt={post.author.name} fill />
                        </div>
                        <span className="text-sm font-medium">{post.author.name}</span>
                      </div>
                      <p className="text-sm line-clamp-2">{post.content}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" /> {post.likes}
                        </span>
                        <span>Saved {post.savedAt}</span>
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" className="text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Saved Products */}
        <TabsContent value="products">
          <div className={`grid gap-4 ${viewMode === "grid" ? "sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1"}`}>
            {savedProducts.map((product) => (
              <Card key={product.id} className="border-border/50 overflow-hidden">
                {viewMode === "grid" ? (
                  <>
                    <div className="relative aspect-square">
                      <Image
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40"
                      >
                        <Bookmark className="w-4 h-4 text-white fill-white" />
                      </Button>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold line-clamp-1">{product.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{product.seller}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold gradient-text">{product.price}</span>
                        <span className="text-xs text-muted-foreground">{product.savedAt}</span>
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                      <Image
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">{product.seller}</p>
                      <p className="font-bold gradient-text mt-1">{product.price}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="rounded-full gradient-bg">
                        View
                      </Button>
                      <Button size="icon" variant="ghost" className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
