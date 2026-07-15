"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/context"
import {
  LayoutDashboard,
  Users,
  MessageCircle,
  Bell,
  Settings,
  Repeat,
  ShoppingBag,
  Calendar,
  Bookmark,
  HelpCircle,
  LogOut,
  Rss,
  Copy,
  Star,
  Eye,
  Briefcase,
  Sparkles,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { LogoutConfirmationDialog } from "@/components/logout-confirmation-dialog"
import { SheetClose } from "@/components/ui/sheet"
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
  // { icon: Eye, label: "Opportunities", href: "/dashboard/opportunities" },
  // { icon: ShoppingBag, label: "Marketplace", href: "/dashboard/marketplace/manage" },
  { icon: Repeat, label: "Subscriptions", href: "/dashboard/subscriptions" },
  { icon: Calendar, label: "Events & Webinars", href: "/dashboard/events/manage" },
  { icon: Briefcase, label: "Learn & Grow", href: "/dashboard/learn" },
  { icon: Star, label: "Testimonies", href: "/dashboard/testimonies" },
  { icon: Bookmark, label: "Saved", href: "/dashboard/saved" },
]

const bottomItems: SidebarItem[] = [
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  { icon: HelpCircle, label: "Help", href: "/contact" },
]

export function MobileSidebar() {
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
        // Fetch stats but with caching and only after other critical data loads
        setTimeout(async () => {
          try {
            const statsRes = await fetch("/api/dashboard/stats", {
              method: "POST",
              cache: 'force-cache'
            })
            if (statsRes.ok) {
              const statsData = await statsRes.json()
              const findStat = (label: string) => statsData.stats.find((s: any) => s.label === label)?.value || "0"
              setStats({
                connections: parseInt(findStat("followers")),
                views: parseInt(findStat("totalViews")),
                opportunities: parseInt(findStat("yourMatches")),
              })
            }
          } catch (err) {
            console.error("Failed to fetch stats:", err)
          }
        }, 2000) // Delay stats fetch by 2 seconds

        const notifRes = await fetch("/api/notifications", {
          cache: 'force-cache'
        })
        if (notifRes.ok) {
          const notifData = await notifRes.json()
          setNotificationBadge(notifData.unreadCount || 0)
        }

        const messagesRes = await fetch("/api/messages", {
          cache: 'force-cache'
        })
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

  const userName = session?.user?.name || "User"
  const userEmail = session?.user?.email || ""
  const userImage = session?.user?.image || "/placeholder.svg"

  return (
    <div className="flex flex-col h-full w-full bg-sidebar overflow-y-auto">
      {/* Header with Logo and Close Button */}
      <div className="p-4 border-b border-sidebar-border sticky top-0 bg-sidebar z-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 flex-1">
            <div className="relative w-10 h-10 rounded-full overflow-hidden">
              <Image src="/v2g-logo.png" alt="Vibe2Gether" loading="eager" fill className="object-cover" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-bold gradient-text">Vibe2Gether</span>
            </div>
          </Link>
          <SheetClose asChild>
            <Button size="icon" variant="ghost" className="rounded-full">
              <span className="text-xl">&times;</span>
            </Button>
          </SheetClose>
        </div>
      </div>

      {/* User Profile Section */}
      <div className="p-4 border-b border-sidebar-border space-y-3">
        <div className="flex gap-3 items-start">
          <Avatar className="w-12 h-12 ring-2 ring-primary/20 flex-shrink-0">
            <AvatarImage src={(session?.user?.image || user?.profile_picture) as string} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground">
              {getInitials(session?.user?.name || "User")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <p className="font-semibold text-sm text-sidebar-foreground truncate">{session?.user?.name || "User"}</p>
              {user?.is_premium && <Sparkles className="w-3.5 h-3.5 text-primary fill-primary" />}
            </div>
            <p className="text-xs text-sidebar-foreground/60 truncate">{session?.user?.email || ""}</p>
            {user?.is_premium && (
              <Badge variant="outline" className="mt-1 text-[8px] h-4">Pro Member</Badge>
            )}
          </div>
        </div>

        {/* Stats Row - Optimized with delayed loading */}
        <div className="grid grid-cols-3 gap-2 py-2 border-y border-sidebar-border/50">
          <div className="text-center">
            <p className="text-sm font-bold text-sidebar-foreground">{stats.connections}</p>
            <p className="text-[8px] text-sidebar-foreground/60 uppercase tracking-wider">{t("connections")}</p>
          </div>
          <div className="text-center border-x border-sidebar-border/50">
            <p className="text-sm font-bold text-sidebar-foreground">{stats.views}</p>
            <p className="text-[8px] text-sidebar-foreground/60 uppercase tracking-wider">{t("views")}</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-sidebar-foreground">{stats.opportunities}</p>
            <p className="text-[8px] text-sidebar-foreground/60 uppercase tracking-wider">{t("opportunities")}</p>
          </div>
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

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Main Items */}
        <div className="space-y-1">
          {mainItems.map((item) => {
            const Icon = item.icon
            // For dashboard, only match exact path or direct children
            const isActive = item.href === "/dashboard" 
              ? pathname === "/dashboard"
              : pathname === item.href || pathname.startsWith(item.href + "/")
            // Add dynamic badges
            const badge = 
              item.href === "/dashboard/messages" ? messageBadge :
              item.href === "/dashboard/notifications" ? notificationBadge :
              item.badge

            return (
              <SheetClose asChild key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative",
                    isActive
                      ? "text-sidebar-foreground bg-sidebar-accent"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1">{t(item.label)}</span>
                  {badge && badge > 0 && (
                    <Badge className="gradient-bg text-xs px-1.5 ml-auto">
                      {badge}
                    </Badge>
                  )}
                </Link>
              </SheetClose>
            )
          })}
        </div>

        {/* Secondary Items */}
        <div className="space-y-1 border-t border-sidebar-border pt-3">
          {secondaryItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

            return (
              <SheetClose asChild key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "text-sidebar-foreground bg-sidebar-accent"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1">{t(item.label)}</span>
                </Link>
              </SheetClose>
            )
          })}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="p-3 border-t border-sidebar-border space-y-1 sticky bottom-0 bg-sidebar">
        {bottomItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

          return (
            <SheetClose asChild key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "text-sidebar-foreground bg-sidebar-accent"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{t(item.label)}</span>
              </Link>
            </SheetClose>
          )
        })}

        {/* Logout Button */}
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => setShowLogoutDialog(true)}
        >
          <LogOut className="w-5 h-5 mr-3" />
          {t("signOut")}
        </Button>

        <LogoutConfirmationDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog} />
      </div>
    </div>
  )
}
