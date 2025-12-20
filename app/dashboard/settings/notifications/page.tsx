"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Loader2, Bell } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useUserProfile } from "@/hooks/use-user-profile"
import { getNotificationPreferences, updateNotificationPreferences } from "@/lib/supabase/queries"

export default function NotificationSettingsPage() {
  const { user, loading } = useUserProfile()
  const [preferences, setPreferences] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [loadingPrefs, setLoadingPrefs] = useState(true)

  useEffect(() => {
    if (user) {
      fetchPreferences()
    }
  }, [user])

  async function fetchPreferences() {
    try {
      setLoadingPrefs(true)
      const { data } = await getNotificationPreferences(user.id)
      setPreferences(data || {
        likes_notifications: true,
        comments_notifications: true,
        messages_notifications: true,
        match_notifications: true,
        event_notifications: true,
        email_notifications: false,
        push_notifications: true,
      })
    } catch (err) {
      console.error("Failed to fetch preferences:", err)
    } finally {
      setLoadingPrefs(false)
    }
  }

  async function handleUpdate(key: string, value: boolean) {
    if (!user) return

    try {
      setSaving(true)
      setPreferences({ ...preferences, [key]: value })
      await updateNotificationPreferences(user.id, { [key]: value })
    } catch (err) {
      console.error("Failed to update preferences:", err)
    } finally {
      setSaving(false)
    }
  }

  if (loading || loadingPrefs) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center gap-4 pt-2">
        <Link href="/dashboard/settings">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="w-8 h-8" />
            Notification Preferences
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage how you receive notifications</p>
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>In-App Notifications</CardTitle>
          <CardDescription>Notifications you receive while using Vibe2Gether</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {[
            { key: "likes_notifications", label: "Likes", description: "When someone likes your post" },
            { key: "comments_notifications", label: "Comments", description: "When someone comments on your post" },
            { key: "messages_notifications", label: "Messages", description: "When you receive a new message" },
            { key: "match_notifications", label: "Matches", description: "When you match with someone" },
            { key: "event_notifications", label: "Events", description: "Event updates and reminders" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold cursor-pointer">{item.label}</Label>
                <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
              </div>
              <Switch
                checked={preferences?.[item.key] ?? true}
                onCheckedChange={(value) => handleUpdate(item.key, value)}
                disabled={saving}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Other Notifications</CardTitle>
          <CardDescription>Notifications outside of the app</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {[
            { key: "email_notifications", label: "Email Notifications", description: "Important updates via email" },
            { key: "push_notifications", label: "Push Notifications", description: "Browser push notifications" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold cursor-pointer">{item.label}</Label>
                <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
              </div>
              <Switch
                checked={preferences?.[item.key] ?? false}
                onCheckedChange={(value) => handleUpdate(item.key, value)}
                disabled={saving}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
