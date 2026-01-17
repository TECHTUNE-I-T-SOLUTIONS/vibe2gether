"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Heart, X, MessageCircle, Loader2, Sparkles, Eye, User, Lock, Crown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useUserProfile } from "@/hooks/use-user-profile"
import { usePremiumCheck } from "@/hooks/use-premium-check"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface UserData {
  id: string
  display_name: string
  profile_picture: string
  bio: string
  gender: string
  date_of_birth: string
  country: string
  city: string
  interests: string[]
  looking_for: string
}

interface Match {
  id: string
  user1_id: string
  user2_id: string
  status: string
  initiated_by: string
  compatibility_score: number
  otherUserId: string
  initiatedByCurrentUser: boolean
  currentUserIsUser1: boolean
  user1: UserData
  user2: UserData
  otherUser: UserData
}

function calculateAge(dateOfBirth: string): number {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

export default function MatchesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { user } = useUserProfile()
  const { toast } = useToast()
  const { checkPremium, isPremium } = usePremiumCheck()
  const [activeMatches, setActiveMatches] = useState<Match[]>([])
  const [potentialMatches, setPotentialMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"active" | "potential">("active")

  // Auth check
  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    async function loadMatches() {
      if (!user) return

      try {
        setLoading(true)

        // Fetch all matches using API
        const matchesResponse = await fetch("/api/matches/user")
        if (!matchesResponse.ok) throw new Error("Failed to fetch matches")
        const matchesData = await matchesResponse.json()
        setActiveMatches(matchesData.matches || [])

        // Fetch potential matches using API
        const potentialResponse = await fetch("/api/matches/potential")
        if (!potentialResponse.ok) throw new Error("Failed to fetch potential matches")
        const potentialData = await potentialResponse.json()
        setPotentialMatches(potentialData.potentialMatches || [])
      } catch (err) {
        console.error("Failed to load matches:", err)
        toast({
          title: "Error",
          description: "Failed to load matches",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadMatches()
  }, [user, toast])

  const handleAcceptMatch = async (matchId: string) => {
    try {
      const response = await fetch("/api/matches/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, status: "accepted" }),
      })

      if (!response.ok) throw new Error("Failed to accept match")

      setActiveMatches((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, status: "accepted" } : m))
      )

      toast({
        title: "Match Accepted!",
        description: "You can now message each other",
      })
    } catch (err) {
      console.error("Failed to accept match:", err)
      toast({
        title: "Error",
        description: "Failed to accept match",
        variant: "destructive",
      })
    }
  }

  const handleRejectMatch = async (matchId: string) => {
    try {
      const response = await fetch("/api/matches/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, status: "rejected" }),
      })

      if (!response.ok) throw new Error("Failed to reject match")

      setActiveMatches((prev) => prev.filter((m) => m.id !== matchId))

      toast({
        title: "Match Rejected",
        description: "This match request has been declined",
      })
    } catch (err) {
      console.error("Failed to reject match:", err)
      toast({
        title: "Error",
        description: "Failed to reject match",
        variant: "destructive",
      })
    }
  }

  const handlePassOnPotential = (userId: string) => {
    setPotentialMatches((prev) => prev.filter((m) => m.id !== userId))
  }

  const handleLikePotential = async (match: any) => {
    if (!user) return
    try {
      console.log(
        `[Matches Page] Creating match for user ${match.id} with compatibility ${match.compatibilityScore}%`
      )

      const response = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: match.id,
          compatibilityScore: match.compatibilityScore || 0,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create match")
      }

      const newMatch = await response.json()
      console.log("[Matches Page] Match created successfully:", newMatch.matchId)

      // Remove from potential matches
      setPotentialMatches((prev) => prev.filter((m) => m.id !== match.id))

      toast({
        title: "Match Created!",
        description: "They'll see your request and can accept it",
      })
    } catch (err) {
      console.error("[Matches Page] Error creating match:", err)
      toast({
        title: "Error",
        description: "Failed to create match",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <Sparkles className="w-8 h-8" />
        Matches
      </h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-border">
        <button
          onClick={() => setTab("active")}
          className={cn(
            "px-4 py-2 font-semibold border-b-2 transition-colors",
            tab === "active"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Active Matches ({activeMatches.length})
        </button>
        <button
          onClick={() => {
            if (!checkPremium("View Matches")) {
              return
            }
            setTab("potential")
          }}
          className={cn(
            "px-4 py-2 font-semibold border-b-2 transition-colors flex items-center gap-2",
            tab === "potential"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Potential Matches ({potentialMatches.length})
          {!isPremium && (
            <Lock className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Active Matches Tab */}
      {tab === "active" && (
        <div>
          {activeMatches.length === 0 ? (
            <Card className="border-border/50 p-12 text-center">
              <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-4">
                You don't have any accepted matches yet
              </p>
              <Button onClick={() => setTab("potential")} className="gradient-bg">
                Check Potential Matches
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeMatches
                .filter((m) => m.status === "accepted")
                .map((match) => {
                  const otherUser =
                    match.user1_id === user?.id ? match.user2 : match.user1

                  return (
                    <Card key={match.id} className="border-border/50 overflow-hidden">
                      <div className="relative h-48 bg-muted">
                        {otherUser.profile_picture && (
                          <Image
                            src={otherUser.profile_picture}
                            alt={otherUser.display_name}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>

                      <CardContent className="p-4">
                        <h3 className="text-xl font-bold mb-2">
                          {otherUser.display_name}, {calculateAge(otherUser.date_of_birth)}
                        </h3>

                        {otherUser.bio && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {otherUser.bio}
                          </p>
                        )}

                        {otherUser.city && (
                          <p className="text-sm text-muted-foreground mb-4">
                            {otherUser.city}, {otherUser.country}
                          </p>
                        )}

                        {match.compatibility_score > 0 && (
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold">Compatibility</span>
                              <span className="font-bold text-primary">
                                {match.compatibility_score}%
                              </span>
                            </div>
                            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full gradient-bg"
                                style={{
                                  width: `${match.compatibility_score}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Link href={`/dashboard/messages?match=${match.id}`} className="flex-1">
                            <Button className="w-full gradient-bg">
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Message
                            </Button>
                          </Link>
                          <Link href={`/user/${otherUser.id}`} className="flex-1">
                            <Button variant="outline" className="w-full">
                              View Profile
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
            </div>
          )}

          {/* Pending Matches */}
          {activeMatches.filter((m) => m.status === "pending").length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">Pending Match Requests</h2>
              <div className="space-y-4">
                {/* Sent Requests */}
                {activeMatches
                  .filter((m) => m.status === "pending" && m.initiated_by === user?.id)
                  .map((match) => {
                    const otherUser =
                      match.user1_id === user?.id ? match.user2 : match.user1

                    return (
                      <Card key={match.id} className="border-border/50 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={otherUser.profile_picture} />
                              <AvatarFallback>
                                {otherUser.display_name?.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold">{otherUser.display_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {match.compatibility_score}% compatible
                              </p>
                              <p className="text-xs text-amber-600 mt-1">
                                ⏳ Waiting for response...
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectMatch(match.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                            <Link href={`/user/${otherUser.id}`}>
                              <Button size="sm" variant="ghost">
                                View Profile
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </Card>
                    )
                  })}

                {/* Received Requests */}
                {activeMatches
                  .filter((m) => m.status === "pending" && m.initiated_by !== user?.id)
                  .map((match) => {
                    const otherUser =
                      match.user1_id === user?.id ? match.user2 : match.user1

                    return (
                      <Card key={match.id} className="border-border/50 p-4 border-primary/30 bg-primary/5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={otherUser.profile_picture} />
                              <AvatarFallback>
                                {otherUser.display_name?.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold">{otherUser.display_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {match.compatibility_score}% compatible
                              </p>
                              <p className="text-xs text-primary mt-1">
                                💌 Wants to match with you
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectMatch(match.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              className="gradient-bg"
                              onClick={() => handleAcceptMatch(match.id)}
                            >
                              <Heart className="w-4 h-4 mr-1" />
                              Accept
                            </Button>
                            <Link href={`/user/${otherUser.id}`}>
                              <Button size="sm" variant="ghost">
                                View Profile
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Potential Matches Tab */}
      {tab === "potential" && (
        <div>
          {!isPremium ? (
            <Card className="border-border/50 p-12 text-center">
              <Crown className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Premium Feature</h3>
              <p className="text-muted-foreground mb-6">
                Unlock Potential Matches and browse new profiles with a premium membership
              </p>
              <Button
                onClick={() => router.push("/dashboard/premium?feature=View+Matches")}
                className="gradient-bg"
              >
                Upgrade to Premium
              </Button>
            </Card>
          ) : potentialMatches.length === 0 ? (
            <Card className="border-border/50 p-12 text-center">
              <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                No more potential matches available
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {potentialMatches.map((match) => (
                <Card
                  key={match.id}
                  className="border-border/50 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative h-48 bg-muted">
                    {match.profile_picture && (
                      <Image
                        src={match.profile_picture}
                        alt={match.display_name}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>

                  <CardContent className="p-4">
                    <h3 className="text-xl font-bold mb-2">
                      {match.display_name}, {calculateAge(match.date_of_birth)}
                    </h3>

                    {match.bio && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {match.bio}
                      </p>
                    )}

                    {match.city && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {match.city}, {match.country}
                      </p>
                    )}

                    {match.interests && match.interests.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {match.interests.slice(0, 3).map((interest: string) => (
                          <Badge key={interest} variant="secondary" className="text-xs">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold">Compatibility</span>
                        <span className="font-bold text-primary">
                          {match.compatibilityScore}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full gradient-bg"
                          style={{
                            width: `${match.compatibilityScore}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handlePassOnPotential(match.id)}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Pass
                      </Button>
                      <Button 
                        className="flex-1 gradient-bg"
                        onClick={() => handleLikePotential(match)}
                      >
                        <Heart className="w-4 h-4 mr-2" />
                        Like
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
