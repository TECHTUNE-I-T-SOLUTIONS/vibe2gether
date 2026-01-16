"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useI18n } from "@/lib/i18n/context"
import { useUserProfile } from "@/hooks/use-user-profile"
import { uploadProfilePicture, uploadCoverPicture } from "@/lib/supabase/storage"
import { updateUserProfile } from "@/lib/supabase/queries"
import { DashboardAnnouncements } from "@/components/dashboard-announcements"
import {
  Heart,
  MessageCircle,
  Eye,
  Coins,
  Settings,
  Edit,
  Camera,
  Verified,
  TrendingUp,
  Users,
  Calendar,
  Wallet,
  Bell,
  ChevronRight,
  Sparkles,
  Gift,
  Star,
  Loader2,
  AlertCircle,
} from "lucide-react"

export default function DashboardPage() {
  const { t } = useI18n()
  const { data: session } = useSession()
  const router = useRouter()
  const { user: profileUser, loading: profileLoading, refetch } = useUserProfile()
  const [stats, setStats] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [matches, setMatches] = useState([])
  const [coinBalance, setCoinBalance] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [hasPremium, setHasPremium] = useState(false)
  const coverPictureInputRef = useRef<HTMLInputElement>(null)
  const profilePictureInputRef = useRef<HTMLInputElement>(null)

  // Check authentication
  useEffect(() => {
    if (session === undefined) {
      // Session is still loading
      return
    }

    if (!session?.user?.id) {
      // Not logged in, redirect to login
      router.push("/login")
      return
    }
  }, [session, router])

  useEffect(() => {
    if (!session?.user?.id) return

    async function fetchDashboardData() {
      try {
        setLoading(true)
        const response = await fetch("/api/dashboard/stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data")
        }

        const data = await response.json()
        setStats(data.stats || [])
        setRecentActivity(data.recentActivity || [])
        setMatches(data.matches || [])
        setCoinBalance(data.coinBalance || 0)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        console.error("Dashboard data fetch error:", err)
      } finally {
        setLoading(false)
      }
    }

    async function fetchNotifications() {
      try {
        const response = await fetch("/api/notifications")
        if (response.ok) {
          const data = await response.json()
          setUnreadNotifications(data.unreadCount || 0)
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err)
      }
    }

    async function fetchMessages() {
      try {
        const response = await fetch("/api/messages")
        if (response.ok) {
          const data = await response.json()
          const unreadCount = (data.conversations || []).reduce(
            (total: number, conv: any) => total + (conv.unreadCount || 0),
            0
          )
          setUnreadMessages(unreadCount)
        }
      } catch (err) {
        console.error("Failed to fetch messages:", err)
      }
    }

    async function checkPremium() {
      try {
        console.log("[Dashboard] Checking premium status")
        const response = await fetch("/api/user/premium-status")
        if (response.ok) {
          const data = await response.json()
          console.log("[Dashboard] Premium status:", data)
          setHasPremium(data.hasPremium)
        }
      } catch (err) {
        console.error("[Dashboard] Failed to check premium status:", err)
      }
    }

    fetchDashboardData()
    fetchNotifications()
    fetchMessages()
    checkPremium()
  }, [])

  const handleCoverPictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profileUser) return

    try {
      setUploading(true)
      const { url, error } = await uploadCoverPicture(profileUser.id, file)

      if (error) {
        console.error("Upload error:", error)
        return
      }

      if (url) {
        const { error: updateError } = await updateUserProfile(profileUser.id, {
          cover_picture: url,
        })

        if (!updateError) {
          refetch()
        }
      }
    } catch (err) {
      console.error("Error uploading cover picture:", err)
    } finally {
      setUploading(false)
      if (coverPictureInputRef.current) {
        coverPictureInputRef.current.value = ""
      }
    }
  }

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profileUser) return

    try {
      setUploading(true)
      const { url, error } = await uploadProfilePicture(profileUser.id, file)

      if (error) {
        console.error("Upload error:", error)
        return
      }

      if (url) {
        const { error: updateError } = await updateUserProfile(profileUser.id, {
          profile_picture: url,
        })

        if (!updateError) {
          refetch()
        }
      }
    } catch (err) {
      console.error("Error uploading profile picture:", err)
    } finally {
      setUploading(false)
      if (profilePictureInputRef.current) {
        profilePictureInputRef.current.value = ""
      }
    }
  }

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profileUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Failed to load profile</p>
      </div>
    )
  }

  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    let completed = 0
    const totalFields = 10

    if (profileUser.full_name) completed++
    if (profileUser.display_name) completed++
    if (profileUser.profile_picture) completed++
    if (profileUser.cover_picture) completed++
    if (profileUser.bio) completed++
    if (profileUser.city) completed++
    if (profileUser.country) completed++
    if (profileUser.date_of_birth) completed++
    if (profileUser.gender) completed++
    if (profileUser.interests && profileUser.interests.length > 0) completed++

    return Math.round((completed / totalFields) * 100)
  }

  const profileCompletion = calculateProfileCompletion()

  return (
    <div className="p-4 md:p-4 lg:px-6">
      {/* Profile Header */}
      <Card className="border-border/50 overflow-hidden mb-8">
        {/* Cover */}
        <div className="h-32 md:h-48 gradient-bg relative">
          {profileUser.cover_picture && (
            <Image
              src={profileUser.cover_picture}
              alt="Cover"
              fill
              className="object-cover"
            />
          )}
          <Button
            size="icon"
            variant="secondary"
            className="absolute top-4 right-4 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40"
            onClick={() => coverPictureInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
          </Button>
          <input
            ref={coverPictureInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverPictureUpload}
            className="hidden"
          />
        </div>

        <CardContent className="pt-0">
          <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12 md:-mt-16">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full border-4 border-background overflow-hidden bg-muted flex items-center justify-center">
                {profileUser.profile_picture ? (
                  <Image src={profileUser.profile_picture} alt={profileUser.display_name || profileUser.full_name} fill className="object-cover object-center" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-accent text-white text-3xl font-bold">
                    {(profileUser.display_name || profileUser.full_name || "U").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <Button size="icon" className="absolute bottom-0 right-0 rounded-full w-8 h-8 gradient-bg" onClick={() => profilePictureInputRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              </Button>
              <input
                ref={profilePictureInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfilePictureUpload}
                className="hidden"
              />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-background" />
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl md:text-3xl font-bold">{profileUser.display_name || profileUser.full_name}</h1>
                {profileUser.is_verified && (
                  <Verified className="w-6 h-6 text-blue-500 fill-blue-500" />
                )}
              </div>
              <p className="text-muted-foreground mb-2">{profileUser.email}</p>
              <div className="flex flex-wrap items-center gap-2">
                {profileUser.is_premium && (
                  <Badge className="gradient-bg text-primary-foreground">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {t("premium")}
                  </Badge>
                )}
                {profileUser.interests && profileUser.interests.length > 0 && (
                  <>
                    {profileUser.interests.slice(0, 2).map((interest) => (
                      <Badge key={interest} variant="outline">
                        {interest}
                      </Badge>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Link href="/dashboard/profile">
                <Button variant="outline" className="rounded-full bg-transparent">
                  <Edit className="w-4 h-4 mr-2" />
                  {t("editProfile")}
                </Button>
              </Link>
              <Link href="/dashboard/settings">
                <Button variant="outline" size="icon" className="rounded-full bg-transparent">
                  <Settings className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Profile Completion */}
          <div className="mt-6 p-4 bg-muted/50 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Profile Completion</span>
              <span className="text-sm text-primary font-semibold">{profileCompletion}%</span>
            </div>
            <Progress value={profileCompletion} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {profileCompletion < 100
                ? "Complete your profile to get more matches!"
                : "Your profile is complete! 🎉"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Announcements Section */}
      <DashboardAnnouncements />

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Stats with Coin Earnings */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {loading ? (
              <div className="col-span-full flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              stats.map((stat, i) => {
                const iconMap: Record<string, typeof Eye> = {
                  eye: Eye,
                  heart: Heart,
                  users: Users,
                  coins: Coins,
                  matches: Heart,
                }
                const Icon = iconMap[stat.icon] || Eye
                return (
                  <Card key={i} className="border-border/50 group hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Icon className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{stat.value}</div>
                          <div className="text-xs text-muted-foreground">{t(stat.label)}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <TrendingUp className="w-3 h-3" />
                          {stat.trend}
                        </div>
                        {stat.coins > 0 && (
                          <div className="flex items-center gap-1 text-xs text-accent font-medium">
                            <Coins className="w-3 h-3" />+{stat.coins}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>

          {/* Matches */}
          <Card className="border-border/50">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>{t("yourMatches")}</CardTitle>
              <Link href="/dashboard/matches">
                <Button variant="ghost" size="sm" className="text-primary">
                  View All
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid sm:grid-cols-3 gap-4">
                  {matches.map((match, i) => (
                    <div key={i} className="relative group rounded-2xl overflow-hidden cursor-pointer">
                      <div className="aspect-[4/5] relative">
                        <Image
                          src={match.image || "/placeholder.svg"}
                          alt={match.name}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        {match.online && (
                          <div className="absolute top-3 right-3 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                        )}
                        <Badge className="absolute top-3 left-3 gradient-bg text-primary-foreground text-xs">
                          {match.vibeScore}% Match
                        </Badge>
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="text-white font-semibold">
                            {match.name}, {match.age}
                          </h3>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity with Coin Earnings */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>{t("recentActivity")}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity, i) => (
                    <div key={i} className="flex items-center gap-4 p-2 rounded-xl hover:bg-muted/50 transition-colors">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden">
                        <Image
                          src={activity.avatar || "/placeholder.svg"}
                          alt={activity.user}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{activity.user}</span>{" "}
                          {activity.type === "like" && "liked your profile"}
                          {activity.type === "follow" && "started following you"}
                          {activity.type === "view" && "viewed your profile"}
                          {activity.type === "message" && "sent you a message"}
                          {activity.type === "verification" && activity.message && activity.message}
                        </p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {activity.coins > 0 && (
                          <Badge variant="outline" className="text-accent border-accent/30 bg-accent/10">
                            <Coins className="w-3 h-3 mr-1" />+{activity.coins}
                          </Badge>
                        )}
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          {activity.type === "like" && <Heart className="w-4 h-4 text-primary" />}
                          {activity.type === "follow" && <Users className="w-4 h-4 text-secondary" />}
                          {activity.type === "view" && <Eye className="w-4 h-4 text-muted-foreground" />}
                          {activity.type === "message" && <MessageCircle className="w-4 h-4 text-accent" />}
                          {activity.type === "verification" && <Verified className="w-4 h-4 text-blue-500" />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Wallet */}
          <Card className="border-border/50 overflow-hidden">
            <div className="gradient-bg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Coins className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white/70 text-sm">{t("coinBalance")}</p>
                  <p className="text-3xl font-bold text-white">{coinBalance.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href="/dashboard/wallet" className="flex-1">
                  <Button
                    variant="secondary"
                    className="w-full rounded-full bg-white/20 text-white hover:bg-white/30 border-0"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    {t("withdraw")}
                  </Button>
                </Link>
                <Button variant="secondary" className="rounded-full bg-white/20 text-white hover:bg-white/30 border-0">
                  <Gift className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">10 {t("viewsEarn")}</span>
                  <span className="font-medium">1 {t("coins")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">1 {t("likesEarn")}</span>
                  <span className="font-medium">1 {t("coins")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">1 {t("followersEarn")}</span>
                  <span className="font-medium">2 {t("coins")}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/dashboard/messages">
                <Button variant="ghost" className="w-full justify-start rounded-xl">
                  <MessageCircle className="w-5 h-5 mr-3 text-primary" />
                  {t("messages")}
                  {unreadMessages > 0 && <Badge className="ml-auto">{unreadMessages}</Badge>}
                </Button>
              </Link>
              <Link href="/dashboard/notifications">
                <Button variant="ghost" className="w-full justify-start rounded-xl">
                  <Bell className="w-5 h-5 mr-3 text-accent" />
                  {t("notifications")}
                  {unreadNotifications > 0 && <Badge className="ml-auto">{unreadNotifications}</Badge>}
                </Button>
              </Link>
              <Link href="/events">
                <Button variant="ghost" className="w-full justify-start rounded-xl">
                  <Calendar className="w-5 h-5 mr-3 text-secondary" />
                  Upcoming Events
                </Button>
              </Link>
              <Link href="/marketplace">
                <Button variant="ghost" className="w-full justify-start rounded-xl">
                  <Gift className="w-5 h-5 mr-3 text-pink-500" />
                  Send a Gift
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Premium Upgrade */}
          {!hasPremium && (
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-accent fill-accent" />
                  <span className="font-semibold">Upgrade to Premium</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Get unlimited swipes, see who likes you, and boost your profile visibility.
                </p>
                <Link href="/dashboard/premium" className="w-full block">
                  <Button className="w-full rounded-full gradient-bg">Upgrade Now</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
