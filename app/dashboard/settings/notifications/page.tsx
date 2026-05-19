"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Bell } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useUserProfile } from "@/hooks/use-user-profile"
import { getNotificationPreferences, updateNotificationPreferences } from "@/lib/supabase/queries"
import { useToast } from "@/hooks/use-toast"

export default function NotificationSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { user, loading } = useUserProfile()
  const { toast } = useToast()
  const [preferences, setPreferences] = useState<any>(null)
  const [pushNotificationEnabled, setPushNotificationEnabled] = useState(false)
  const [pushBlockedDialog, setPushBlockedDialog] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)

  // Auth check
  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])
  const [saving, setSaving] = useState(false)
  const [loadingPrefs, setLoadingPrefs] = useState(true)

  useEffect(() => {
    if (user) {
      fetchPreferences()
      checkPushSubscriptionStatus()
    }
  }, [user])

  async function checkPushSubscriptionStatus() {
    try {
      // First check the database for user's subscriptions
      const dbResponse = await fetch("/api/push/check");
      
      if (dbResponse.ok) {
        const dbData = await dbResponse.json();
        
        if (dbData.hasSubscription) {
          // User has active subscription in database
          setPushNotificationEnabled(true);
          return;
        }
      }

      // If no database subscription, check browser status
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setPushNotificationEnabled(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      setPushNotificationEnabled(!!subscription);
    } catch (err) {
      console.error("Error checking push subscription:", err);
      setPushNotificationEnabled(false);
    }
  }

  async function fetchPreferences() {
    try {
      setLoadingPrefs(true)
      if (!user) return
      
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

  const handlePushNotificationToggle = async (value: boolean) => {
    setPushLoading(true)
    try {
      // Check if browser supports push notifications
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        toast({
          title: "Not Supported",
          description: "Your browser doesn't support push notifications",
          variant: "destructive",
        })
        setPushLoading(false)
        return
      }

      if (!value) {
        // Unsubscribe from push notifications
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        
        if (subscription) {
          // Unsubscribe from browser
          await subscription.unsubscribe()
          
          // Notify backend to remove subscription
          try {
            await fetch("/api/push/subscribe", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                endpoint: subscription.endpoint,
              }),
            })
          } catch (err) {
            console.error("Error notifying backend of unsubscribe:", err)
          }
          
          setPushNotificationEnabled(false)
          toast({
            title: "Success",
            description: "Push notifications disabled",
          })
        }
        setPushLoading(false)
        return
      }

      // Subscribe to push notifications
      const registration = await navigator.serviceWorker.ready
      const existingSubscription = await registration.pushManager.getSubscription()
      
      if (existingSubscription) {
        // Already subscribed
        setPushNotificationEnabled(true)
        toast({
          title: "Already Subscribed",
          description: "You're already receiving push notifications",
        })
        setPushLoading(false)
        return
      }

      const permission = Notification.permission
      
      if (permission === "denied") {
        setPushBlockedDialog(true)
        setPushLoading(false)
        return
      }

      if (permission === "granted") {
        // Permission already granted, subscribe
        await subscribeToPushNotifications()
        setPushLoading(false)
        return
      }

      // Request permission
      const newPermission = await Notification.requestPermission()
      
      if (newPermission === "granted") {
        await subscribeToPushNotifications()
      } else if (newPermission === "denied") {
        setPushBlockedDialog(true)
      }
    } catch (err) {
      console.error("Error toggling push notifications:", err)
      toast({
        title: "Error",
        description: "Failed to toggle push notifications",
        variant: "destructive",
      })
    } finally {
      setPushLoading(false)
    }
  }

  const subscribeToPushNotifications = async () => {
    try {
      const registration = await navigator.serviceWorker.ready

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      })

      // Send subscription to backend
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save subscription")
      }

      // Verify subscription was saved to database
      await new Promise(resolve => setTimeout(resolve, 500));
      const checkResponse = await fetch("/api/push/check");
      
      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        if (checkData.hasSubscription) {
          setPushNotificationEnabled(true);
          toast({
            title: "Success",
            description: "Push notifications enabled",
          });
          return;
        }
      }

      // If verification failed, still set local state but warn user
      setPushNotificationEnabled(true);
      toast({
        title: "Subscribed",
        description: "Push notifications have been enabled",
      });
    } catch (err) {
      console.error("Error subscribing to push notifications:", err)
      setPushNotificationEnabled(false);
      toast({
        title: "Error",
        description: "Failed to enable push notifications",
        variant: "destructive",
      })
    }
  }

  const handleEnablePushInBrowser = () => {
    setPushBlockedDialog(false)
    // Open browser settings hint
    toast({
      title: "Enable Notifications",
      description: "Go to your browser settings and allow notifications for this site",
    })
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
            { key: "match_notifications", label: "Connect", description: "When you connect with someone" },
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
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold cursor-pointer">Email Notifications</Label>
              <p className="text-sm text-muted-foreground mt-1">Important updates via email</p>
            </div>
            <Switch
              checked={preferences?.email_notifications ?? false}
              onCheckedChange={(value) => handleUpdate("email_notifications", value)}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold cursor-pointer">Push Notifications</Label>
              <p className="text-sm text-muted-foreground mt-1">Browser push notifications on this device</p>
            </div>
            <Switch
              checked={pushNotificationEnabled}
              onCheckedChange={handlePushNotificationToggle}
              disabled={pushLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications Blocked Dialog */}
      <Dialog open={pushBlockedDialog} onOpenChange={setPushBlockedDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Push Notifications Blocked</DialogTitle>
            <DialogDescription>
              You've blocked notifications for this site. To enable push notifications, you need to allow them in your browser settings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg text-sm space-y-2">
              <p className="font-semibold">To enable notifications:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Click the lock icon next to the URL</li>
                <li>Find "Notifications" in the permissions</li>
                <li>Change it from "Block" to "Allow"</li>
                <li>Refresh the page</li>
              </ol>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPushBlockedDialog(false)}>
              Close
            </Button>
            <Button className="gradient-bg" onClick={handleEnablePushInBrowser}>
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
