"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Activity,
  Heart,
  Bell,
  MessageCircle,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface NavItem {
  icon: React.ReactNode
  label: string
  href: string
  badge?: number
}

export function DashboardMobileBottomNav({ unreadNotifications = 0 }: { unreadNotifications?: number }) {
  const pathname = usePathname()

  const navItems: NavItem[] = [
    {
      icon: <Home className="w-5 h-5" />,
      label: "Home",
      href: "/dashboard",
    },
    {
      icon: <Activity className="w-5 h-5" />,
      label: "Feed",
      href: "/dashboard/feed",
    },
    {
      icon: <Heart className="w-5 h-5" />,
      label: "Matches",
      href: "/dashboard/matches",
    },
    {
      icon: <Bell className="w-5 h-5" />,
      label: "Notifications",
      href: "/dashboard/notifications",
      badge: unreadNotifications,
    },
    {
      icon: <User className="w-5 h-5" />,
      label: "Profile",
      href: "/dashboard/profile",
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden h-20 bg-background/95 backdrop-blur-md border-t border-border/50 z-40 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-full px-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

          return (
            <Link key={item.href} href={item.href} className="flex-1">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "relative rounded-2xl h-14 w-14 mx-auto flex flex-col items-center justify-center",
                  isActive 
                    ? "gradient-bg text-primary-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className={cn(
                  "p-2 rounded-xl transition-all duration-200",
                  isActive && "bg-white/20"
                )}>
                  {item.icon}
                </span>
                {item.badge && item.badge > 0 && (
                  <Badge className="absolute top-1 right-1 w-5 h-5 p-0 flex items-center justify-center gradient-bg text-xs text-white">
                    {item.badge > 9 ? "9+" : item.badge}
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
