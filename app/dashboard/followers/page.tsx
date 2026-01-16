"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Users } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useUserProfile } from "@/hooks/use-user-profile"
import { getFollowers } from "@/lib/supabase/queries"
import Image from "next/image"

export default function FollowersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { user, loading } = useUserProfile()
  const [followers, setFollowers] = useState<any[]>([])
  const [loadingFollowers, setLoadingFollowers] = useState(true)

  // Auth check
  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (user) {
      fetchFollowers()
    }
  }, [user])

  async function fetchFollowers() {
    try {
      setLoadingFollowers(true)
      const { data } = await getFollowers(user.id)
      setFollowers(data || [])
    } catch (err) {
      console.error("Failed to fetch followers:", err)
    } finally {
      setLoadingFollowers(false)
    }
  }

  if (loading || loadingFollowers) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/profile">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="w-8 h-8" />
            Followers
          </h1>
          <p className="text-sm text-muted-foreground mt-1">People following you ({followers.length})</p>
        </div>
      </div>

      {followers.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="pt-8">
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">You don't have any followers yet</p>
              <p className="text-sm text-muted-foreground mt-2">Share your profile and start connecting!</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {followers.map((follower) => (
            <Card key={follower.id} className="border-border/50 hover:border-primary/50 transition overflow-hidden">
              <CardContent className="p-0">
                <div className="relative h-24 bg-gradient-to-r from-primary/20 to-primary/10">
                  {follower.cover_picture && (
                    <Image
                      src={follower.cover_picture}
                      alt="Cover"
                      fill
                      className="object-cover"
                    />
                  )}
                </div>

                <div className="px-4 py-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 -mt-8 rounded-full border-4 border-background overflow-hidden bg-muted flex-shrink-0">
                      {follower.profile_picture ? (
                        <Image
                          src={follower.profile_picture}
                          alt={follower.display_name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-white font-semibold">
                          {follower.display_name?.[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>

                  <Link href={`/dashboard/profile/${follower.id}`}>
                    <h3 className="font-semibold hover:text-primary transition">{follower.display_name}</h3>
                  </Link>

                  {follower.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{follower.bio}</p>
                  )}

                  {follower.city && (
                    <p className="text-xs text-muted-foreground mt-2">
                      📍 {follower.city}
                      {follower.country && `, ${follower.country}`}
                    </p>
                  )}

                  <Link href={`/dashboard/profile/${follower.id}`}>
                    <Button variant="outline" className="w-full mt-4">
                      View Profile
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
