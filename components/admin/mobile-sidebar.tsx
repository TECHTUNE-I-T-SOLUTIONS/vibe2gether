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
  FileText,
  Flag,
  ShoppingBag,
  Calendar,
  Briefcase,
  GraduationCap,
  BookOpen,
  MessageSquare,
  CreditCard,
  BarChart3,
  Shield,
  Settings,
  Bell,
  LogOut,
  Star,
  Mail,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { SheetClose } from "@/components/ui/sheet"
import { LogoutConfirmationDialog } from "@/components/logout-confirmation-dialog"

interface NavItem {
  icon: React.ElementType
  label: string
  href: string
  badge?: number
}

interface AdminMobileSidebarProps {
  onLogoutClick?: () => void
}

export function AdminMobileSidebar({ onLogoutClick }: AdminMobileSidebarProps) {
  const pathname = usePathname()
  const { t } = useI18n()
  const [counts, setCounts] = useState<Record<string, number>>({
    reports: 0,
    notifications: 0,
  })
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  useEffect(() => {
    fetchCounts()
  }, [])

  const fetchCounts = async () => {
    try {
      const [reportsRes, notificationsRes] = await Promise.all([
        fetch("/api/admin/reports?limit=1"),
        fetch("/api/admin/notifications?limit=1"),
      ])

      const newCounts: Record<string, number> = {
        reports: 0,
        notifications: 0,
      }

      if (reportsRes.ok) {
        const data = await reportsRes.json()
        newCounts.reports = data.count || 0
      }

      if (notificationsRes.ok) {
        const data = await notificationsRes.json()
        newCounts.notifications = data.unreadCount || 0
      }

      setCounts(newCounts)
    } catch (error) {
      console.error("Failed to fetch counts:", error)
    }
  }

  const mainItems: NavItem[] = [
    { icon: LayoutDashboard, label: "dashboard", href: "/admin" },
    { icon: Users, label: "users", href: "/admin/users" },
    { icon: FileText, label: "posts", href: "/admin/posts" },
    { icon: Flag, label: "reports", href: "/admin/reports", badge: counts.reports },
    { icon: Bell, label: "announcements", href: "/admin/announcements" },
    { icon: Star, label: "testimonies", href: "/admin/testimonies" },
  ]

  const secondaryItems: NavItem[] = [
    { icon: ShoppingBag, label: "marketplace", href: "/admin/marketplace" },
    { icon: Calendar, label: "events", href: "/admin/events" },
    { icon: Briefcase, label: "opportunities", href: "/admin/opportunities" },
    { icon: GraduationCap, label: "learn", href: "/admin/learn" },
    { icon: BookOpen, label: "blog", href: "/admin/blog" },
    { icon: Mail, label: "contacts", href: "/admin/contacts" },
    { icon: MessageSquare, label: "messages", href: "/admin/messages" },
    { icon: CreditCard, label: "transactions", href: "/admin/transactions" },
    { icon: CreditCard, label: "withdrawals", href: "/admin/withdrawals" },
    { icon: BarChart3, label: "analytics", href: "/admin/analytics" },
    { icon: Bell, label: "notifications", href: "/admin/notifications", badge: counts.notifications },
  ]

  const bottomItems: NavItem[] = [
    { icon: Shield, label: "moderation", href: "/admin/moderation" },
    { icon: Settings, label: "settings", href: "/admin/settings" },
  ]

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon
    // Fixed: Only exact path or exact start match for /admin to avoid false positives
    const isActive = pathname === item.href || (pathname.startsWith(item.href + "/") && item.href !== "/admin")
    const badge = item.badge || 0

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
          {badge > 0 && (
            <Badge className="gradient-bg text-xs px-1.5 ml-auto">
              {badge > 99 ? "99+" : badge}
            </Badge>
          )}
        </Link>
      </SheetClose>
    )
  }

  const handleLogout = () => {
    setShowLogoutDialog(true)
    if (onLogoutClick) {
      onLogoutClick()
    }
  }

  return (
    <div className="flex flex-col h-full w-full bg-sidebar">
      {/* Header with Logo and Close Button */}
      <div className="p-4 border-b border-sidebar-border sticky top-0 bg-sidebar z-10">
        <div className="flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2 flex-1">
            <div className="relative w-10 h-10 rounded-full overflow-hidden">
              <Image src="/v2g-logo.png" alt="Vibe2Gether Admin" fill className="object-cover" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-bold gradient-text">Admin Panel</span>
            </div>
          </Link>
          <SheetClose asChild>
            <Button size="icon" variant="ghost" className="rounded-full">
              <span className="text-xl">&times;</span>
            </Button>
          </SheetClose>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Main Items */}
        <div className="space-y-1">
          {mainItems.map(renderNavItem)}
        </div>

        {/* Secondary Items */}
        <div className="space-y-1 border-t border-sidebar-border pt-3">
          {secondaryItems.map(renderNavItem)}
        </div>
      </nav>

      {/* Bottom Section - Sticky to bottom */}
      <div className="p-3 border-t border-sidebar-border space-y-1 sticky bottom-0 bg-sidebar">
        {bottomItems.map(renderNavItem)}

        {/* Logout Button */}
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-3" />
          {t("signOut")}
        </Button>

        <LogoutConfirmationDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog} isAdminLogout={true} />
      </div>
    </div>
  )
}
