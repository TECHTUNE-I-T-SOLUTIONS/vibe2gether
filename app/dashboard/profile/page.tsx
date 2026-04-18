"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
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
  Shield,
  Share2,
  Copy,
  Loader2,
  MoreVertical,
  MessageCircle,
  Bookmark,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useI18n } from "@/lib/i18n/context"
import { useUserProfile } from "@/hooks/use-user-profile"
import { uploadProfilePicture, uploadCoverPicture } from "@/lib/supabase/storage"
import { updateUserProfile } from "@/lib/supabase/queries"
import { VerificationModal } from "@/components/verification-modal-improved"

export default function ProfilePage() {
  const { t } = useI18n()
  const { data: session, status } = useSession()
  const router = useRouter()
  const { user, loading, error, refetch } = useUserProfile()
  const [isEditing, setIsEditing] = useState(false)
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [referralLink, setReferralLink] = useState("")
  const [copiedReferral, setCopiedReferral] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [verificationModalOpen, setVerificationModalOpen] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<any>(null)
  const [formData, setFormData] = useState({
    displayName: "",
    bio: "",
    city: "",
    country: "",
    dateOfBirth: "",
    gender: "",
    looking_for: "",
    countryCode: "+234",
    mobileNumber: "",
    interests: "",
  })
  const [posts, setPosts] = useState<any[]>([])
  const [postsLoading, setPostsLoading] = useState(false)
  // const profilePictureInputRef = useRef<HTMLInputElement>(null)
  // const coverPictureInputRef = useRef<HTMLInputElement>(null)

  // Auth check
  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

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
        countryCode: user.country_code || "+234",
        mobileNumber: user.mobile_number || "",
        interests: Array.isArray(user.interests) ? user.interests.join(", ") : "",
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

  useEffect(() => {
    async function fetchVerificationStatus() {
      try {
        const response = await fetch("/api/user/verification-status")
        if (response.ok) {
          const data = await response.json()
          setVerificationStatus(data.verification)
        }
      } catch (err) {
        console.error("Failed to fetch verification status:", err)
      }
    }
    fetchVerificationStatus()
  }, [])

  // Fetch user posts
  useEffect(() => {
    async function fetchUserPosts() {
      try {
        setPostsLoading(true)
        if (!user?.id) return
        
        const response = await fetch(`/api/posts?userId=${user.id}&limit=100`)
        if (response.ok) {
          const data = await response.json()
          setPosts(data.posts || [])
        }
      } catch (err) {
        console.error("Failed to fetch user posts:", err)
      } finally {
        setPostsLoading(false)
      }
    }

    if (user?.id) {
      fetchUserPosts()
    }
  }, [user?.id])

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
      
      // Parse location
      const [city, country] = formData.city.includes(',')
        ? formData.city.split(',').map(s => s.trim())
        : [formData.city, '']

      // Parse interests from comma-separated string
      const interestsArray = formData.interests
        .split(',')
        .map(i => i.trim())
        .filter(i => i.length > 0)

      const { error } = await updateUserProfile(user.id, {
        display_name: formData.displayName,
        bio: formData.bio,
        city: city,
        country: country,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        looking_for: formData.looking_for,
        country_code: formData.countryCode,
        mobile_number: formData.mobileNumber,
        interests: interestsArray,
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
    <div className="pt-16">
      {/* Cover Image - Full width */}
      {user.cover_picture && (
        <div className="relative h-32 md:h-48 lg:h-56 w-full overflow-hidden">
          <Image
            src={user.cover_picture}
            alt="Cover"
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
        {/* Profile Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6 mb-6 sm:mb-8 -mt-12 sm:-mt-20 relative z-10">
          {/* Profile Picture */}
          {user.profile_picture && (
            <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-background shadow-xl flex-shrink-0">
              <Image
                src={user.profile_picture}
                alt={user.display_name || user.full_name}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-2xl md:text-4xl font-bold">{user.display_name || user.full_name}</h1>
              {user.is_premium && (
                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 px-3 py-1 rounded-full text-xs md:text-sm font-semibold">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  Premium
                </span>
              )}
              {verificationStatus?.status === "verified" && (
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-xs">
                  <Check className="h-4 w-4" />
                  Verified
                </span>
              )}
            </div>

            {/* Email and Location */}
            <p className="text-sm text-muted-foreground mb-1">{user.email}</p>
            {user.city || user.country ? (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {user.city}, {user.country}
              </p>
            ) : null}
          </div>

          {/* Action Buttons */}
          {isEditing ? (
            <div className="flex gap-2 w-full sm:w-auto">
              <Button size="sm" variant="outline" className="rounded-full flex-1 sm:flex-none" onClick={() => setIsEditing(false)} disabled={uploading}>
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button 
                size="sm" 
                className="rounded-full gradient-bg flex-1 sm:flex-none" 
                onClick={handleSaveProfile}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Saving
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Save
                  </>
                )}
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop View */}
              <div className="hidden sm:flex gap-2 flex-wrap justify-end w-full sm:w-auto">
                <Button size="sm" className="rounded-full gradient-bg" onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                {verificationStatus?.status !== "verified" && (
                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => setVerificationModalOpen(true)}>
                    <Shield className="w-4 h-4 mr-1" />
                    Verify
                  </Button>
                )}
                <Button
                  size="sm"
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
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Mobile View */}
              <div className="sm:hidden w-full">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" className="rounded-full w-full">
                      <MoreVertical className="w-4 h-4 mr-2" />
                      More Options
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </DropdownMenuItem>
                    {verificationStatus?.status !== "verified" && (
                      <DropdownMenuItem onClick={() => setVerificationModalOpen(true)}>
                        <Shield className="w-4 h-4 mr-2" />
                        Verify Account
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
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
                      Share Profile
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}
        </div>

        {/* Verification Modal */}
        <VerificationModal
          open={verificationModalOpen}
          onOpenChange={setVerificationModalOpen}
          verificationStatus={verificationStatus}
          onVerificationSubmitted={() => {
            setVerificationModalOpen(false)
            refetch()
          }}
        />

        {/* Bio Section (if editing) */}
        {isEditing && (
          <Card className="border-border/50 mb-6">
            <CardContent className="pt-6">
              <Label>Bio</Label>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                className="mt-2 min-h-20"
              />
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
          <Card className="border-border/50 hover:shadow-md transition-shadow">
            <CardContent className="pt-4 sm:pt-6">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-black">{user.followers_count || 0}</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">Followers</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 hover:shadow-md transition-shadow">
            <CardContent className="pt-4 sm:pt-6">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-black">{user.following_count || 0}</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">Following</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 hover:shadow-md transition-shadow">
            <CardContent className="pt-4 sm:pt-6">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-black">{user.coins_balance || 0}</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">Coins</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Referral Code Card */}
        {user?.referral_code && (
          <Card className="border-border/50 mb-8 overflow-hidden">
            <div className="gradient-bg p-4 md:p-6 text-white">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-white/70 mb-2">Your Referral Code</p>
                  <p className="text-lg md:text-xl font-bold font-mono">{user.referral_code}</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-white/20 text-white hover:bg-white/30 border-0 rounded-full flex-1 sm:flex-none"
                    onClick={() => {
                      if (user.referral_code) {
                        navigator.clipboard.writeText(user.referral_code)
                        setCopiedReferral(true)
                        setTimeout(() => setCopiedReferral(false), 2000)
                      }
                    }}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    {copiedReferral ? "Copied" : "Copy"}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-white/20 text-white hover:bg-white/30 border-0 rounded-full flex-1 sm:flex-none"
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

        {/* Profile Details Section (when not editing) */}
        {!isEditing && (
          <Card className="border-border/50 mb-8">
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Bio */}
              <div>
                <p className="text-sm font-semibold text-foreground/70 mb-1">Bio</p>
                <p className="text-sm text-foreground">{formData.bio || "Not provided"}</p>
              </div>

              {/* Location & Birthday */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground/70 mb-1 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    Location
                  </p>
                  <p className="text-sm text-foreground">{formData.city || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground/70 mb-1 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Birthday
                  </p>
                  <p className="text-sm text-foreground">{formData.dateOfBirth || "Not provided"}</p>
                </div>
              </div>

              {/* Gender & Looking For */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground/70 mb-1">Gender</p>
                  <p className="text-sm text-foreground capitalize">{formData.gender || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground/70 mb-1">Looking For</p>
                  <p className="text-sm text-foreground capitalize">{formData.looking_for || "Not provided"}</p>
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <p className="text-sm font-semibold text-foreground/70 mb-1">Phone</p>
                <p className="text-sm text-foreground">{formData.mobileNumber ? `${formData.countryCode} ${formData.mobileNumber}` : "Not provided"}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Profile Sections (only show when editing) */}
        {isEditing && (
          <div className="space-y-6 my-8">
            {/* Profile Edit Card */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Edit Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input 
                      value={user.full_name || ""} 
                      disabled={true} 
                      className="mt-1.5" 
                    />
                  </div>
                  <div>
                    <Label>Display Name</Label>
                    <Input 
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      className="mt-1.5" 
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Location (City, Country)</Label>
                    <div className="relative mt-1.5">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <Input 
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="e.g., Lagos, Nigeria"
                        className="pl-10" 
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Birthday</Label>
                    <div className="relative mt-1.5">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <Input 
                        type="date" 
                        value={formData.dateOfBirth} 
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        className="pl-10" 
                      />
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Gender</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Select your gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="non-binary">Non-binary</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer-not">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Looking For</Label>
                    <Select value={formData.looking_for} onValueChange={(value) => setFormData({ ...formData, looking_for: value })}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Select what you're looking for" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relationship">Serious Relationship</SelectItem>
                        <SelectItem value="casual">Casual Dating</SelectItem>
                        <SelectItem value="friendship">Friendship</SelectItem>
                        <SelectItem value="networking">Networking</SelectItem>
                        <SelectItem value="not-sure">Not Sure Yet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-border/50">
                  <div>
                    <Label>Country Code</Label>
                    <Select value={formData.countryCode} onValueChange={(value) => setFormData({ ...formData, countryCode: value })}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Select country code" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="+234">🇳🇬 +234 (Nigeria)</SelectItem>
                        <SelectItem value="+237">🇨🇲 +237 (Cameroon)</SelectItem>
                        <SelectItem value="+1">🇺🇸 +1 (USA/Canada)</SelectItem>
                        <SelectItem value="+44">🇬🇧 +44 (UK)</SelectItem>
                        <SelectItem value="+91">🇮🇳 +91 (India)</SelectItem>
                        <SelectItem value="+255">🇹🇿 +255 (Tanzania)</SelectItem>
                        <SelectItem value="+27">🇿🇦 +27 (South Africa)</SelectItem>
                        <SelectItem value="+233">🇬🇭 +233 (Ghana)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Mobile Number</Label>
                    <Input
                      placeholder="e.g., 9123456789"
                      value={formData.mobileNumber}
                      onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value.replace(/\D/g, '') })}
                      disabled={uploading}
                      className="mt-1.5"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Without country code</p>
                  </div>
                </div>

                {/* Interests Edit */}
                <div className="mt-6 pt-6 border-t border-border/50">
                  <Label className="text-base font-semibold">Interests</Label>
                  <Textarea
                    placeholder="e.g., Gaming, Music, Travel, Reading, Coding"
                    value={formData.interests}
                    onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                    disabled={uploading}
                    className="mt-3 min-h-16"
                  />
                  <p className="text-xs text-muted-foreground mt-2">Separate interests with commas</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Interests Display (when not editing) */}
        {!isEditing && user.interests && user.interests.length > 0 && (
          <Card className="border-border/50 mb-8">
            <CardHeader>
              <CardTitle>Interests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {user.interests.map((interest) => (
                  <Badge
                    key={interest}
                    variant="outline"
                    className="px-3 py-1 text-sm"
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Posts Grid Section */}
        <div className="mt-12 mb-8">
          <h2 className="text-2xl font-black mb-6">Your Posts</h2>
          
          {postsLoading ? (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <Card className="border-border/50 p-8 sm:p-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <MessageCircle className="w-12 h-12 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No posts yet. Create your first post to get started!</p>
                <Button asChild className="gradient-bg mt-4">
                  <Link href="/dashboard/feed">Create Post</Link>
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {posts.map((post) => (
                <Link key={post.id} href={`/post/${post.id}`} className="group">
                  <Card className="border-border/50 overflow-hidden h-full aspect-square hover:shadow-lg transition-all duration-300 cursor-pointer">
                    <CardContent className="p-0 relative h-full bg-muted">
                      {post.media && post.media.length > 0 ? (
                        <Image
                          src={post.media[0]}
                          alt="Post"
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-purple-500/10">
                          <MessageCircle className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                      )}

                      {/* Overlay with stats on hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center gap-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="text-white text-center">
                          <Heart className="w-6 h-6 mx-auto mb-1 fill-white" />
                          <p className="text-sm font-semibold">{post.likes || 0}</p>
                        </div>
                        <div className="text-white text-center">
                          <MessageCircle className="w-6 h-6 mx-auto mb-1" />
                          <p className="text-sm font-semibold">{post.comments || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

