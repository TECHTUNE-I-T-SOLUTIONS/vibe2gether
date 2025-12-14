"use client"

import { useState } from "react"
import Image from "next/image"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Search, SlidersHorizontal, Heart, X, MapPin, Verified, Sparkles, MessageCircle, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

const users = [
  {
    id: 1,
    name: "Emma Watson",
    age: 28,
    location: "New York, USA",
    image: "/beautiful-woman-portrait-photography.jpg",
    verified: true,
    vibeScore: 95,
    bio: "Adventure seeker & coffee enthusiast. Looking for someone to explore the world with.",
    interests: ["Travel", "Art", "Music", "Photography"],
    online: true,
  },
  {
    id: 2,
    name: "James Chen",
    age: 32,
    location: "London, UK",
    image: "/handsome-man-portrait-professional-photo.jpg",
    verified: true,
    vibeScore: 92,
    bio: "Tech entrepreneur by day, chef by night. Let's cook up something special!",
    interests: ["Fitness", "Tech", "Food", "Wine"],
    online: false,
  },
  {
    id: 3,
    name: "Sofia Garcia",
    age: 26,
    location: "Barcelona, Spain",
    image: "/beautiful-latina-woman-portrait.jpg",
    verified: true,
    vibeScore: 98,
    bio: "Dancer, dreamer, and hopeless romantic. Life is better when you're dancing!",
    interests: ["Dance", "Photography", "Movies", "Fashion"],
    online: true,
  },
  {
    id: 4,
    name: "Marcus Johnson",
    age: 30,
    location: "Toronto, Canada",
    image: "/athletic-man-portrait-outdoor.jpg",
    verified: false,
    vibeScore: 88,
    bio: "Sports fanatic and weekend warrior. Looking for my teammate for life.",
    interests: ["Sports", "Gaming", "Travel", "Music"],
    online: false,
  },
  {
    id: 5,
    name: "Yuki Tanaka",
    age: 27,
    location: "Tokyo, Japan",
    image: "/beautiful-asian-woman-portrait-elegant.jpg",
    verified: true,
    vibeScore: 96,
    bio: "Artist and anime lover. Looking for someone to share quiet moments and big adventures.",
    interests: ["Anime", "Cooking", "Fashion", "Art"],
    online: true,
  },
  {
    id: 6,
    name: "Alessandro Rossi",
    age: 34,
    location: "Milan, Italy",
    image: "/italian-man-stylish-portrait.jpg",
    verified: true,
    vibeScore: 91,
    bio: "Fashion designer with a passion for wine and art. Life is too short for bad coffee.",
    interests: ["Fashion", "Wine", "Art", "Travel"],
    online: false,
  },
  {
    id: 7,
    name: "Olivia Brown",
    age: 29,
    location: "Sydney, Australia",
    image: "/australian-woman-beach-portrait.jpg",
    verified: true,
    vibeScore: 94,
    bio: "Beach lover and sunset chaser. Looking for someone to watch the waves with.",
    interests: ["Surfing", "Yoga", "Travel", "Photography"],
    online: true,
  },
  {
    id: 8,
    name: "Lucas Martin",
    age: 31,
    location: "Paris, France",
    image: "/french-man-portrait-artistic.jpg",
    verified: true,
    vibeScore: 89,
    bio: "Writer and philosopher. Looking for deep conversations and meaningful connections.",
    interests: ["Writing", "Philosophy", "Art", "Cinema"],
    online: false,
  },
]

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [ageRange, setAgeRange] = useState([18, 50])
  const [gender, setGender] = useState("all")
  const [location, setLocation] = useState("worldwide")
  const [likedUsers, setLikedUsers] = useState<number[]>([])

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.location.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleLike = (userId: number) => {
    setLikedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <Header />
      <main className="pt-20 md:pt-24">
        {/* Search Header */}
        <div className="sticky top-16 md:top-20 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search by name or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 rounded-full bg-muted/50"
                />
              </div>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="h-12 w-12 rounded-full shrink-0 bg-transparent">
                    <SlidersHorizontal className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-6 mt-6 p-4">
                    {/* Age Range */}
                    <div>
                      <label className="text-sm font-medium mb-3 block">
                        Age Range: {ageRange[0]} - {ageRange[1]}
                      </label>
                      <Slider
                        value={ageRange}
                        onValueChange={setAgeRange}
                        min={18}
                        max={80}
                        step={1}
                        className="mt-2"
                      />
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="text-sm font-medium mb-3 block">Gender</label>
                      <Select value={gender} onValueChange={setGender}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Location */}
                    <div>
                      <label className="text-sm font-medium mb-3 block">Location</label>
                      <Select value={location} onValueChange={setLocation}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="worldwide">Worldwide</SelectItem>
                          <SelectItem value="nearby">Near Me</SelectItem>
                          <SelectItem value="country">My Country</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button className="w-full gradient-bg rounded-full">Apply Filters</Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Users Grid */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredUsers.map((user) => (
              <Card
                key={user.id}
                className="group overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300"
              >
                <div className="relative aspect-[4/5]">
                  <Image
                    src={user.image || "/placeholder.svg"}
                    alt={user.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Online Indicator */}
                  {user.online && (
                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-green-500/90 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      Online
                    </div>
                  )}

                  {/* Vibe Score */}
                  <div className="absolute top-4 right-4">
                    <Badge className="gradient-bg text-primary-foreground font-semibold">
                      <Sparkles className="w-3 h-3 mr-1" />
                      {user.vibeScore}%
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="rounded-full w-12 h-12 bg-white/20 backdrop-blur-sm hover:bg-white/40 text-white border-0"
                    >
                      <X className="w-6 h-6" />
                    </Button>
                    <Button
                      size="icon"
                      className={cn(
                        "rounded-full w-14 h-14 border-0",
                        likedUsers.includes(user.id)
                          ? "gradient-bg text-white"
                          : "bg-white/20 backdrop-blur-sm hover:bg-white/40 text-white",
                      )}
                      onClick={() => handleLike(user.id)}
                    >
                      <Heart className={cn("w-7 h-7", likedUsers.includes(user.id) && "fill-white")} />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="rounded-full w-12 h-12 bg-white/20 backdrop-blur-sm hover:bg-white/40 text-white border-0"
                    >
                      <MessageCircle className="w-6 h-6" />
                    </Button>
                  </div>

                  {/* Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-white">
                        {user.name}, {user.age}
                      </h3>
                      {user.verified && <Verified className="w-5 h-5 text-blue-400 fill-blue-400" />}
                    </div>
                    <div className="flex items-center gap-1 text-white/80 text-sm">
                      <MapPin className="w-4 h-4" />
                      {user.location}
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4">
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{user.bio}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {user.interests.slice(0, 3).map((interest) => (
                      <Badge key={interest} variant="secondary" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                    {user.interests.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{user.interests.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Load More */}
          <div className="flex justify-center mt-12">
            <Button variant="outline" size="lg" className="rounded-full bg-transparent">
              <RefreshCw className="w-5 h-5 mr-2" />
              Load More Profiles
            </Button>
          </div>
        </div>
      </main>
      <Footer />
      <MobileNav />
    </div>
  )
}
