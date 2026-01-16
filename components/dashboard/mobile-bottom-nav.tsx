"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  ShoppingBag,
  MessageCircle,
  Bell,
  Rss,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface NavItem {
  icon: React.ReactNode
  label: string
  href: string
}

export function DashboardMobileBottomNav() {
  const pathname = usePathname()
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)

  // Fetch notification and message counts
  useEffect(() => {
    async function fetchCounts() {
      try {
        const notifRes = await fetch("/api/notifications")
        if (notifRes.ok) {
          const notifData = await notifRes.json()
          setUnreadNotifications(notifData.unreadCount || 0)
        }

        const messagesRes = await fetch("/api/messages")
        if (messagesRes.ok) {
          const messagesData = await messagesRes.json()
          const unreadCount = (messagesData.conversations || []).reduce(
            (total: number, conv: any) => total + (conv.unreadCount || 0),
            0
          )
          setUnreadMessages(unreadCount)
        }
      } catch (err) {
        console.error("Failed to fetch counts:", err)
      }
    }
    fetchCounts()
  }, [])

  const navItems: NavItem[] = [
    {
      icon: <Rss className="w-5 h-5" />,
      label: "Feed",
      href: "/dashboard/feed",
    },
    {
      icon: <ShoppingBag className="w-5 h-5" />,
      label: "Marketplace",
      href: "/dashboard/marketplace/manage",
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      label: "Events",
      href: "/dashboard/events/manage",
    },
    {
      icon: <MessageCircle className="w-5 h-5" />,
      label: "Messages",
      href: "/dashboard/messages",
    },
    {
      icon: <Bell className="w-5 h-5" />,
      label: "Notifications",
      href: "/dashboard/notifications",
    },
  ]

  // Helper function to determine if route is active
  const isActiveRoute = (href: string): boolean => {
    // For home, only match exact path
    if (href === "/dashboard") {
      return pathname === "/dashboard"
    }
    // For other routes, match exact or sub-routes
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-background/95 backdrop-blur-md border-t border-border/50 z-40 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-20 px-0.5 gap-1">
        {navItems.map((item) => {
          const isActive = isActiveRoute(item.href)
          
          // Get badge count based on href
          let badgeCount = 0
          if (item.href === "/dashboard/messages") {
            badgeCount = unreadMessages
          } else if (item.href === "/dashboard/notifications") {
            badgeCount = unreadNotifications
          }

          return (
            <Link key={item.href} href={item.href} className="flex-1">
              <Button
                variant="ghost"
                className={cn(
                  "relative rounded-lg w-full h-16 flex flex-col items-center justify-center gap-1 transition-all duration-200",
                  isActive 
                    ? "gradient-bg text-primary-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className={cn(
                  "p-1.5 rounded-lg transition-all duration-200",
                  isActive && "bg-white/20"
                )}>
                  {item.icon}
                </span>
                <span className={cn(
                  "text-xs font-medium transition-all duration-200",
                  isActive ? "text-primary-foreground font-semibold" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
                {badgeCount > 0 && (
                  <Badge className="absolute top-2 right-2 w-4 h-4 p-0 flex items-center justify-center gradient-bg text-xs text-white">
                    {badgeCount > 9 ? "9+" : badgeCount}
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
