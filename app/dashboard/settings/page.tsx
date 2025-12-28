"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  User,
  Bell,
  Lock,
  Globe,
  CreditCard,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  Smartphone,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useI18n } from "@/lib/i18n/context"
import { locales } from "@/lib/i18n/translations"
import { useTheme } from "next-themes"
import { LogoutConfirmationDialog } from "@/components/logout-confirmation-dialog"

const settingsSections = [
  { icon: User, label: "Account", description: "Manage your account details", href: "/dashboard/settings/account" },
  { icon: Bell, label: "Notifications", description: "Configure notification preferences", href: "/dashboard/settings/notifications" },
  { icon: Lock, label: "Privacy", description: "Control your privacy settings", href: "/dashboard/settings/privacy" },
  { icon: Shield, label: "Security", description: "Protect your account", href: "/dashboard/settings/security" },
  { icon: CreditCard, label: "Billing", description: "Manage your subscription", href: "/dashboard/settings/billing" },
  { icon: HelpCircle, label: "Help & Support", description: "Get help and contact support", href: "/help" },
]

export default function SettingsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { t, locale, setLocale } = useI18n()
  const { theme, setTheme } = useTheme()
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [notifications, setNotifications] = useState({
    messages: true,
    matches: true,
    likes: true,
    comments: false,
    marketing: false,
  })

  // Check authentication
  useEffect(() => {
    if (session === undefined) return
    if (!session?.user?.id) {
      router.push("/login")
    }
  }, [session, router])

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">{t("settings")}</h1>
        <p className="text-muted-foreground">Manage your account preferences</p>
      </div>

      <div className="space-y-6">
        {/* Language & Theme */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Language & Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Language</Label>
                <p className="text-sm text-muted-foreground">Select your preferred language</p>
              </div>
              <Select value={locale} onValueChange={(v) => setLocale(v as any)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {locales.map((l) => (
                    <SelectItem key={l.code} value={l.code}>
                      <span className="flex items-center gap-2">
                        <span>{l.flag}</span>
                        <span>{l.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Theme</Label>
                <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("light")}
                  className="rounded-full"
                >
                  <Sun className="w-4 h-4 mr-1" />
                  Light
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("dark")}
                  className="rounded-full"
                >
                  <Moon className="w-4 h-4 mr-1" />
                  Dark
                </Button>
                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("system")}
                  className="rounded-full"
                >
                  <Smartphone className="w-4 h-4 mr-1" />
                  System
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              {t("notifications")}
            </CardTitle>
            <CardDescription>Choose what notifications you receive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between py-2">
                <div>
                  <Label className="text-base capitalize">{key.replace(/([A-Z])/g, " $1")}</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications for {key.toLowerCase()}</p>
                </div>
                <Switch
                  checked={value}
                  onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, [key]: checked }))}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>More Settings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {settingsSections.map((section, i) => {
              const Icon = section.icon
              return (
                <Link
                  key={i}
                  href={section.href}
                  className="flex items-center w-full p-4 hover:bg-muted/50 transition-colors border-b border-border last:border-0"
                >
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mr-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{section.label}</p>
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </Link>
              )
            })}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 bg-transparent"
              onClick={() => setShowLogoutDialog(true)}
            >
              <LogOut className="w-5 h-5 mr-3" />
              {t("signOut")}
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 bg-transparent"
            >
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </div>

      <LogoutConfirmationDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog} />
    </div>
  )
}
