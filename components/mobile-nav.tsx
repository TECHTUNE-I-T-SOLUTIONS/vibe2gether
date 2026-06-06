"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Users, ShoppingBag, Calendar, BadgeCheck } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/explore", icon: Users, label: "Explore" },
  { href: "/marketplace", icon: ShoppingBag, label: "Shop" },
  { href: "/events", icon: Calendar, label: "Events" },
  { href: "/subscriptions", icon: BadgeCheck, label: "Subs" },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-background/80 backdrop-blur-lg border-t border-border safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all duration-200 gap-1",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <div className={cn("p-2 rounded-xl transition-all duration-200", isActive && "gradient-bg")}>
                <Icon className={cn("w-5 h-5 transition-colors", isActive && "text-primary-foreground")} />
              </div>
              <span className={cn("text-xs font-medium leading-none", isActive ? "text-primary font-semibold" : "text-muted-foreground")}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
