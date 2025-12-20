"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Menu, Bell, MessageCircle, Search, Sun, Moon, Coins, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { LanguageSwitcher } from "@/components/language-switcher"
import { DashboardSidebar } from "./sidebar"
import { MobileSidebar } from "./mobile-sidebar"
import { useUserProfile } from "@/hooks/use-user-profile"
import { searchUsers } from "@/lib/supabase/queries"
import { cn } from "@/lib/utils"

export function DashboardHeader() {
  const router = useRouter()
  const [isScrolled, setIsScrolled] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const { user } = useUserProfile()

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

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
    if (mounted) {
      fetchCounts()
    }
  }, [mounted])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (!value.trim()) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    setSearchLoading(true)
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const { data, error } = await searchUsers(value, 10)
        if (!error && data) {
          setSearchResults(data)
          setShowSearchResults(true)
        }
      } catch (err) {
        console.error("Search error:", err)
      } finally {
        setSearchLoading(false)
      }
    }, 300)
  }

  const handleSelectUser = (userId: string) => {
    router.push(`/dashboard/user/${userId}`)
    setSearchQuery("")
    setShowSearchResults(false)
  }

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-40 transition-all duration-300 lg:left-64 h-16 lg:h-20",
        isScrolled
          ? "bg-background/80 backdrop-blur-lg border-b border-border shadow-sm"
          : "bg-background/50 backdrop-blur-sm",
      )}
    >
      <div className="flex items-center justify-between h-full px-4 gap-4">
        {/* Mobile Menu Button */}
        <Sheet>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 flex flex-col">
            <MobileSidebar />
          </SheetContent>
        </Sheet>

        {/* Mobile Logo */}
        <Link href="/dashboard" className="lg:hidden">
          <div className="relative w-8 h-8 rounded-full overflow-hidden">
            <Image src="/v2g-logo.png" alt="V2G" fill className="object-cover" />
          </div>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-md hidden md:block relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => searchQuery && setShowSearchResults(true)}
              placeholder="Search users..."
              className="pl-10 rounded-full bg-muted/50 border-0 focus-visible:ring-primary/50"
            />
            {searchLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleSelectUser(result.id)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted transition-colors border-b last:border-0"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={result.profile_picture} />
                    <AvatarFallback>{result.display_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-sm">{result.display_name}</p>
                    {result.country && (
                      <p className="text-xs text-muted-foreground">{result.country}</p>
                    )}
                  </div>
                  {result.is_premium && (
                    <Badge className="gradient-bg text-white text-xs">Premium</Badge>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Coins */}
          <Button variant="ghost" className="rounded-full gap-2 hidden sm:flex">
            <div className="w-6 h-6 rounded-full gradient-bg flex items-center justify-center">
              <Coins className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold">{(user?.coins_balance || 0).toLocaleString()}</span>
          </Button>

          {/* Language */}
          <LanguageSwitcher />

          {/* Theme Toggle */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          )}

          {/* Messages */}
          <Button variant="ghost" size="icon" className="rounded-full relative">
            <MessageCircle className="w-5 h-5" />
            {unreadMessages > 0 && (
              <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center gradient-bg text-xs text-white">
                {unreadMessages}
              </Badge>
            )}
          </Button>

          {/* Notifications */}
          <Link href="/dashboard/notifications">
            <Button variant="ghost" size="icon" className="rounded-full relative">
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center gradient-bg text-xs text-white">
                  {unreadNotifications}
                </Badge>
              )}
            </Button>
          </Link>

          {/* Profile */}
          <Link href="/dashboard/profile">
            <Avatar className="w-9 h-9 ring-2 ring-primary/20 cursor-pointer hover:ring-primary transition-all">
              <AvatarImage src={user?.profile_picture || "/diverse-user-avatars.png"} />
              <AvatarFallback>{user?.display_name?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  )
}
