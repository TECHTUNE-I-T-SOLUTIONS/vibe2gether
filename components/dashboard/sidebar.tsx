"use client"

import type React from "react"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/context"
import {
  LayoutDashboard,
  Users,
  Wallet,
  MessageCircle,
  Bell,
  Settings,
  Heart,
  ShoppingBag,
  Calendar,
  Bookmark,
  HelpCircle,
  LogOut,
  Sparkles,
  Rss,
  Copy,
  Star,
  Eye,
  Briefcase,
  BadgeCheck,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useState, useEffect } from "react"
import { LogoutConfirmationDialog } from "@/components/logout-confirmation-dialog"
import { useUserProfile } from "@/hooks/use-user-profile"

interface SidebarItem {
  icon: React.ElementType
  label: string
  href: string
  badge?: number
}

const mainItems: SidebarItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Rss, label: "Insights", href: "/dashboard/feed" },
  { icon: Users, label: "Network", href: "/dashboard/matches" },
  { icon: MessageCircle, label: "Inbox", href: "/dashboard/messages" },
  { icon: Bell, label: "Notifications", href: "/dashboard/notifications" },
]

const secondaryItems: SidebarItem[] = [
  { icon: Eye, label: "Opportunities", href: "/dashboard/opportunities" },
  { icon: ShoppingBag, label: "Marketplace", href: "/dashboard/marketplace/manage" },
  { icon: Calendar, label: "Events & Webinars", href: "/dashboard/events/manage" },
  { icon: BadgeCheck, label: "Subscriptions", href: "/dashboard/subscriptions" },
  { icon: Briefcase, label: "Learn & Grow", href: "/dashboard/learn" },
  { icon: Star, label: "Testimonies", href: "/dashboard/testimonies" },
  { icon: Bookmark, label: "Saved", href: "/dashboard/saved" },
  // { icon: Wallet, label: "Wallet", href: "/dashboard/wallet" },
]

const bottomItems: SidebarItem[] = [
  { icon: Settings, label: "settings", href: "/dashboard/settings" },
  { icon: HelpCircle, label: "help", href: "/contact" },
]

