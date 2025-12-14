"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
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
  Rss,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { LogoutConfirmationDialog } from "@/components/logout-confirmation-dialog"
import { SheetClose } from "@/components/ui/sheet"

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

export function MobileSidebar() {
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
  const userImage = session?.user?.image || "/placeholder.svg"

  return (
    <div className="flex flex-col h-full w-full bg-sidebar overflow-y-auto">
      {/* Header with Logo and Close Button */}
      <div className="p-4 border-b border-sidebar-border sticky top-0 bg-sidebar z-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 flex-1">
            <div className="relative w-10 h-10 rounded-full overflow-hidden">
              <Image src="/v2g-logo.png" alt="Vibe2Gether" fill className="object-cover" />
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
      <div className="p-4 border-b border-sidebar-border">
        <Link href="/dashboard/profile" className="flex gap-3 items-start mb-3">
          <Avatar className="w-12 h-12 ring-2 ring-primary/20 flex-shrink-0">
            <AvatarImage src={userImage} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-sidebar-foreground truncate">{userName}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{userEmail}</p>
          </div>
        </Link>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Main Items */}
        <div className="space-y-1">
          {mainItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

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
                  {item.badge && (
                    <Badge className="gradient-bg text-xs px-1.5 ml-auto">
                      {item.badge}
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
