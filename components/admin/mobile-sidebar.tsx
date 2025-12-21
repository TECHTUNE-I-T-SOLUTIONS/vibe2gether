"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/context"
import {
  LayoutDashboard,
  Users,
  FileText,
  Flag,
  Star,
  ShoppingBag,
  Calendar,
  BookOpen,
  MessageSquare,
  CreditCard,
  BarChart3,
  Shield,
  Settings,
  Bell,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface NavItem {
  icon: React.ElementType
  label: string
  href: string
  badge?: number
}

export function AdminMobileSidebar() {
  const pathname = usePathname()
  const { t } = useI18n()
  const [counts, setCounts] = useState<Record<string, number>>({
    reports: 0,
    featured: 0,
    notifications: 0,
  })

  useEffect(() => {
    fetchCounts()
  }, [])

  const fetchCounts = async () => {
    try {
      const [reportsRes, featuredRes, notificationsRes] = await Promise.all([
        fetch("/api/admin/reports?limit=1"),
        fetch("/api/admin/featured-requests?limit=1"),
        fetch("/api/admin/notifications?limit=1"),
      ])

      const newCounts: Record<string, number> = {
        reports: 0,
        featured: 0,
        notifications: 0,
      }

      if (reportsRes.ok) {
        const data = await reportsRes.json()
        newCounts.reports = data.count || 0
      }

      if (featuredRes.ok) {
        const data = await featuredRes.json()
        newCounts.featured = data.count || 0
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
    { icon: Star, label: "featured", href: "/admin/featured", badge: counts.featured },
  ]

  const secondaryItems: NavItem[] = [
    { icon: ShoppingBag, label: "marketplace", href: "/admin/marketplace" },
    { icon: Calendar, label: "events", href: "/admin/events" },
    { icon: BookOpen, label: "blog", href: "/admin/blog" },
    { icon: MessageSquare, label: "messages", href: "/admin/messages" },
    { icon: CreditCard, label: "transactions", href: "/admin/transactions" },
    { icon: BarChart3, label: "analytics", href: "/admin/analytics" },
    { icon: Bell, label: "notifications", href: "/admin/notifications", badge: counts.notifications },
  ]

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon
    const isActive = pathname === item.href
    const badge = item.badge || 0

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex flex-col items-center justify-center gap-1 py-2 px-2 text-xs font-medium transition-colors whitespace-nowrap min-w-max relative",
          isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <div className="relative">
          <Icon className="w-5 h-5" />
          {badge > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 min-w-5 flex items-center justify-center bg-destructive text-white text-xs p-0">
              {badge > 99 ? "99+" : badge}
            </Badge>
          )}
        </div>
        <span>{t(item.label)}</span>
      </Link>
    )
  }

  return (
    <nav className="bg-card border-t border-border p-0 overflow-x-auto">
      <div className="flex gap-0 min-w-full">
        {/* Main items */}
        {mainItems.map(renderNavItem)}

        {/* Divider */}
        <div className="w-px bg-border mx-2" />

        {/* Secondary items */}
        {secondaryItems.map(renderNavItem)}

        {/* Bottom items */}
        {[
          { icon: Shield, label: "moderation", href: "/admin/moderation" },
          { icon: Settings, label: "settings", href: "/admin/settings" },
        ].map(renderNavItem)}
      </div>
    </nav>
  )
}
