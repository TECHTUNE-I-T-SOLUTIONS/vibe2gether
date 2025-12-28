"use client"

import { useState, useEffect, useRef } from "react"
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
import { Search, SlidersHorizontal, Heart, X, MapPin, Verified, Sparkles, MessageCircle, RefreshCw, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function ExplorePage() {
  const router = useRouter()
  const { toast } = useToast()
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCountry, setSelectedCountry] = useState("all")
  const [session, setSession] = useState<any>(null)
  const [followStatus, setFollowStatus] = useState<Map<string, boolean>>(new Map())
  const [following, setFollowing] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/auth/session")
        const data = await res.json()
        setSession(data)
      } catch (err) {
        console.error("Failed to fetch session:", err)
      }
    }
    fetchSession()
  }, [])

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true)
        const response = await fetch("/api/users/all?limit=100&page=1")
        if (response.ok) {
          const data = await response.json()
          setUsers(data.users || [])
          // Extract following status from API response
          const followingMap = new Set<string>()
          data.users?.forEach((user: any) => {
            if (user.isFollowing) {
              followingMap.add(user.id)
            }
          })
          setFollowing(followingMap)
        } else {
          setError("Failed to load users")
        }
      } catch (err) {
        console.error("Error fetching users:", err)
        setError("Failed to load users")
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  // Filter users based on search and country
  const filteredUsers = users.filter((user) => {
    if (hidden.has(user.id)) return false
    const countryMatch = selectedCountry === "all" || user.country === selectedCountry
    const searchMatch =
      searchQuery === "" ||
      (user.display_name && user.display_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.bio && user.bio.toLowerCase().includes(searchQuery.toLowerCase()))
    return countryMatch && searchMatch
  })

  const currentUser = filteredUsers[currentIndex]

  // Swipe handlers
  const handleSwipe = () => {
    if (touchEndX.current < touchStartX.current - 50) {
      // Swiped left
      handleHide()
    } else if (touchEndX.current > touchStartX.current + 50) {
      // Swiped right
      handleFollow()
    }
  }

  const handleFollow = async () => {
    if (!currentUser) return
    if (!session?.user) {
      toast({ title: "Please log in", description: "Sign in to follow users", variant: "destructive" })
      return
    }

    try {
      const isFollowing = following.has(currentUser.id)
      const response = await fetch(`/api/users/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          followingId: currentUser.id,
          action: isFollowing ? "unfollow" : "follow",
        }),
      })

      if (response.ok) {
        const newFollowing = new Set(following)
        if (isFollowing) {
          newFollowing.delete(currentUser.id)
          toast({ title: "Unfollowed", description: `You unfollowed ${currentUser.display_name}` })
        } else {
          newFollowing.add(currentUser.id)
          toast({ title: "Following!", description: `You're now following ${currentUser.display_name}` })
        }
        setFollowing(newFollowing)
      } else {
        toast({ title: "Error", description: "Failed to follow user", variant: "destructive" })
      }
    } catch (err) {
      console.error("Follow error:", err)
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" })
    }
  }

  const handleHide = () => {
    if (currentUser) {
      setHidden((prev) => new Set(prev).add(currentUser.id))
      nextProfile()
    }
  }

  const handleMessage = () => {
    if (!session?.user) {
      toast({ title: "Please log in", description: "Sign in to message users", variant: "destructive" })
      return
    }
    router.push(`/dashboard/messages?userId=${currentUser.id}`)
  }

  const nextProfile = () => {
    if (currentIndex < filteredUsers.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const prevProfile = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleRefresh = () => {
    setCurrentIndex(0)
    setHidden(new Set())
  }

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <Header />
      <main className="pt-20 md:pt-24">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-accent/10 via-primary/10 to-secondary/10 py-8 md:py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <Badge className="mb-3 gradient-bg text-primary-foreground">
                <Sparkles className="w-4 h-4 mr-1" />
                Explore
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold mb-3">
                Discover <span className="gradient-text">Amazing People</span>
              </h1>
              <p className="text-muted-foreground mb-6">
                Swipe to discover and connect with people who match your vibe
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or interests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-lg"
              />
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filter Preferences</SheetTitle>
                </SheetHeader>
                <div className="py-6 space-y-6">
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Country</label>
                    <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Countries</SelectItem>
                        <SelectItem value="USA">USA</SelectItem>
                        <SelectItem value="UK">UK</SelectItem>
                        <SelectItem value="Canada">Canada</SelectItem>
                        <SelectItem value="Australia">Australia</SelectItem>
                        <SelectItem value="Spain">Spain</SelectItem>
                        <SelectItem value="Japan">Japan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleRefresh} className="w-full gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Reset
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <Button onClick={handleRefresh} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              <p>{error}</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground mb-4">No users found matching your criteria</p>
              <Button onClick={handleRefresh} variant="outline">
                Reset Filters
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop: Grid View */}
              <div className="hidden lg:grid grid-cols-3 gap-6 mb-8">
                {filteredUsers.map((user, idx) => (
                  <div
                    key={user.id}
                    className={cn(
                      "group cursor-pointer",
                      idx === currentIndex && "ring-2 ring-primary rounded-lg"
                    )}
                    onClick={() => setCurrentIndex(idx)}
                  >
                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={user.profile_picture || "/placeholder.svg"}
                        alt={user.display_name}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      <div className="absolute top-3 left-3 flex gap-2">
                        {user.is_verified && (
                          <Badge className="bg-blue-500/90 text-white gap-1 text-xs">
                            <Verified className="w-3 h-3" />
                          </Badge>
                        )}
                        {user.is_premium && (
                          <Badge className="gradient-bg text-white text-xs">Premium</Badge>
                        )}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <h3 className="font-bold text-lg">{user.display_name}</h3>
                        <div className="flex items-center gap-1 text-xs">
                          <MapPin className="w-3 h-3" />
                          {user.city || user.country}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile/Tablet: Card View */}
              <div className="lg:hidden max-w-2xl mx-auto mb-8">
                {currentUser && (
                  <Card className="overflow-hidden border-border/50 bg-card/50">
                    <div
                      ref={containerRef}
                      className="relative aspect-[3/4] bg-muted touch-pan-y"
                      onTouchStart={(e) => (touchStartX.current = e.changedTouches[0].screenX)}
                      onTouchEnd={(e) => {
                        touchEndX.current = e.changedTouches[0].screenX
                        handleSwipe()
                      }}
                    >
                      <Image
                        src={currentUser.profile_picture || "/placeholder.svg"}
                        alt={currentUser.display_name}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      <div className="absolute top-4 left-4 flex gap-2">
                        {currentUser.is_verified && (
                          <Badge className="bg-blue-500/90 text-white gap-1">
                            <Verified className="w-3 h-3" />
                            Verified
                          </Badge>
                        )}
                        {currentUser.is_premium && (
                          <Badge className="gradient-bg text-white">Premium</Badge>
                        )}
                      </div>
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <h2 className="text-2xl font-bold">{currentUser.display_name || "Anonymous"}</h2>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="w-4 h-4" />
                          {currentUser.city || currentUser.country || "Location not set"}
                        </div>
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <p className="text-muted-foreground text-sm">{currentUser.bio || "No bio yet"}</p>
                      </div>
                      {currentUser.interests && currentUser.interests.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Interests</p>
                          <div className="flex flex-wrap gap-2">
                            {Array.isArray(currentUser.interests) ? (
                              currentUser.interests.map((interest: string) => (
                                <Badge key={interest} variant="secondary" className="text-xs">
                                  {interest}
                                </Badge>
                              ))
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                {currentUser.interests}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 justify-center mt-6">
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full w-14 h-14"
                    onClick={handleHide}
                    title="Skip (Swipe left)"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                  {session?.user && (
                    <Button
                      variant="outline"
                      size="lg"
                      className="rounded-full gap-2"
                      onClick={handleMessage}
                      title="Message"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span className="hidden sm:inline">Message</span>
                    </Button>
                  )}
                  {session?.user && (
                    <Button
                      size="lg"
                      className={cn(
                        "rounded-full w-14 h-14",
                        following.has(currentUser?.id) ? "gradient-bg" : "gradient-bg"
                      )}
                      onClick={handleFollow}
                      title={following.has(currentUser?.id) ? "Unfollow (Swipe right)" : "Follow (Swipe right)"}
                    >
                      {following.has(currentUser?.id) ? (
                        <Heart className="w-5 h-5 fill-current" />
                      ) : (
                        <Heart className="w-5 h-5" />
                      )}
                    </Button>
                  )}
                </div>

                {/* Progress */}
                <div className="text-center mt-4 text-sm text-muted-foreground">
                  {currentIndex + 1} of {filteredUsers.length} {following.has(currentUser?.id) && " • Following"}
                </div>
              </div>

              {/* Desktop: Detail View */}
              <div className="hidden lg:block max-w-4xl mx-auto">
                {currentUser && (
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Profile Image */}
                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={currentUser.profile_picture || "/placeholder.svg"}
                        alt={currentUser.display_name}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute top-4 left-4 flex gap-2">
                        {currentUser.is_verified && (
                          <Badge className="bg-blue-500/90 text-white gap-1">
                            <Verified className="w-3 h-3" />
                            Verified
                          </Badge>
                        )}
                        {currentUser.is_premium && (
                          <Badge className="gradient-bg text-white">Premium</Badge>
                        )}
                      </div>
                    </div>

                    {/* Profile Info */}
                    <div className="flex flex-col justify-between">
                      <div className="space-y-6">
                        <div>
                          <h2 className="text-4xl font-bold mb-2">{currentUser.display_name}</h2>
                          <div className="flex items-center gap-2 text-lg text-muted-foreground">
                            <MapPin className="w-5 h-5" />
                            {currentUser.city || currentUser.country || "Location not set"}
                          </div>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-2">About</h3>
                          <p className="text-muted-foreground">{currentUser.bio || "No bio yet"}</p>
                        </div>

                        {currentUser.interests && currentUser.interests.length > 0 && (
                          <div>
                            <h3 className="font-semibold mb-3">Interests</h3>
                            <div className="flex flex-wrap gap-2">
                              {Array.isArray(currentUser.interests) ? (
                                currentUser.interests.map((interest: string) => (
                                  <Badge key={interest} variant="secondary">
                                    {interest}
                                  </Badge>
                                ))
                              ) : (
                                <Badge variant="secondary">{currentUser.interests}</Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-4 pt-6">
                        <Button
                          variant="outline"
                          size="lg"
                          className="rounded-full gap-2 flex-1"
                          onClick={handleHide}
                        >
                          <X className="w-5 h-5" />
                          Skip
                        </Button>
                        {session?.user && (
                          <Button
                            variant="outline"
                            size="lg"
                            className="rounded-full gap-2 flex-1"
                            onClick={handleMessage}
                          >
                            <MessageCircle className="w-5 h-5" />
                            Message
                          </Button>
                        )}
                        {session?.user && (
                          <Button
                            size="lg"
                            className={cn(
                              "rounded-full gap-2 flex-1",
                              following.has(currentUser?.id)
                                ? "gradient-bg"
                                : "gradient-bg"
                            )}
                            onClick={handleFollow}
                          >
                            {following.has(currentUser?.id) ? (
                              <>
                                <Heart className="w-5 h-5 fill-current" />
                                Following
                              </>
                            ) : (
                              <>
                                <Heart className="w-5 h-5" />
                                Follow
                              </>
                            )}
                          </Button>
                        )}
                      </div>

                      {/* Navigation */}
                      <div className="flex gap-2 pt-4">
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-full"
                          onClick={prevProfile}
                          disabled={currentIndex === 0}
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                          {currentIndex + 1} of {filteredUsers.length}
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-full"
                          onClick={nextProfile}
                          disabled={currentIndex === filteredUsers.length - 1}
                        >
                          <ChevronRight className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
      <MobileNav />
    </div>
  )
}
