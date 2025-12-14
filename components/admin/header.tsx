"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useTheme } from "next-themes"
import { Menu, Bell, Search, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { LanguageSwitcher } from "@/components/language-switcher"
import { AdminSidebar } from "./sidebar"
import { cn } from "@/lib/utils"

export function AdminHeader() {
  const [isScrolled, setIsScrolled] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

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
        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <AdminSidebar />
          </SheetContent>
        </Sheet>

        {/* Mobile Logo */}
        <Link href="/admin" className="lg:hidden">
          <div className="relative w-8 h-8 rounded-full overflow-hidden">
            <Image src="/v2g-logo.png" alt="V2G" fill className="object-cover" />
          </div>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users, posts, reports..."
              className="pl-10 rounded-full bg-muted/50 border-0 focus-visible:ring-primary/50"
            />
          </div>
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

          <Button variant="ghost" size="icon" className="rounded-full relative">
            <Bell className="w-5 h-5" />
            <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-destructive text-xs">
              8
            </Badge>
          </Button>

          <Link href="/admin/settings">
            <Avatar className="w-9 h-9 ring-2 ring-primary/20 cursor-pointer hover:ring-primary transition-all">
              <AvatarImage src="/placeholder.svg?height=72&width=72" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  )
}
