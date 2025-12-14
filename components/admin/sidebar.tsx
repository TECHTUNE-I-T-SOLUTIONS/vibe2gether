"use client"

import type React from "react"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/context"
import {
  LayoutDashboard,
  Users,
  FileText,
  Flag,
  BarChart3,
  Star,
  ShoppingBag,
  Settings,
  LogOut,
  MessageSquare,
  CreditCard,
  Shield,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface SidebarItem {
  icon: React.ElementType
  label: string
  href: string
  badge?: number
}

const mainItems: SidebarItem[] = [
  { icon: LayoutDashboard, label: "dashboard", href: "/admin" },
  { icon: Users, label: "users", href: "/admin/users" },
  { icon: FileText, label: "posts", href: "/admin/posts" },
  { icon: Flag, label: "reports", href: "/admin/reports", badge: 8 },
  { icon: Star, label: "featuredRequests", href: "/admin/featured", badge: 5 },
]

const secondaryItems: SidebarItem[] = [
  { icon: ShoppingBag, label: "marketplace", href: "/admin/marketplace" },
  { icon: MessageSquare, label: "messages", href: "/admin/messages" },
  { icon: CreditCard, label: "Transactions", href: "/admin/transactions" },
  { icon: BarChart3, label: "analytics", href: "/admin/analytics" },
]

const bottomItems: SidebarItem[] = [
  { icon: Shield, label: "Moderation", href: "/admin/moderation" },
  { icon: Settings, label: "settings", href: "/admin/settings" },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { t } = useI18n()

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen bg-sidebar border-r border-sidebar-border sticky top-0">
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="relative w-10 h-10 rounded-full overflow-hidden">
            <Image src="/v2g-logo.png" alt="Vibe2Gether" fill className="object-cover" />
          </div>
          <div>
            <span className="text-xl font-bold gradient-text">Vibe2Gether</span>
            <Badge variant="outline" className="ml-2 text-xs">
              Admin
            </Badge>
          </div>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Main</p>
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
                    className={cn("h-5 min-w-5 justify-center", isActive ? "bg-white/20" : "bg-destructive text-white")}
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            )
          })}
        </div>

        <p className="px-3 py-2 mt-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Management
        </p>
        <div className="space-y-1">
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
          className="w-full justify-start gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-5 h-5" />
          <span>{t("signOut")}</span>
        </Button>
      </div>
    </aside>
  )
}
