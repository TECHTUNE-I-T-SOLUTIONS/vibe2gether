"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { LogOut, Shield, Lock, Key, Bell, Moon, Globe } from "lucide-react"
import { useRouter } from "next/navigation"
import { LogoutConfirmationDialog } from "@/components/logout-confirmation-dialog"

interface AdminData {
  id: string;
  email: string;
  fullName: string;
  profilePicture?: string;
  coverImage?: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
}

export default function AdminSettingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("profile")
  const [saving, setSaving] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [adminData, setAdminData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  // Fetch admin data on mount
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const response = await fetch("/api/admin/auth/me");
        if (response.ok) {
          const data = await response.json();
          // Handle both flat and nested response structures
          const adminInfo = data.admin || data;
          setAdminData({
            id: adminInfo.id,
            email: adminInfo.email,
            fullName: adminInfo.full_name,
            profilePicture: adminInfo.profile_picture,
            coverImage: adminInfo.cover_image,
            role: adminInfo.role,
            permissions: adminInfo.permissions || [],
            isActive: adminInfo.is_active,
            twoFactorEnabled: adminInfo.two_factor_enabled,
            createdAt: adminInfo.created_at,
            updatedAt: adminInfo.updated_at,
            lastLoginAt: adminInfo.last_login_at,
          });
        } else {
          setError("Failed to load admin data");
          router.push("/auth/login");
        }
      } catch (err) {
        console.error("Error fetching admin data:", err);
        setError("Error loading admin data");
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [router]);

  async function handleLogout() {
    try {
      const response = await fetch("/api/admin/auth/logout", { method: "POST" })
      if (response.ok) {
        router.push("/auth/login")
      }
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error || !adminData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-destructive">{error || "No admin data found"}</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your admin account and preferences</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-4xl">
        <TabsList className="bg-muted/50 p-1 rounded-full mb-8">
          <TabsTrigger value="profile" className="rounded-full">
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-full">
            Security
          </TabsTrigger>
          <TabsTrigger value="preferences" className="rounded-full">
            Preferences
          </TabsTrigger>
          <TabsTrigger value="activity" className="rounded-full">
            Activity
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Admin Profile</CardTitle>
              <CardDescription>Manage your admin account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {adminData?.profilePicture && (
                <div>
                  <Label>Profile Picture</Label>
                  <div className="mt-2 w-32 h-32 rounded-lg overflow-hidden border border-border/30">
                    <img src={adminData.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

              {adminData?.coverImage && (
                <div>
                  <Label>Cover Image</Label>
                  <div className="mt-2 w-full h-40 rounded-lg overflow-hidden border border-border/30">
                    <img src={adminData.coverImage} alt="Cover" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

              <div>
                <Label>Admin Name</Label>
                <Input placeholder="Your name" defaultValue={adminData?.fullName || ""} className="mt-2" disabled />
              </div>

              <div>
                <Label>Email Address</Label>
                <Input type="email" placeholder="admin@example.com" defaultValue={adminData?.email || ""} className="mt-2" disabled />
              </div>

              <div>
                <Label>Role</Label>
                <div className="mt-2 p-3 bg-muted/50 rounded-lg flex items-center justify-between">
                  <span className="font-medium capitalize">{adminData?.role || "Administrator"}</span>
                  <Badge>{adminData?.permissions?.length > 0 ? "Multiple Permissions" : "View Only"}</Badge>
                </div>
              </div>

              <div>
                <Label>Status</Label>
                <div className="mt-2 p-3 bg-muted/50 rounded-lg flex items-center justify-between">
                  <span className="font-medium">{adminData?.isActive ? "Active" : "Inactive"}</span>
                  <Badge variant={adminData?.isActive ? "default" : "destructive"}>
                    {adminData?.isActive ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>

              <div>
                <Label>Permission Level</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm">User Management</span>
                    <Badge className="bg-green-500">Granted</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm">Transaction Management</span>
                    <Badge className="bg-green-500">Granted</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm">Content Moderation</span>
                    <Badge className="bg-green-500">Granted</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm">Admin Management</span>
                    <Badge className="bg-green-500">Granted</Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="text-sm text-muted-foreground space-y-1">
                <p>Created: {new Date(adminData?.createdAt || "").toLocaleDateString()}</p>
                <p>Last Updated: {new Date(adminData?.updatedAt || "").toLocaleDateString()}</p>
                <p>Last Login: {new Date(adminData?.lastLoginAt || "").toLocaleDateString()}</p>
              </div>

              <Button className="w-full gradient-bg" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <div className="space-y-6">
            {/* Change Password */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Change Password
                </CardTitle>
                <CardDescription>Update your admin password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Current Password</Label>
                  <Input type="password" placeholder="••••••••" className="mt-2" />
                </div>

                <div>
                  <Label>New Password</Label>
                  <Input type="password" placeholder="••••••••" className="mt-2" />
                </div>

                <div>
                  <Label>Confirm Password</Label>
                  <Input type="password" placeholder="••••••••" className="mt-2" />
                </div>

                <Button className="w-full gradient-bg">Update Password</Button>
              </CardContent>
            </Card>

            {/* Two-Factor Authentication */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Two-Factor Authentication
                </CardTitle>
                <CardDescription>Add an extra layer of security to your account</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">Status</p>
                    <p className="text-sm text-muted-foreground">Not enabled</p>
                  </div>
                  <Button>Enable 2FA</Button>
                </div>
              </CardContent>
            </Card>

            {/* API Keys */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  API Keys
                </CardTitle>
                <CardDescription>Manage API access tokens</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Generate New API Key
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Customize your admin dashboard experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {/* Notifications */}
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive system alerts and reports</p>
                    </div>
                  </div>
                  <Button
                    variant={notificationsEnabled ? "default" : "outline"}
                    onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  >
                    {notificationsEnabled ? "On" : "Off"}
                  </Button>
                </div>

                {/* Dark Mode */}
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Moon className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Dark Mode</p>
                      <p className="text-sm text-muted-foreground">Use dark theme for dashboard</p>
                    </div>
                  </div>
                  <Button
                    variant={darkMode ? "default" : "outline"}
                    onClick={() => setDarkMode(!darkMode)}
                  >
                    {darkMode ? "On" : "Off"}
                  </Button>
                </div>

                {/* Language */}
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Language</p>
                      <p className="text-sm text-muted-foreground">Choose your preferred language</p>
                    </div>
                  </div>
                  <select className="px-3 py-2 bg-background border border-border rounded-lg text-sm">
                    <option>English</option>
                    <option>Français</option>
                    <option>Español</option>
                  </select>
                </div>
              </div>

              <Separator />

              <Button className="w-full gradient-bg">Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Login Activity</CardTitle>
              <CardDescription>View your recent admin account activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { device: "Chrome on Windows", time: "2 hours ago", status: "Current" },
                  { device: "Safari on Mac", time: "1 day ago", status: "Last" },
                  { device: "Chrome on Windows", time: "3 days ago", status: "Previous" },
                ].map((activity, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{activity.device}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                    <Badge variant={activity.status === "Current" ? "default" : "secondary"}>
                      {activity.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Danger Zone */}
      <div className="max-w-4xl mt-8">
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Logout from all devices</p>
                <p className="text-sm text-muted-foreground">End all active admin sessions</p>
              </div>
              <Button variant="outline" className="text-destructive hover:text-destructive">
                Logout All
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Logout</p>
                <p className="text-sm text-muted-foreground">End your current admin session</p>
              </div>
              <Button variant="destructive" onClick={() => setShowLogoutDialog(true)} className="gap-2">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <LogoutConfirmationDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog} />
    </div>
  )
}
