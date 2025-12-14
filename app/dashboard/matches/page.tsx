"use client"

import { useState } from "react"
import Image from "next/image"
import { Heart, MessageCircle, MapPin, Verified, Filter, Sparkles, X, Star, Clock, Zap } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useI18n } from "@/lib/i18n/context"

const matches = [
  {
    id: 1,
    name: "Emma",
    age: 28,
    location: "New York, USA",
    image: "/emma-woman-avatar.jpg",
    vibeScore: 95,
    verified: true,
    online: true,
    premium: true,
    lastActive: "Now",
    interests: ["Travel", "Music", "Photography"],
    bio: "Adventure seeker looking for someone to explore the world with.",
    matchedAt: "2 hours ago",
  },
  {
    id: 2,
    name: "Sofia",
    age: 26,
    location: "Miami, USA",
    image: "/professional-woman-avatar.png",
    vibeScore: 92,
    verified: true,
    online: false,
    premium: false,
    lastActive: "30 min ago",
    interests: ["Fitness", "Cooking", "Art"],
    bio: "Love trying new restaurants and staying active.",
    matchedAt: "1 day ago",
  },
  {
    id: 3,
    name: "Yuki",
    age: 27,
    location: "Los Angeles, USA",
    image: "/smiling-woman-avatar.png",
    vibeScore: 89,
    verified: true,
    online: true,
    premium: false,
    lastActive: "Now",
    interests: ["Gaming", "Anime", "Coffee"],
    bio: "Gamer by night, coffee lover by day.",
    matchedAt: "3 days ago",
  },
  {
    id: 4,
    name: "Isabella",
    age: 25,
    location: "Chicago, USA",
    image: "/placeholder.svg?height=400&width=400",
    vibeScore: 87,
    verified: false,
    online: false,
    premium: false,
    lastActive: "2 hours ago",
    interests: ["Reading", "Yoga", "Movies"],
    bio: "Bookworm looking for my plot twist.",
    matchedAt: "5 days ago",
  },
]

const newLikes = [
  { id: 1, name: "Sarah", image: "/placeholder.svg?height=100&width=100", blurred: true },
  { id: 2, name: "Maria", image: "/placeholder.svg?height=100&width=100", blurred: true },
  { id: 3, name: "Anna", image: "/placeholder.svg?height=100&width=100", blurred: true },
  { id: 4, name: "Lisa", image: "/placeholder.svg?height=100&width=100", blurred: true },
]

export default function MatchesPage() {
  const { t } = useI18n()
  const [selectedMatch, setSelectedMatch] = useState(matches[0])

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">{t("yourMatches")}</h1>
        <p className="text-muted-foreground">Connect with people who share your vibe</p>
      </div>

      {/* Premium CTA - See Who Likes You */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5 mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {newLikes.map((like) => (
                  <div
                    key={like.id}
                    className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-background"
                  >
                    <Image
                      src={like.image || "/placeholder.svg"}
                      alt={like.name}
                      fill
                      className="object-cover blur-sm"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  </div>
                ))}
              </div>
              <div>
                <p className="font-semibold">
                  <span className="gradient-text">{newLikes.length} people</span> liked you
                </p>
                <p className="text-sm text-muted-foreground">Upgrade to Premium to see who they are</p>
              </div>
            </div>
            <Button className="rounded-full gradient-bg">
              <Sparkles className="w-4 h-4 mr-2" />
              See Who Likes You
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="matches" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TabsList className="bg-muted/50 p-1 rounded-full">
            <TabsTrigger value="matches" className="rounded-full">
              Matches ({matches.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="rounded-full">
              Pending
            </TabsTrigger>
            <TabsTrigger value="archived" className="rounded-full">
              Archived
            </TabsTrigger>
          </TabsList>
          <Button variant="outline" className="rounded-full bg-transparent">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>

        <TabsContent value="matches">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Matches List */}
            <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
              {matches.map((match) => (
                <Card
                  key={match.id}
                  className={`border-border/50 overflow-hidden cursor-pointer transition-all hover:shadow-lg ${selectedMatch.id === match.id ? "ring-2 ring-primary" : ""}`}
                  onClick={() => setSelectedMatch(match)}
                >
                  <div className="relative aspect-[4/5]">
                    <Image src={match.image || "/placeholder.svg"} alt={match.name} fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    {match.online && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                        <span className="w-2 h-2 bg-white rounded-full" />
                        Online
                      </div>
                    )}
                    <Badge className="absolute top-3 left-3 gradient-bg">{match.vibeScore}% Match</Badge>
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="flex items-center gap-1 mb-1">
                        <h3 className="text-white font-semibold text-lg">
                          {match.name}, {match.age}
                        </h3>
                        {match.verified && <Verified className="w-4 h-4 text-blue-400 fill-blue-400" />}
                        {match.premium && <Star className="w-4 h-4 text-accent fill-accent" />}
                      </div>
                      <p className="text-white/80 text-sm flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {match.location}
                      </p>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        Matched {match.matchedAt}
                      </div>
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" className="rounded-full h-9 w-9 text-destructive">
                          <X className="w-5 h-5" />
                        </Button>
                        <Button size="icon" className="rounded-full h-9 w-9 gradient-bg">
                          <MessageCircle className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Selected Match Detail */}
            <div className="hidden lg:block">
              <Card className="border-border/50 sticky top-24">
                <div className="relative aspect-square">
                  <Image
                    src={selectedMatch.image || "/placeholder.svg"}
                    alt={selectedMatch.name}
                    fill
                    className="object-cover rounded-t-xl"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent rounded-t-xl" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-white font-bold text-2xl">
                        {selectedMatch.name}, {selectedMatch.age}
                      </h2>
                      {selectedMatch.verified && <Verified className="w-5 h-5 text-blue-400 fill-blue-400" />}
                    </div>
                    <p className="text-white/80 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {selectedMatch.location}
                    </p>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Badge className="gradient-bg text-primary-foreground">
                      <Heart className="w-3 h-3 mr-1 fill-current" />
                      {selectedMatch.vibeScore}% Vibe Match
                    </Badge>
                    {selectedMatch.online ? (
                      <Badge variant="outline" className="border-green-500 text-green-500">
                        Online Now
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">Active {selectedMatch.lastActive}</span>
                    )}
                  </div>

                  <p className="text-foreground mb-4">{selectedMatch.bio}</p>

                  <div className="mb-6">
                    <p className="text-sm font-medium mb-2">Interests</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedMatch.interests.map((interest) => (
                        <Badge key={interest} variant="outline">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button className="flex-1 rounded-full gradient-bg">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                    <Button variant="outline" className="rounded-full bg-transparent">
                      <Zap className="w-4 h-4 mr-2" />
                      Super Like
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Pending Matches</h3>
            <p className="text-muted-foreground">Keep swiping to find more matches!</p>
          </div>
        </TabsContent>

        <TabsContent value="archived">
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Archived Matches</h3>
            <p className="text-muted-foreground">Archived matches will appear here</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
