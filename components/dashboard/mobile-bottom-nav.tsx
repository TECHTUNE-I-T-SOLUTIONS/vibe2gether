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
        const notificationRes = await fetch("/api/notifications")
        if (notificationRes.ok) {
          const notificationData = await notificationRes.json()
          setUnreadNotifications(notificationData.unreadCount || 0)
        }

        const messagesRes = await fetch("/api/messages")
        if (messagesRes.ok) {
          const messagesData = await messagesRes.json()
          const unreadCount = (messagesData.conversations || []).reduce(
            (total: number, conversation: any) => total + (conversation.unreadCount || 0),
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
      icon: <Rss className="w-4 h-4" />,
      label: "Feed",
      href: "/dashboard/feed",
    },
    {
      icon: <ShoppingBag className="w-4 h-4" />,
      label: "Marketplace",
      href: "/dashboard/marketplace/manage",
    },
    {
      icon: <Calendar className="w-4 h-4" />,
      label: "Events",
      href: "/dashboard/events/manage",
    },
    {
      icon: <MessageCircle className="w-4 h-4" />,
      label: "Messages",
      href: "/dashboard/messages",
    },
    {
      icon: <Bell className="w-4 h-4" />,
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
      <div className="flex items-center justify-around h-14 px-1 gap-1">
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
                size="sm"
                className={cn(
                  "relative rounded-lg w-full h-12 flex items-center justify-center transition-all duration-200",
                  isActive 
                    ? "gradient-bg text-primary-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                title={item.label}
              >
                <span className={cn(
                  "p-1.5 rounded-md transition-all duration-200 flex items-center justify-center",
                  isActive && "bg-white/20"
                )}>
                  {/* Render smaller icons */}
                  {item.icon}
                </span>
                {badgeCount > 0 && (
                  <Badge className="absolute top-1 right-1 w-5 h-5 p-0 flex items-center justify-center gradient-bg text-xs font-bold text-white">
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
