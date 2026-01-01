"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Menu, Search, Sun, Moon, Coins, Loader2, X } from "lucide-react"
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
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const { user } = useUserProfile()

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

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
    setShowMobileSearch(false)
  }

  const handleWalletClick = () => {
    router.push("/dashboard/wallet")
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
        {!showMobileSearch && (
          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="rounded-2xl hover:bg-primary/10">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 flex flex-col gap-0">
              <MobileSidebar />
            </SheetContent>
          </Sheet>
        )}

        {/* Mobile Logo or Mobile Search */}
        {showMobileSearch ? (
          <div className="flex-1 relative lg:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                autoFocus
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => searchQuery && setShowSearchResults(true)}
                placeholder="Search users..."
                className="pl-10 pr-10 rounded-full bg-muted/50 border-0 focus-visible:ring-primary/50"
              />
              {searchLoading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
              )}
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("")
                    setShowSearchResults(false)
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>

            {/* Mobile Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
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
        ) : (
          <Link href="/dashboard" className="lg:hidden">
            <div className="relative w-8 h-8 rounded-full overflow-hidden">
              <Image src="/v2g-logo.png" alt="V2G" fill className="object-cover" />
            </div>
          </Link>
        )}

        {/* Desktop Search */}
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

          {/* Desktop Search Results Dropdown */}
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
          {/* Mobile Search Icon */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full lg:hidden"
            onClick={() => setShowMobileSearch(!showMobileSearch)}
          >
            {showMobileSearch ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </Button>

          {/* Coins - Mobile and Desktop */}
          <Button 
            variant="ghost" 
            className="rounded-full gap-2 flex items-center"
            onClick={handleWalletClick}
            title="Go to wallet"
          >
            <div className="w-6 h-6 rounded-full gradient-bg flex items-center justify-center">
              <Coins className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold hidden sm:inline">{(user?.coins_balance || 0).toLocaleString()}</span>
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
          {/* Removed - messaging available in bottom navigation and sidebar */}

          {/* Notifications */}
          {/* Removed - notifications available in bottom navigation and sidebar */}

          {/* Profile */}
          <Link href="/dashboard/profile">
            <div className="relative">
              <Avatar className="w-9 h-9 ring-2 ring-primary/20 cursor-pointer hover:ring-primary transition-all">
                <AvatarImage src={user?.profile_picture || "/man-avatar-happy.jpg"} />
                <AvatarFallback>{user?.display_name?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
              {user?.is_premium && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full flex items-center justify-center shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </span>
              )}
            </div>
          </Link>
        </div>
      </div>
    </header>
  )
}
