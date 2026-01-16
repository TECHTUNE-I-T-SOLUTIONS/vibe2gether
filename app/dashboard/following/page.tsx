"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Users, UserMinus } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useUserProfile } from "@/hooks/use-user-profile"
import { getFollowing, unfollowUser } from "@/lib/supabase/queries"
import Image from "next/image"

export default function FollowingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { user, loading } = useUserProfile()
  const [following, setFollowing] = useState<any[]>([])
  const [loadingFollowing, setLoadingFollowing] = useState(true)

  // Auth check
  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])
  const [unfollowing, setUnfollowing] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchFollowing()
    }
  }, [user])

  async function fetchFollowing() {
    try {
      setLoadingFollowing(true)
      const { data } = await getFollowing(user.id)
      setFollowing(data || [])
    } catch (err) {
      console.error("Failed to fetch following:", err)
    } finally {
      setLoadingFollowing(false)
    }
  }

  async function handleUnfollow(followingId: string) {
    if (!user) return

    try {
      setUnfollowing(followingId)
      await unfollowUser(user.id, followingId)
      setFollowing(following.filter((f) => f.id !== followingId))
    } catch (err) {
      console.error("Failed to unfollow:", err)
    } finally {
      setUnfollowing(null)
    }
  }

  if (loading || loadingFollowing) {
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
            Following
          </h1>
          <p className="text-sm text-muted-foreground mt-1">People you follow ({following.length})</p>
        </div>
      </div>

      {following.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="pt-8">
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">You're not following anyone yet</p>
              <p className="text-sm text-muted-foreground mt-2">Follow interesting people to see their posts and updates!</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {following.map((followedUser) => (
            <Card key={followedUser.id} className="border-border/50 hover:border-primary/50 transition overflow-hidden">
              <CardContent className="p-0">
                <div className="relative h-24 bg-gradient-to-r from-primary/20 to-primary/10">
                  {followedUser.cover_picture && (
                    <Image
                      src={followedUser.cover_picture}
                      alt="Cover"
                      fill
                      className="object-cover"
                    />
                  )}
                </div>

                <div className="px-4 py-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 -mt-8 rounded-full border-4 border-background overflow-hidden bg-muted flex-shrink-0">
                      {followedUser.profile_picture ? (
                        <Image
                          src={followedUser.profile_picture}
                          alt={followedUser.display_name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-white font-semibold">
                          {followedUser.display_name?.[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>

                  <Link href={`/dashboard/profile/${followedUser.id}`}>
                    <h3 className="font-semibold hover:text-primary transition">{followedUser.display_name}</h3>
                  </Link>

                  {followedUser.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{followedUser.bio}</p>
                  )}

                  {followedUser.city && (
                    <p className="text-xs text-muted-foreground mt-2">
                      📍 {followedUser.city}
                      {followedUser.country && `, ${followedUser.country}`}
                    </p>
                  )}

                  <div className="flex gap-2 mt-4">
                    <Link href={`/dashboard/profile/${followedUser.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        View Profile
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleUnfollow(followedUser.id)}
                      disabled={unfollowing === followedUser.id}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      {unfollowing === followedUser.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <UserMinus className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
