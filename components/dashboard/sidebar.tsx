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
  User,
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
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useState } from "react"
import { LogoutConfirmationDialog } from "@/components/logout-confirmation-dialog"

interface SidebarItem {
  icon: React.ElementType
  label: string
  href: string
  badge?: number
}

const mainItems: SidebarItem[] = [
  { icon: LayoutDashboard, label: "dashboard", href: "/dashboard" },
  { icon: Rss, label: "feed", href: "/dashboard/feed" },
  { icon: User, label: "profile", href: "/dashboard/profile" },
  { icon: Heart, label: "yourMatches", href: "/dashboard/matches" },
  { icon: MessageCircle, label: "messages", href: "/dashboard/messages", badge: 3 },
  { icon: Bell, label: "notifications", href: "/dashboard/notifications", badge: 12 },
]

const secondaryItems: SidebarItem[] = [
  { icon: Wallet, label: "wallet", href: "/dashboard/wallet" },
  { icon: ShoppingBag, label: "marketplace", href: "/marketplace" },
  { icon: Calendar, label: "events", href: "/events" },
  { icon: Bookmark, label: "saved", href: "/dashboard/saved" },
]

const bottomItems: SidebarItem[] = [
  { icon: Settings, label: "settings", href: "/dashboard/settings" },
  { icon: HelpCircle, label: "help", href: "/contact" },
]

function SidebarContent() {
  const pathname = usePathname()
  const { t } = useI18n()
  const { data: session } = useSession()
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
  }

  const userName = session?.user?.name || "User"
  const userEmail = session?.user?.email || ""
  const userImage = session?.user?.image || ""
  const initials = getInitials(userName)

  return (
    <>
      {/* User Profile Mini */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12 ring-2 ring-primary/20">
            <AvatarImage src={userImage} alt={userName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{userName}</p>
            <p className="text-sm text-muted-foreground truncate">{userEmail}</p>
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Profile: 85%</span>
            <Badge variant="outline" className="text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          </div>
          <Progress value={85} className="h-1.5" />
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="space-y-1">
          {mainItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
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
                {item.badge && (
                  <Badge
                    className={cn("h-5 min-w-5 justify-center", isActive ? "bg-white/20" : "gradient-bg text-white")}
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            )
          })}
        </div>

        <div className="pt-4 mt-4 border-t border-sidebar-border space-y-1">
          {secondaryItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
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
      <aside className="hidden lg:flex flex-col w-64 h-screen bg-sidebar border-r border-sidebar-border sticky top-0">
        <div className="p-4 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative w-10 h-10 rounded-full overflow-hidden">
              <Image src="/v2g-logo.png" alt="Vibe2Gether" fill className="object-cover" />
            </div>
            <span className="text-xl font-bold gradient-text">Vibe2Gether</span>
          </Link>
        </div>
        <SidebarContent />
      </aside>
    </>
  )
}
