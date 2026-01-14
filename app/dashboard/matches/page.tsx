"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart, X, MessageCircle, Loader2, Sparkles } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useUserProfile } from "@/hooks/use-user-profile"
import { getMatches, updateMatchStatus } from "@/lib/supabase/queries"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

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
  compatibility_score: number
  user1: UserData
  user2: UserData
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

function calculateCompatibilityScore(
  currentUser: any,
  potentialMatch: UserData
): number {
  let score = 0

  // Age proximity
  const currentAge = calculateAge(currentUser.date_of_birth)
  const matchAge = calculateAge(potentialMatch.date_of_birth)
  const ageDiff = Math.abs(currentAge - matchAge)

  if (ageDiff <= 5) score += 35
  else if (ageDiff <= 10) score += 20
  else if (ageDiff <= 15) score += 10

  // Location match
  if (currentUser.country && potentialMatch.country) {
    if (currentUser.country === potentialMatch.country) score += 25
    if (currentUser.city && potentialMatch.city && currentUser.city === potentialMatch.city)
      score += 15
  }

  // Interests overlap
  const currentInterests = Array.isArray(currentUser.interests) ? currentUser.interests : []
  const matchInterests = Array.isArray(potentialMatch.interests) ? potentialMatch.interests : []
  const commonInterests = currentInterests.filter((interest) =>
    matchInterests.includes(interest)
  )
  score += commonInterests.length * 5

  // Gender preference
  if (currentUser.looking_for && potentialMatch.gender) {
    if (
      currentUser.looking_for.toLowerCase() === potentialMatch.gender.toLowerCase()
    ) {
      score += 20
    }
  }

  return Math.min(score, 100) // Cap at 100
}

async function findPotentialMatches(
  currentUser: any,
  excludeIds: string[]
) {
  const supabase = createClient()

  // Get all active users except current user and already matched
  const { data: potentialMatches, error } = await supabase
    .from("users")
    .select(
      "id, display_name, profile_picture, bio, gender, date_of_birth, country, city, interests, looking_for"
    )
    .neq("id", currentUser.id)
    .eq("is_active", true)
    .not("id", "in", `(${excludeIds.join(",")})`)
    .limit(50)

  if (error) {
    console.error("Error fetching potential matches:", error)
    return []
  }

  // Calculate compatibility scores
  const matchesWithScores = (potentialMatches || []).map((match: UserData) => ({
    ...match,
    compatibilityScore: calculateCompatibilityScore(currentUser, match),
  }))

  // Sort by compatibility score (highest first)
  return matchesWithScores.sort(
    (a: any, b: any) => b.compatibilityScore - a.compatibilityScore
  )
}

export default function MatchesPage() {
  const { user } = useUserProfile()
  const [activeMatches, setActiveMatches] = useState<Match[]>([])
  const [potentialMatches, setPotentialMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"active" | "potential">("active")
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function loadMatches() {
      if (!user) return

      try {
        setLoading(true)

        // Get active matches
        const { data: matches, error } = await getMatches(user.id)
        if (!error && matches) {
          setActiveMatches(matches)

          // Get IDs to exclude
          const ids = new Set([user.id])
          matches.forEach((match: Match) => {
            ids.add(match.user1_id)
            ids.add(match.user2_id)
          })
          setExcludedIds(ids)
        }

        // Get potential matches
        const potential = await findPotentialMatches(user, Array.from(excludedIds || [user.id]))
        setPotentialMatches(potential)
      } catch (err) {
        console.error("Failed to load matches:", err)
      } finally {
        setLoading(false)
      }
    }

    loadMatches()
  }, [user])

  const handleAcceptMatch = async (matchId: string) => {
    try {
      await updateMatchStatus(matchId, "accepted")
      setActiveMatches((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, status: "accepted" } : m))
      )
    } catch (err) {
      console.error("Failed to accept match:", err)
    }
  }

  const handleRejectMatch = async (matchId: string) => {
    try {
      await updateMatchStatus(matchId, "rejected")
      setActiveMatches((prev) => prev.filter((m) => m.id !== matchId))
    } catch (err) {
      console.error("Failed to reject match:", err)
    }
  }

  const handlePassOnPotential = (userId: string) => {
    setPotentialMatches((prev) => prev.filter((m) => m.id !== userId))
  }

  const handleLikePotential = async (match: any) => {
    if (!user) return
    try {
      console.log(`[Matches Page] Creating match for user ${match.id} with compatibility ${match.compatibilityScore}%`)
      
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
      console.log("[Matches Page] Match created successfully:", newMatch.id)
      
      // Remove from potential matches
      setPotentialMatches((prev) => prev.filter((m) => m.id !== match.id))
      
      // Add to active matches
      setActiveMatches((prev) => [...prev, newMatch])
    } catch (err) {
      console.error("[Matches Page] Error creating match:", err)
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
          onClick={() => setTab("potential")}
          className={cn(
            "px-4 py-2 font-semibold border-b-2 transition-colors",
            tab === "potential"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Potential Matches ({potentialMatches.length})
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

                        <Link href={`/dashboard/messages?match=${match.id}`}>
                          <Button className="w-full gradient-bg">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Send Message
                          </Button>
                        </Link>
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
                {activeMatches
                  .filter((m) => m.status === "pending")
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
                              <Heart className="w-4 h-4" />
                            </Button>
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
          {potentialMatches.length === 0 ? (
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
