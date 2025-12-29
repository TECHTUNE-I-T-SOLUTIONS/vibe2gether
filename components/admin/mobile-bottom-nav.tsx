"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  FileText,
  Flag,
  ShoppingBag,
  BarChart3,
  Bell,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/context"

interface NavItem {
  icon: React.ElementType
  label: string
  href: string
  badge?: number
}

interface AdminMobileBottomNavProps {
  reportsBadge?: number
  notificationsBadge?: number
}

export function AdminMobileBottomNav({
  reportsBadge = 0,
  notificationsBadge = 0,
}: AdminMobileBottomNavProps) {
  const pathname = usePathname()
  const { t } = useI18n()

  const navItems: NavItem[] = [
    {
      icon: LayoutDashboard,
      label: "dashboard",
      href: "/admin",
    },
    {
      icon: Users,
      label: "users",
      href: "/admin/users",
    },
    {
      icon: FileText,
      label: "posts",
      href: "/admin/posts",
    },
    {
      icon: Flag,
      label: "reports",
      href: "/admin/reports",
      badge: reportsBadge,
    },
    {
      icon: ShoppingBag,
      label: "marketplace",
      href: "/admin/marketplace",
    },
    {
      icon: Bell,
      label: "notifications",
      href: "/admin/notifications",
      badge: notificationsBadge,
    },
    {
      icon: BarChart3,
      label: "analytics",
      href: "/admin/analytics",
    },
    {
      icon: Settings,
      label: "settings",
      href: "/admin/settings",
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 lg:hidden h-20 bg-background/95 backdrop-blur-md border-t border-border/50 z-40 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-full px-1 overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          // Fixed: Only exact path or exact start match for /admin to avoid false positives
          const isActive = pathname === item.href || (pathname.startsWith(item.href + "/") && item.href !== "/admin")
          const badge = item.badge || 0

          return (
            <Link key={item.href} href={item.href} className="flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "relative rounded-2xl h-16 w-16 flex flex-col items-center justify-center transition-all duration-200",
                  isActive
                    ? "gradient-bg text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="flex flex-col items-center justify-center gap-0.5">
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium leading-none truncate max-w-[50px]">
                    {t(item.label)}
                  </span>
                </div>
                {badge > 0 && (
                  <Badge className="absolute top-1 right-0 w-5 h-5 p-0 flex items-center justify-center gradient-bg text-xs text-white">
                    {badge > 9 ? "9+" : badge}
                  </Badge>
                )}
              </Button>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
