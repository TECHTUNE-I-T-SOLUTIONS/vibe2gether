"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useUserProfile } from "@/hooks/use-user-profile"
import { updateUserProfile } from "@/lib/supabase/queries"

export default function AccountSettingsPage() {
  const { user, loading, refetch } = useUserProfile()
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    display_name: "",
    email: "",
    full_name: "",
    bio: "",
    city: "",
    country: "",
    mobile_number: "",
  })

  useEffect(() => {
    if (user) {
      setFormData({
        display_name: user.display_name || "",
        email: user.email || "",
        full_name: user.full_name || "",
        bio: user.bio || "",
        city: user.city || "",
        country: user.country || "",
        mobile_number: user.mobile_number || "",
      })
    }
  }, [user])

  async function handleSave() {
    if (!user) return

    try {
      setSaving(true)
      await updateUserProfile(user.id, formData)
      await refetch()
      setIsEditing(false)
    } catch (err) {
      console.error("Failed to update profile:", err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center gap-4 pt-4">
        <Link href="/dashboard/settings">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Account Settings</h1>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Update your basic profile information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isEditing ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Display Name</p>
                <p className="text-base">{formData.display_name || "Not set"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Email</p>
                <p className="text-base">{formData.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Full Name</p>
                <p className="text-base">{formData.full_name || "Not set"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Bio</p>
                <p className="text-base">{formData.bio || "Not set"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">City</p>
                <p className="text-base">{formData.city || "Not set"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Country</p>
                <p className="text-base">{formData.country || "Not set"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Mobile Number</p>
                <p className="text-base">{formData.mobile_number || "Not set"}</p>
              </div>
              <Button onClick={() => setIsEditing(true)} className="gradient-bg">
                Edit Information
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>Display Name</Label>
                <Input
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Full Name</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Bio</Label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="h-20"
                />
              </div>
              <div>
                <Label>City</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div>
                <Label>Country</Label>
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>
              <div>
                <Label>Mobile Number</Label>
                <Input
                  value={formData.mobile_number}
                  onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="gradient-bg flex-1"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50 border-yellow-500/20 bg-yellow-500/5">
        <CardHeader>
          <CardTitle className="text-yellow-700">Email Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-4">
            {user?.email_verified_at
              ? "Your email is verified"
              : "Please verify your email address for account security"}
          </p>
          {!user?.email_verified_at && (
            <Button variant="outline">Send Verification Email</Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
