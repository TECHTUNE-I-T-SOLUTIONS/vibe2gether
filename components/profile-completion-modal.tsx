"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MapPin, Calendar, Phone, Loader2 } from "lucide-react"
import { updateUserProfile } from "@/lib/supabase/queries"
import { useToast } from "@/hooks/use-toast"

interface ProfileCompletionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  onComplete: () => void
}

export function ProfileCompletionModal({
  open,
  onOpenChange,
  userId,
  onComplete,
}: ProfileCompletionModalProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    displayName: "",
    bio: "",
    city: "",
    country: "",
    dateOfBirth: "",
    gender: "",
    looking_for: "",
    countryCode: "+234", // Default to Nigeria
    mobileNumber: "",
    interests: "",
  })
  const [originalData, setOriginalData] = useState({
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

  // Fetch user data when modal opens
  useEffect(() => {
    if (!open || !userId) return

    const fetchUserData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/user/profile?userId=${userId}`)
        if (response.ok) {
          const data = await response.json()
          const user = data.user

          const userData = {
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
          }
          setFormData(userData)
          setOriginalData(userData) // Store original data for comparison
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error)
        toast({
          title: "Error",
          description: "Failed to load your profile data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [open, userId, toast])

  const handleSave = async () => {
    if (!formData.displayName.trim()) {
      toast({
        title: "Display Name Required",
        description: "Please enter a display name",
        variant: "destructive",
      })
      return
    }

    if (formData.mobileNumber && !formData.mobileNumber.match(/^\d{10,}$/)) {
      toast({
        title: "Invalid Mobile Number",
        description: "Mobile number must be at least 10 digits",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)

      const [city, country] = formData.city.includes(',')
        ? formData.city.split(',').map(s => s.trim())
        : [formData.city, formData.country]

      // Parse interests from comma-separated string
      const interestsArray = formData.interests
        .split(',')
        .map(i => i.trim())
        .filter(i => i.length > 0)

      const { error } = await updateUserProfile(userId, {
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
        toast({
          title: "Success!",
          description: "Your profile has been updated",
          variant: "default",
        })
        onOpenChange(false)
        onComplete()
      } else {
        toast({
          title: "Error",
          description: "Failed to update profile. Please try again.",
          variant: "destructive",
        })
        console.error(error)
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      })
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = () => {
    // Mark that user skipped profile completion
    localStorage.setItem("profile_completion_skipped", "true")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
          <DialogDescription>
            Let's set up your profile so others can know more about you. You can always update this later.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Scrollable form content */}
            <div className="max-h-[60vh] overflow-y-auto">
              <div className="space-y-4 py-4 pr-4">
                {/* Display Name - Show if originally empty or being edited */}
                {(!originalData.displayName || formData.displayName !== originalData.displayName) && (
                  <div>
                    <Label htmlFor="displayName" className="text-sm font-medium">
                      Display Name *
                    </Label>
                    <Input
                      id="displayName"
                      placeholder="e.g., John Doe"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      disabled={saving}
                      className="mt-1.5"
                      autoFocus
                    />
                  </div>
                )}

                {/* Bio - Show if originally empty or being edited */}
                {(!originalData.bio || formData.bio !== originalData.bio) && (
                  <div>
                    <Label htmlFor="bio" className="text-sm font-medium">
                      Bio
                    </Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about yourself..."
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      disabled={saving}
                      className="mt-1.5 min-h-20"
                    />
                  </div>
                )}

                {/* Location & Birthday */}
                {((!originalData.city || formData.city !== originalData.city) || (!originalData.dateOfBirth || formData.dateOfBirth !== originalData.dateOfBirth)) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(!originalData.city || formData.city !== originalData.city) && (
                      <div>
                        <Label htmlFor="location" className="text-sm font-medium">
                          Location
                        </Label>
                        <div className="relative mt-1.5">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                          <Input
                            id="location"
                            placeholder="e.g., Lagos, Nigeria"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            disabled={saving}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    )}

                    {(!originalData.dateOfBirth || formData.dateOfBirth !== originalData.dateOfBirth) && (
                      <div>
                        <Label htmlFor="birthday" className="text-sm font-medium">
                          Birthday
                        </Label>
                        <div className="relative mt-1.5">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                          <Input
                            id="birthday"
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                            disabled={saving}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Gender & Looking For */}
                {((!originalData.gender || formData.gender !== originalData.gender) || (!originalData.looking_for || formData.looking_for !== originalData.looking_for)) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(!originalData.gender || formData.gender !== originalData.gender) && (
                      <div>
                        <Label htmlFor="gender" className="text-sm font-medium">
                          Gender
                        </Label>
                        <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                          <SelectTrigger id="gender" className="mt-1.5" disabled={saving}>
                            <SelectValue placeholder="Select gender" />
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
                    )}

                    {(!originalData.looking_for || formData.looking_for !== originalData.looking_for) && (
                      <div>
                        <Label htmlFor="lookingFor" className="text-sm font-medium">
                          Looking For
                        </Label>
                        <Select value={formData.looking_for} onValueChange={(value) => setFormData({ ...formData, looking_for: value })}>
                          <SelectTrigger id="lookingFor" className="mt-1.5" disabled={saving}>
                            <SelectValue placeholder="Select preference" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="relationship">Connections</SelectItem>
                            <SelectItem value="casual-dating">Casual Connections</SelectItem>
                            <SelectItem value="friendship">Friendship</SelectItem>
                            <SelectItem value="networking">Networking</SelectItem>
                            <SelectItem value="not-sure">Not Sure Yet</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}

                {/* Country Code & Mobile Number */}
                {((!originalData.countryCode || formData.countryCode !== originalData.countryCode) || (!originalData.mobileNumber || formData.mobileNumber !== originalData.mobileNumber)) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(!originalData.countryCode || formData.countryCode !== originalData.countryCode) && (
                      <div>
                        <Label htmlFor="countryCode" className="text-sm font-medium">
                          Country Code
                        </Label>
                        <Select value={formData.countryCode} onValueChange={(value) => setFormData({ ...formData, countryCode: value })}>
                          <SelectTrigger id="countryCode" className="mt-1.5" disabled={saving}>
                            <SelectValue placeholder="Select code" />
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
                    )}

                    {(!originalData.mobileNumber || formData.mobileNumber !== originalData.mobileNumber) && (
                      <div>
                        <Label htmlFor="mobileNumber" className="text-sm font-medium">
                          Mobile Number
                        </Label>
                        <div className="relative mt-1.5">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                          <Input
                            id="mobileNumber"
                            type="tel"
                            placeholder="e.g., 9123456789"
                            value={formData.mobileNumber}
                            onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value.replace(/\D/g, '') })}
                            disabled={saving}
                            className="pl-10"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Without country code</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Interests - Show if originally empty or being edited */}
                {(!originalData.interests || formData.interests !== originalData.interests) && (
                  <div>
                    <Label htmlFor="interests" className="text-sm font-medium">
                      Interests
                    </Label>
                    <Textarea
                      id="interests"
                      placeholder="e.g., Gaming, Music, Travel, Reading, Coding"
                      value={formData.interests}
                      onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                      disabled={saving}
                      className="mt-1.5 min-h-16"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Separate interests with commas</p>
                  </div>
                )}
              </div>
            </div>

            {/* Fixed button area */}
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleSkip}
                disabled={saving}
              >
                Skip for Now
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="gradient-bg"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Complete Profile"
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
