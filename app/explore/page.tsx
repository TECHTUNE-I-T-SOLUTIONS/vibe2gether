"use client"

import { useState, useEffect } from "react"
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
import { Search, SlidersHorizontal, Heart, X, MapPin, Verified, Sparkles, MessageCircle, RefreshCw, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { searchUsers } from "@/lib/supabase/queries"

export default function ExplorePage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [liked, setLiked] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [ageRange, setAgeRange] = useState([18, 65])
  const [selectedCountry, setSelectedCountry] = useState("all")

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true)
        const { data, error } = await searchUsers("", 100)
        if (error) {
          setError("Failed to load users")
        } else {
          setUsers(data || [])
        }
      } catch (err) {
        setError("Failed to load users")
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const filteredUsers = users.filter((user) => {
    const userAge = user.age || 0
    const ageMatch = userAge >= ageRange[0] && userAge <= ageRange[1]
    const countryMatch = selectedCountry === "all" || user.country === selectedCountry
    const searchMatch =
      searchQuery === "" ||
      user.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.bio.toLowerCase().includes(searchQuery.toLowerCase())
    return ageMatch && countryMatch && searchMatch
  })

  const currentUser = filteredUsers[currentIndex]

  const handleLike = () => {
    if (currentUser) {
      setLiked([...liked, currentUser.id])
      nextProfile()
    }
  }

  const handlePass = () => {
    nextProfile()
  }

  const nextProfile = () => {
    if (currentIndex < filteredUsers.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      // Reset to beginning if we've reached the end
      setCurrentIndex(0)
    }
  }

  const prevProfile = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleRefresh = () => {
    setCurrentIndex(0)
    setLiked([])
  }

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <Header />
      <main className="pt-20 md:pt-24">
        {/* Hero */}
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
                Find your perfect match with our smart discovery algorithm
              </p>
              <div className="relative max-w-md mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or interests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-full bg-background text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="flex gap-4 mb-6">
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
                    <label className="text-sm font-semibold mb-3 block">Age Range: {ageRange[0]} - {ageRange[1]}</label>
                    <Slider
                      min={18}
                      max={80}
                      step={1}
                      value={ageRange}
                      onValueChange={setAgeRange}
                      className="w-full"
                    />
                  </div>
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
                    Reset Filters
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <div className="text-sm text-muted-foreground flex items-center ml-auto">
              Showing {filteredUsers.length} people
            </div>
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
            <div className="max-w-2xl mx-auto">
              {/* Profile Card */}
              {currentUser && (
                <Card className="overflow-hidden border-border/50 bg-card/50">
                  <div className="relative aspect-[3/4] bg-muted">
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
                      <h2 className="text-2xl font-bold">
                        {currentUser.display_name}, {currentUser.age || "N/A"}
                      </h2>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="w-4 h-4" />
                        {currentUser.city || currentUser.country}
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
              <div className="flex gap-4 justify-center mt-8">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full"
                  onClick={prevProfile}
                  disabled={currentIndex === 0}
                >
                  <X className="w-5 h-5" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full gap-2"
                  disabled={filteredUsers.length === 0}
                >
                  <MessageCircle className="w-5 h-5" />
                  Message
                </Button>
                <Button
                  size="lg"
                  className="rounded-full gradient-bg"
                  onClick={handleLike}
                  disabled={filteredUsers.length === 0}
                >
                  <Heart className="w-5 h-5" />
                </Button>
              </div>

              {/* Info */}
              {filteredUsers.length > 0 && (
                <div className="text-center mt-6 text-sm text-muted-foreground">
                  {currentIndex + 1} of {filteredUsers.length}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <MobileNav />
    </div>
  )
}
