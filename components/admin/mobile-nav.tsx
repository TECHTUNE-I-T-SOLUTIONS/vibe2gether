"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Calendar,
  BookOpen,
  CreditCard,
  BarChart3,
  MessageSquare,
  Shield,
  Settings,
  FileText,
  Flag,
} from "lucide-react"

const allItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Users, label: "Users", href: "/admin/users" },
  { icon: FileText, label: "Posts", href: "/admin/posts" },
  { icon: Flag, label: "Reports", href: "/admin/reports" },
  { icon: ShoppingBag, label: "Market", href: "/admin/marketplace" },
  { icon: Calendar, label: "Events", href: "/admin/events" },
  { icon: BookOpen, label: "Blog", href: "/admin/blog" },
  { icon: MessageSquare, label: "Messages", href: "/admin/messages" },
  { icon: CreditCard, label: "Trans", href: "/admin/transactions" },
  { icon: BarChart3, label: "Stats", href: "/admin/analytics" },
  { icon: Shield, label: "Moderate", href: "/admin/moderation" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
]

export function AdminMobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-0 md:hidden z-40 overflow-x-auto">
      <div className="flex gap-0 min-w-full">
        {allItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 px-3 text-xs font-medium transition-colors whitespace-nowrap min-w-max",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
