"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Shield, Eye, EyeOff, MessageSquare, Lock } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useUserProfile } from "@/hooks/use-user-profile"
import { getPrivacySettings, updatePrivacySettings } from "@/lib/supabase/queries"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

export default function PrivacySettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { user, loading } = useUserProfile()

  // Auth check
  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])
  const [privacy, setPrivacy] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [loadingPrefs, setLoadingPrefs] = useState(true)
  const [blockedUsers, setBlockedUsers] = useState<any[]>([])
  const [mutedUsers, setMutedUsers] = useState<any[]>([])
  const [showBlockedDialog, setShowBlockedDialog] = useState(false)
  const [showMutedDialog, setShowMutedDialog] = useState(false)

  useEffect(() => {
    if (user) {
      fetchPrivacy()
    }
  }, [user])

  async function fetchPrivacy() {
    try {
      setLoadingPrefs(true)
      const { data } = await getPrivacySettings(user.id)
      setPrivacy(data || {
        profile_visibility: "public",
        show_online_status: true,
        allow_direct_messages: true,
        allow_match_requests: true,
        blocked_users: [],
        muted_users: [],
      })
      setBlockedUsers(data?.blocked_users || [])
      setMutedUsers(data?.muted_users || [])
    } catch (err) {
      console.error("Failed to fetch privacy settings:", err)
    } finally {
      setLoadingPrefs(false)
    }
  }

  async function handleUpdate(key: string, value: any) {
    if (!user) return

    try {
      setSaving(true)
      setPrivacy({ ...privacy, [key]: value })
      await updatePrivacySettings(user.id, { [key]: value })
    } catch (err) {
      console.error("Failed to update privacy settings:", err)
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
            <Shield className="w-8 h-8" />
            Privacy Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Control who can see your profile and contact you</p>
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Profile Visibility</CardTitle>
          <CardDescription>Control who can see your profile</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {[
              { value: "public", label: "Public", description: "Anyone can view your profile" },
              { value: "friends", label: "Friends Only", description: "Only people you follow can view" },
              { value: "private", label: "Private", description: "No one can view your profile" },
            ].map((option) => (
              <div
                key={option.value}
                className={`p-4 border rounded-lg cursor-pointer transition ${
                  privacy?.profile_visibility === option.value
                    ? "border-primary bg-primary/5"
                    : "border-border/50 hover:border-border"
                }`}
                onClick={() => handleUpdate("profile_visibility", option.value)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      privacy?.profile_visibility === option.value
                        ? "border-primary bg-primary"
                        : "border-muted-foreground"
                    }`}
                  >
                    {privacy?.profile_visibility === option.value && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <div>
                    <Label className="text-base font-semibold cursor-pointer">{option.label}</Label>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Status & Interactions</CardTitle>
          <CardDescription>Control your online presence and interactions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold cursor-pointer flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Show Online Status
              </Label>
              <p className="text-sm text-muted-foreground mt-1">Let others see when you're online</p>
            </div>
            <Switch
              checked={privacy?.show_online_status ?? true}
              onCheckedChange={(value) => handleUpdate("show_online_status", value)}
              disabled={saving}
            />
          </div>

          <div className="border-t border-border/50 pt-6 flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold cursor-pointer flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Allow Direct Messages
              </Label>
              <p className="text-sm text-muted-foreground mt-1">People can send you direct messages</p>
            </div>
            <Switch
              checked={privacy?.allow_direct_messages ?? true}
              onCheckedChange={(value) => handleUpdate("allow_direct_messages", value)}
              disabled={saving}
            />
          </div>

          <div className="border-t border-border/50 pt-6 flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold cursor-pointer flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Allow Match Requests
              </Label>
              <p className="text-sm text-muted-foreground mt-1">People can send you match requests</p>
            </div>
            <Switch
              checked={privacy?.allow_match_requests ?? true}
              onCheckedChange={(value) => handleUpdate("allow_match_requests", value)}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Blocked Users</CardTitle>
          <CardDescription>Users you've blocked won't be able to contact you</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowBlockedDialog(true)}
          >
            {blockedUsers.length > 0 ? `View ${blockedUsers.length} Blocked User${blockedUsers.length !== 1 ? "s" : ""}` : "No blocked users"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Muted Users</CardTitle>
          <CardDescription>You won't see updates from muted users</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowMutedDialog(true)}
          >
            {mutedUsers.length > 0 ? `View ${mutedUsers.length} Muted User${mutedUsers.length !== 1 ? "s" : ""}` : "No muted users"}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showBlockedDialog} onOpenChange={setShowBlockedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Blocked Users</DialogTitle>
            <DialogDescription>Manage users you've blocked</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {blockedUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No blocked users</p>
            ) : (
              blockedUsers.map((user: any) => (
                <div key={user.id} className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                  <span className="text-sm font-medium">{user.display_name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setBlockedUsers(blockedUsers.filter((u: any) => u.id !== user.id))
                      handleUpdate("blocked_users", blockedUsers.filter((u: any) => u.id !== user.id))
                    }}
                  >
                    Unblock
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showMutedDialog} onOpenChange={setShowMutedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Muted Users</DialogTitle>
            <DialogDescription>Manage users you've muted</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {mutedUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No muted users</p>
            ) : (
              mutedUsers.map((user: any) => (
                <div key={user.id} className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                  <span className="text-sm font-medium">{user.display_name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setMutedUsers(mutedUsers.filter((u: any) => u.id !== user.id))
                      handleUpdate("muted_users", mutedUsers.filter((u: any) => u.id !== user.id))
                    }}
                  >
                    Unmute
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
