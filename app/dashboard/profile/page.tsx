"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import {
  Edit,
  MapPin,
  Calendar,
  Heart,
  Music,
  Film,
  Utensils,
  Plane,
  BookOpen,
  Check,
  X,
  Users,
  Share2,
  Copy,
  Loader2,
  Camera,
  Upload,
  Shield,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useI18n } from "@/lib/i18n/context"
import Link from "next/link"
import { useUserProfile } from "@/hooks/use-user-profile"
import { uploadProfilePicture, uploadCoverPicture } from "@/lib/supabase/storage"
import { updateUserProfile } from "@/lib/supabase/queries"

const interestsList = [
  { icon: Music, label: "Music" },
  { icon: Film, label: "Movies" },
  { icon: Utensils, label: "Cooking" },
  { icon: Plane, label: "Travel" },
  { icon: BookOpen, label: "Reading" },
  { icon: Heart, label: "Fitness" },
]

export default function ProfilePage() {
  const { t } = useI18n()
  const { user, loading, error, refetch } = useUserProfile()
  const [isEditing, setIsEditing] = useState(false)
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [referralLink, setReferralLink] = useState("")
  const [copiedReferral, setCopiedReferral] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    displayName: "",
    bio: "",
    city: "",
    country: "",
    dateOfBirth: "",
    gender: "",
    looking_for: "",
  })
  const profilePictureInputRef = useRef<HTMLInputElement>(null)
  const coverPictureInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) {
      setSelectedInterests(Array.isArray(user.interests) ? user.interests : [])
      setFormData({
        displayName: user.display_name || "",
        bio: user.bio || "",
        city: user.city || "",
        country: user.country || "",
        dateOfBirth: user.date_of_birth || "",
        gender: user.gender || "",
        looking_for: user.looking_for || "",
      })
    }
  }, [user])

  useEffect(() => {
    async function fetchReferralLink() {
      try {
        const res = await fetch("/api/referral/link")
        if (res.ok) {
          const data = await res.json()
          setReferralLink(data.referralLink)
        }
      } catch (err) {
        console.error("Failed to fetch referral link:", err)
      }
    }
    fetchReferralLink()
  }, [])

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    )
  }

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    try {
      setUploading(true)
      const { url, error } = await uploadProfilePicture(user.id, file)

      if (error) {
        console.error("Upload error:", error)
        return
      }

      if (url) {
        // Update user profile with new picture URL
        const { error: updateError } = await updateUserProfile(user.id, {
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
    }
  }

  const handleCoverPictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    try {
      setUploading(true)
      const { url, error } = await uploadCoverPicture(user.id, file)

      if (error) {
        console.error("Upload error:", error)
        return
      }

      if (url) {
        // Update user profile with new cover picture URL
        const { error: updateError } = await updateUserProfile(user.id, {
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
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return

    try {
      setUploading(true)
      const { error } = await updateUserProfile(user.id, {
        display_name: formData.displayName,
        bio: formData.bio,
        city: formData.city,
        country: formData.country,
        interests: selectedInterests,
      })

      if (!error) {
        setIsEditing(false)
        refetch()
      } else {
        console.error("Update error:", error)
      }
    } catch (err) {
      console.error("Error saving profile:", err)
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">{error || "Failed to load profile"}</p>
      </div>
    )
  }

  const age = user.date_of_birth
    ? new Date().getFullYear() - new Date(user.date_of_birth).getFullYear()
    : 0

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Cover Image - Contained within layout */}
      {user.cover_picture && (
        <div className="relative h-32 md:h-48 rounded-xl overflow-hidden mb-8">
          <Image
            src={user.cover_picture}
            alt="Cover"
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex gap-4">
          {user.profile_picture && (
            <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-background">
              <Image
                src={user.profile_picture}
                alt={user.display_name || user.full_name}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="pt-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold">{user.display_name || user.full_name}</h1>
              {user.is_verified && (
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Verified
                </span>
              )}
            </div>
            <p className="text-muted-foreground">{user.email}</p>
            {user.city || user.country ? (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="w-4 h-4" />
                {user.city}, {user.country}
              </p>
            ) : null}
          </div>
        </div>

        {isEditing ? (
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-full" onClick={() => setIsEditing(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button className="rounded-full gradient-bg" onClick={() => setIsEditing(false)}>
              <Check className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button className="rounded-full gradient-bg" onClick={() => setIsEditing(true)}>
              <Edit className="w-4 h-4 mr-2" />
              {t("editProfile")}
            </Button>
            {!user.is_verified && (
              <Link href="/dashboard/verification">
                <Button variant="outline" className="rounded-full">
                  <Shield className="w-4 h-4 mr-2" />
                  Get Verified
                </Button>
              </Link>
            )}
            <Button
              variant="outline"
              className="rounded-full"
              onClick={async () => {
                const shareData = {
                  title: `Join me on V2G`,
                  text: `Check out my profile on V2G!`,
                  url: window.location.href,
                }
                if (navigator.share) {
                  try {
                    await navigator.share(shareData)
                  } catch (err) {
                    console.error("Error sharing:", err)
                  }
                } else {
                  navigator.clipboard.writeText(
                    `Check out my profile on V2G: ${window.location.href}`
                  )
                }
              }}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        )}
      </div>

      {/* Referral Code Card */}
      {user?.referral_code && (
        <Card className="border-border/50 mb-8 overflow-hidden">
          <div className="gradient-bg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70 mb-1">Your Referral Code</p>
                <p className="text-2xl font-bold font-mono">{user.referral_code}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white/20 text-white hover:bg-white/30 border-0 rounded-full"
                  onClick={() => {
                    navigator.clipboard.writeText(user.referral_code)
                    setCopiedReferral(true)
                    setTimeout(() => setCopiedReferral(false), 2000)
                  }}
                >
                  <Copy className="w-4 h-4 mr-1" />
                  {copiedReferral ? "Copied" : "Copy"}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white/20 text-white hover:bg-white/30 border-0 rounded-full"
                  onClick={async () => {
                    const shareData = {
                      title: "Join V2G",
                      text: `Join me on V2G using my referral code: ${user.referral_code}`,
                      url: referralLink,
                    }
                    if (navigator.share) {
                      try {
                        await navigator.share(shareData)
                      } catch (err) {
                        console.error("Error sharing:", err)
                      }
                    } else {
                      navigator.clipboard.writeText(
                        `Join V2G using my referral code: ${user.referral_code}\n${referralLink}`
                      )
                    }
                  }}
                >
                  <Share2 className="w-4 h-4 mr-1" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{user.followers_count || 0}</p>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Users className="w-4 h-4" />
                Followers
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{user.following_count || 0}</p>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Users className="w-4 h-4" />
                Following
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{user.coins_balance || 0}</p>
              <p className="text-sm text-muted-foreground">Coins</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Full Name</Label>
                <Input defaultValue={user.full_name || ""} disabled={!isEditing} className="mt-1.5" />
              </div>
              <div>
                <Label>Display Name</Label>
                <Input defaultValue={user.display_name || ""} disabled={!isEditing} className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea
                defaultValue={user.bio || ""}
                disabled={!isEditing}
                className="mt-1.5 min-h-24"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Location</Label>
                <div className="relative mt-1.5">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    defaultValue={`${user.city || ""}, ${user.country || ""}`} 
                    disabled={!isEditing} 
                    className="pl-10" 
                  />
                </div>
              </div>
              <div>
                <Label>Birthday</Label>
                <div className="relative mt-1.5">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    type="date" 
                    defaultValue={formData.dateOfBirth} 
                    disabled={!isEditing} 
                    className="pl-10" 
                  />
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Gender</Label>
                <Input defaultValue={formData.gender} disabled={!isEditing} className="mt-1.5" />
              </div>
              <div>
                <Label>Looking For</Label>
                <Input defaultValue={formData.looking_for} disabled={!isEditing} className="mt-1.5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interests */}
        {user.interests && user.interests.length > 0 && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Interests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {user.interests.map((interest) => (
                  <Badge
                    key={interest}
                    variant="outline"
                    className="px-4 py-2 text-sm"
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