function SidebarContent() {
  const pathname = usePathname()
  const { t } = useI18n()
  const { data: session } = useSession()
  const { user } = useUserProfile()
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [messageBadge, setMessageBadge] = useState(0)
  const [notificationBadge, setNotificationBadge] = useState(0)
  const [stats, setStats] = useState({
    connections: 0,
    views: 0,
    opportunities: 0,
  })

  useEffect(() => {
    async function fetchBadgeCounts() {
      try {
        const statsRes = await fetch("/api/dashboard/stats", { method: "POST" })
        if (statsRes.ok) {
          const statsData = await statsRes.json()
          const findStat = (label: string) => statsData.stats.find((s: any) => s.label === label)?.value || "0"
          setStats({
            connections: parseInt(findStat("followers")),
            views: parseInt(findStat("totalViews")),
            opportunities: parseInt(findStat("yourMatches")),
          })
        }

        const notifRes = await fetch("/api/notifications")
        if (notifRes.ok) {
          const notifData = await notifRes.json()
          setNotificationBadge(notifData.unreadCount || 0)
        }

        const messagesRes = await fetch("/api/messages")
        if (messagesRes.ok) {
          const messagesData = await messagesRes.json()
          const unreadCount = (messagesData.conversations || []).reduce(
            (total: number, conv: any) => total + (conv.unreadCount || 0),
            0
          )
          setMessageBadge(unreadCount)
        }
      } catch (err) {
        console.error("Failed to fetch badge counts:", err)
      }
    }
    fetchBadgeCounts()
  }, [])

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
  }

  const userName = user?.display_name || session?.user?.name || "User"
  const userEmail = user?.email || session?.user?.email || ""
  const userImage = user?.profile_picture || session?.user?.image || ""
  const initials = getInitials(user?.full_name || session?.user?.name || "User")

  // Calculate profile completion percentage
  const profileFields = [
    user?.date_of_birth,
    user?.gender,
    user?.bio,
    user?.profile_picture,
    user?.cover_picture,
    user?.country,
    user?.city,
    user?.interests,
  ]
  const completedFields = profileFields.filter((field) => field !== null && field !== undefined && field !== "").length
  const profileCompletion = Math.round((completedFields / profileFields.length) * 100)

  return (
    <>
      {/* User Profile Mini */}
      <div className="p-4 border-b border-sidebar-border space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12 ring-2 ring-primary/20">
            <AvatarImage src={userImage} alt={userName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <p className="font-semibold truncate">{userName}</p>
              {user?.is_premium && <Sparkles className="w-3.5 h-3.5 text-primary fill-primary" />}
            </div>
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 py-2 border-y border-sidebar-border/50">
          <div className="text-center">
            <p className="text-sm font-bold">{stats.connections}</p>
            <p className="text-[8px] text-muted-foreground uppercase tracking-wider">{t("connections")}</p>
          </div>
          <div className="text-center border-x border-sidebar-border/50">
            <p className="text-sm font-bold">{stats.views}</p>
            <p className="text-[8px] text-muted-foreground uppercase tracking-wider">{t("views")}</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold">{stats.opportunities}</p>
            <p className="text-[8px] text-muted-foreground uppercase tracking-wider">{t("opportunities")}</p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Profile: {profileCompletion}%</span>
          </div>
          <Progress value={profileCompletion} className="h-1.5" />
        </div>
        {user?.referral_code && (
          <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
            <p className="text-xs text-muted-foreground mb-1">Referral Code</p>
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono font-bold text-primary flex-1">{user.referral_code}</code>
              <button
                onClick={() => {
                  if (user.referral_code) {
                    navigator.clipboard.writeText(user.referral_code)
                  }
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Copy referral code"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="space-y-1">
          {mainItems.map((item) => {
            const Icon = item.icon
            // For dashboard home, only match exact path
            // For other routes, match exact or sub-routes
            const isActive = item.href === "/dashboard" 
              ? pathname === "/dashboard"
              : pathname === item.href || pathname.startsWith(item.href + "/")
            // Add dynamic badges
            const badge = 
              item.href === "/dashboard/messages" ? messageBadge :
              item.href === "/dashboard/notifications" ? notificationBadge :
              item.badge
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "gradient-bg text-primary-foreground"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="flex-1">{t(item.label)}</span>
                {badge && badge > 0 && (
                  <Badge
                    className={cn("h-5 min-w-5 justify-center", isActive ? "bg-white/20" : "gradient-bg text-white")}
                  >
                    {badge}
                  </Badge>
                )}
              </Link>
            )
          })}
        </div>

        <div className="pt-4 mt-4 border-t border-sidebar-border space-y-1">
          {secondaryItems.map((item) => {
            const Icon = item.icon
            // For secondary items, check for exact or sub-route match
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "gradient-bg text-primary-foreground"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{t(item.label)}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        {bottomItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200"
            >
              <Icon className="w-5 h-5" />
              <span>{t(item.label)}</span>
            </Link>
          )
        })}
        <Button
          variant="ghost"
          onClick={() => setShowLogoutDialog(true)}
          className="w-full justify-start gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-5 h-5" />
          <span>{t("signOut")}</span>
        </Button>
        <LogoutConfirmationDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog} />
      </div>
    </>
  )
}

export function DashboardSidebar() {
  return (
    <>
      {/* Desktop Sidebar - only visible on lg+ screens */}
      <aside className="hidden lg:fixed lg:flex flex-col w-64 h-screen bg-sidebar border-r border-sidebar-border left-0 top-0 z-30">
        <div className="p-4 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative w-10 h-10 rounded-full overflow-hidden">
              <Image src="/v2g-logo.png" alt="Vibe2Gether" loading="eager" fill className="object-cover" />
            </div>
            <span className="text-xl font-bold gradient-text">Vibe2Gether</span>
          </Link>
        </div>
        <SidebarContent />
      </aside>
    </>
  )
}
