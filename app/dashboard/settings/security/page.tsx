"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Lock, Eye, EyeOff, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useUserProfile } from "@/hooks/use-user-profile"
import { getSecuritySettings, updateSecuritySettings } from "@/lib/supabase/queries"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

export default function SecuritySettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { user, loading } = useUserProfile()
  const { toast } = useToast()
  const [security, setSecurity] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [loadingPrefs, setLoadingPrefs] = useState(true)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showLoginHistoryDialog, setShowLoginHistoryDialog] = useState(false)
  const [showTwoFADialog, setShowTwoFADialog] = useState(false)
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" })
  const [passwordError, setPasswordError] = useState("")
  const [loginAttempts, setLoginAttempts] = useState<any[]>([])

  // Auth check
  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (user) {
      fetchSecurity()
    }
  }, [user])

  async function fetchSecurity() {
    try {
      setLoadingPrefs(true)
      const { data } = await getSecuritySettings(user.id)
      setSecurity(data || {
        two_factor_enabled: false,
        account_locked: false,
        last_login_attempt: new Date().toISOString(),
        login_attempt_count: 0,
      })
      // Simulate login attempts data
      setLoginAttempts([
        { device: "Chrome on Windows", timestamp: new Date().toISOString(), location: "United States" },
        { device: "Safari on iPhone", timestamp: new Date(Date.now() - 86400000).toISOString(), location: "United States" },
      ])
    } catch (err) {
      console.error("Failed to fetch security settings:", err)
    } finally {
      setLoadingPrefs(false)
    }
  }

  async function handleUpdate(key: string, value: any) {
    if (!user) return

    try {
      setSaving(true)
      setSecurity({ ...security, [key]: value })
      await updateSecuritySettings(user.id, { [key]: value })
    } catch (err) {
      console.error("Failed to update security settings:", err)
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword() {
    setPasswordError("")

    if (!passwords.current || !passwords.new || !passwords.confirm) {
      setPasswordError("Please fill in all password fields")
      return
    }

    if (passwords.new !== passwords.confirm) {
      setPasswordError("Passwords do not match")
      return
    }

    if (passwords.new.length < 8) {
      setPasswordError("Password must be at least 8 characters")
      return
    }

    try {
      setSaving(true)
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.new,
          confirmPassword: passwords.confirm,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setPasswordError(data.error || "Failed to change password")
        return
      }

      setPasswords({ current: "", new: "", confirm: "" })
      setShowPasswordDialog(false)
      toast({
        title: "Success",
        description: "Your password has been changed successfully",
      })
    } catch (err) {
      setPasswordError("Failed to change password. Please try again.")
      console.error(err)
      toast({
        title: "Error",
        description: "Failed to change password",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString()
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
            <Lock className="w-8 h-8" />
            Security Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your account security and login activity</p>
        </div>
      </div>

      {security?.account_locked && (
        <Alert className="border-destructive/50 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            Your account has been locked due to too many failed login attempts. Please contact support to unlock it.
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Manage your password</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowPasswordDialog(true)}
          >
            Change Password
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>Add an extra layer of security to your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold cursor-pointer">
                {security?.two_factor_enabled ? "2FA Enabled" : "Enable 2FA"}
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                {security?.two_factor_enabled
                  ? "Your account is protected with two-factor authentication"
                  : "Protect your account with two-factor authentication using an authenticator app"}
              </p>
            </div>
            <Switch
              checked={security?.two_factor_enabled ?? false}
              onCheckedChange={(value) => {
                if (value) {
                  setShowTwoFADialog(true)
                } else {
                  handleUpdate("two_factor_enabled", false)
                }
              }}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Login Activity</CardTitle>
          <CardDescription>Recent logins to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowLoginHistoryDialog(true)}
          >
            View Login History
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
          <CardDescription>Current account status information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <span className="text-sm font-medium">Account Status</span>
            <span className={`text-sm font-semibold ${security?.account_locked ? "text-destructive" : "text-green-600"}`}>
              {security?.account_locked ? "Locked" : "Active"}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <span className="text-sm font-medium">Failed Login Attempts</span>
            <span className="text-sm font-semibold">{security?.login_attempt_count || 0}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium">Last Login Attempt</span>
            <span className="text-sm text-muted-foreground">
              {security?.last_login_attempt ? formatDate(security.last_login_attempt) : "Never"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Enter your current password and new password</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {passwordError && (
              <Alert className="border-destructive/50 bg-destructive/10">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-destructive text-sm">{passwordError}</AlertDescription>
              </Alert>
            )}
            <div>
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                placeholder="Enter current password"
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password"
                value={passwords.new}
                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm new password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangePassword} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Login History Dialog */}
      <Dialog open={showLoginHistoryDialog} onOpenChange={setShowLoginHistoryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Login Activity</DialogTitle>
            <DialogDescription>Recent logins to your account</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {loginAttempts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No login activity</p>
            ) : (
              loginAttempts.map((login, index) => (
                <div key={index} className="p-3 border border-border/50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm">{login.device}</p>
                      <p className="text-xs text-muted-foreground mt-1">{login.location}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(login.timestamp)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Two-Factor Authentication Dialog */}
      <Dialog open={showTwoFADialog} onOpenChange={setShowTwoFADialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg flex items-center justify-center h-64">
              <p className="text-sm text-muted-foreground">QR Code would be displayed here</p>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Manual entry key:</p>
              <p className="font-mono text-sm font-semibold break-all">JBSWY3DPEBLW64TMMQ======</p>
            </div>
            <Input placeholder="Enter 6-digit code from your authenticator" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTwoFADialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              handleUpdate("two_factor_enabled", true)
              setShowTwoFADialog(false)
            }} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Enable 2FA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
