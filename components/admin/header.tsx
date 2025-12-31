"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import { useTheme } from "next-themes"
import { Menu, Bell, Search, Sun, Moon, X, LogOut, Settings, User, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { LanguageSwitcher } from "@/components/language-switcher"
import { AdminSidebar } from "./sidebar"
import { AdminMobileSidebar } from "./mobile-sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface AdminData {
  id: string
  email: string
  full_name: string
  profile_picture?: string
}

interface AdminHeaderProps {
  onLogoutClick?: () => void
}

export function AdminHeader({ onLogoutClick }: AdminHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const [adminData, setAdminData] = useState<AdminData | null>(null)
  const [notificationCount, setNotificationCount] = useState(0)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    setMounted(true)
    fetchAdminData()
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const fetchAdminData = async () => {
    try {
      const response = await fetch("/api/admin/auth/me")
      if (response.ok) {
        const data = await response.json()
        // Handle both flat and nested responses
        const adminData = data.admin || data
        setAdminData({
          id: adminData.id,
          email: adminData.email,
          full_name: adminData.full_name,
          profile_picture: adminData.profile_picture,
        })
      }
    } catch (error) {
      console.error("Failed to fetch admin data:", error)
    }
  }

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  // Note: handleLogout is passed as a prop from layout
  // Will be defined below as a prop that the component receives
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    
    // Clear any pending searches
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (!query.trim()) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    setShowResults(true)
    
    // Debounce the search by 300ms
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        // Search across all admin resources in parallel
        const results: any[] = []

        const searchPromises = [
          fetch(`/api/admin/search?q=${encodeURIComponent(query)}&type=users`)
            .then(res => res.ok ? res.json() : [])
            .then(users => 
              Array.isArray(users) ? users.map((u: any) => ({ type: "user", ...u, href: `/admin/users` })) : []
            )
            .catch(err => {
              console.error("Users search error:", err)
              return []
            }),
          
          fetch(`/api/admin/search?q=${encodeURIComponent(query)}&type=posts`)
            .then(res => res.ok ? res.json() : [])
            .then(posts => 
              Array.isArray(posts) ? posts.map((p: any) => ({ type: "post", ...p, href: `/admin/blog` })) : []
            )
            .catch(err => {
              console.error("Posts search error:", err)
              return []
            }),
          
          fetch(`/api/admin/search?q=${encodeURIComponent(query)}&type=events`)
            .then(res => res.ok ? res.json() : [])
            .then(events => 
              Array.isArray(events) ? events.map((e: any) => ({ type: "event", ...e, href: `/admin/events` })) : []
            )
            .catch(err => {
              console.error("Events search error:", err)
              return []
            }),
          
          fetch(`/api/admin/search?q=${encodeURIComponent(query)}&type=products`)
            .then(res => res.ok ? res.json() : [])
            .then(products => 
              Array.isArray(products) ? products.map((p: any) => ({ type: "product", ...p, href: `/admin/marketplace` })) : []
            )
            .catch(err => {
              console.error("Products search error:", err)
              return []
            }),
        ]

        const allResults = await Promise.all(searchPromises)
        const combined = allResults.flat().slice(0, 12)
        setSearchResults(combined)
      } catch (error) {
        console.error("Search error:", error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)
  }

  const handleResultClick = (result: any) => {
    router.push(result.href)
    setSearchQuery("")
    setShowResults(false)
  }

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 lg:left-64",
        isScrolled
          ? "bg-background/80 backdrop-blur-lg border-b border-border shadow-sm"
          : "bg-background/50 backdrop-blur-sm",
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 gap-4">
        {/* Mobile Menu Toggle or Search Toggle */}
        {!showMobileSearch ? (
          <>
            <Sheet>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72 flex flex-col gap-0">
                <AdminMobileSidebar onLogoutClick={onLogoutClick} />
              </SheetContent>
            </Sheet>

            {/* Mobile Logo */}
            <Link href="/admin" className="lg:hidden">
              <div className="relative w-8 h-8 rounded-full overflow-hidden">
                <Image src="/v2g-logo.png" alt="V2G" fill className="object-cover" />
              </div>
            </Link>

            {/* Mobile Search Toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full lg:hidden ml-auto"
              onClick={() => setShowMobileSearch(true)}
            >
              <Search className="w-5 h-5" />
            </Button>
          </>
        ) : (
          <>
            {/* Mobile Search Input */}
            <div className="flex-1 lg:hidden relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  autoFocus
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => searchQuery && setShowResults(true)}
                  className="pl-10 pr-8 rounded-full bg-muted/50 border-0 focus-visible:ring-primary/50"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("")
                      setSearchResults([])
                      setShowResults(false)
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>

              {/* Mobile Search Results Dropdown */}
              {showResults && (searchResults.length > 0 || isSearching) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
                  {isSearching ? (
                    <div className="p-6 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Searching...</span>
                      </div>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="divide-y divide-border">
                      {searchResults.map((result, idx) => (
                        <button
                          key={`${result.type}-${result.id}-${idx}`}
                          onClick={() => {
                            handleResultClick(result)
                            setShowMobileSearch(false)
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-center gap-3"
                        >
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary text-xs font-semibold flex-shrink-0">
                            {result.type === "user" && "U"}
                            {result.type === "post" && "P"}
                            {result.type === "event" && "E"}
                            {result.type === "product" && "M"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {result.title || result.full_name || result.email || result.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {result.type === "user" && `User • ${result.email}`}
                              {result.type === "post" && `Blog Post • ${result.category || "Uncategorized"}`}
                              {result.type === "event" && `Event • ${result.location_name || "Location TBD"}`}
                              {result.type === "product" && `Product • $${result.price || "N/A"}`}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-muted-foreground">
                      <p className="text-sm">No results found for "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Close Search Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full lg:hidden"
              onClick={() => {
                setShowMobileSearch(false)
                setSearchQuery("")
                setSearchResults([])
                setShowResults(false)
              }}
            >
              <X className="w-5 h-5" />
            </Button>
          </>
        )}

        {/* Search */}
        <div className="flex-1 max-w-md hidden md:block relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users, posts, events, products..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => searchQuery && setShowResults(true)}
              className="pl-10 pr-8 rounded-full bg-muted/50 border-0 focus-visible:ring-primary/50"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("")
                  setSearchResults([])
                  setShowResults(false)
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showResults && (searchResults.length > 0 || isSearching) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
              {isSearching ? (
                <div className="p-6 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Searching...</span>
                  </div>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="divide-y divide-border">
                  {searchResults.map((result, idx) => (
                    <button
                      key={`${result.type}-${result.id}-${idx}`}
                      onClick={() => handleResultClick(result)}
                      className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-center gap-3"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary text-xs font-semibold flex-shrink-0">
                        {result.type === "user" && "U"}
                        {result.type === "post" && "P"}
                        {result.type === "event" && "E"}
                        {result.type === "product" && "M"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {result.title || result.full_name || result.email || result.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {result.type === "user" && `User • ${result.email}`}
                          {result.type === "post" && `Blog Post • ${result.category || "Uncategorized"}`}
                          {result.type === "event" && `Event • ${result.location_name || "Location TBD"}`}
                          {result.type === "product" && `Product • $${result.price || "N/A"}`}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-muted-foreground">
                  <p className="text-sm">No results found for "{searchQuery}"</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />

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

          <Link href="/admin/notifications">
            <Button variant="ghost" size="icon" className="rounded-full relative">
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-destructive text-xs">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </Badge>
              )}
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="w-9 h-9 ring-2 ring-primary/20 cursor-pointer hover:ring-primary transition-all">
                <AvatarImage src={adminData?.profile_picture} />
                <AvatarFallback>{adminData?.full_name?.[0] || "A"}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{adminData?.full_name || "Admin"}</p>
                <p className="text-xs text-muted-foreground truncate">{adminData?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin/profile" className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/settings" className="flex items-center">
                  <Settings className="w-4 h-4 mr-2" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onLogoutClick?.()} className="text-destructive cursor-pointer">
                <LogOut className="w-4 h-4 mr-2" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
