"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/i18n/context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bell, Menu, Globe, User, Settings, LogOut, Sun, Moon, X, Coins } from "lucide-react"
import { useTheme } from "next-themes"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

export function Header() {
  const { language, setLanguage, t } = useLanguage()
  const { theme, setTheme } = useTheme()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showUserImage, setShowUserImage] = useState(true)
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push("/")
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-background/95 backdrop-blur-md shadow-md" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden">
              <Image src="/v2g-logo.png" alt="Vibe2Gether" fill className="object-cover" />
            </div>
            <span className="text-xl md:text-2xl font-bold gradient-text hidden sm:inline">Vibe2Gether</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/#features" className="text-foreground/80 hover:text-foreground font-medium transition-colors">
              {t("features")}
            </Link>
            <Link
              href="/#testimonials"
              className="text-foreground/80 hover:text-foreground font-medium transition-colors"
            >
              {t("testimonials")}
            </Link>
            <Link href="/premium" className="text-foreground/80 hover:text-foreground font-medium transition-colors">
              {t("premium")}
            </Link>
            <Link href="/blog" className="text-foreground/80 hover:text-foreground font-medium transition-colors">
              {t("blog")}
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Language Selector */}
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-[100px] md:w-[140px] h-10 hidden sm:flex">
                <Globe className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="it">Italiano</SelectItem>
                <SelectItem value="pt">Português</SelectItem>
                <SelectItem value="ru">Русский</SelectItem>
                <SelectItem value="zh">中文</SelectItem>
                <SelectItem value="ja">日本語</SelectItem>
                <SelectItem value="ko">한국어</SelectItem>
                <SelectItem value="ar">العربية</SelectItem>
                <SelectItem value="hi">हिन्दी</SelectItem>
              </SelectContent>
            </Select>

            {/* Theme Toggle */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full"
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </Button>
            )}

            {/* User Menu or Auth Buttons */}
            {status === "loading" ? (
              <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
            ) : session?.user ? (
              <>
                {/* Coins */}
                <Button
                  variant="ghost"
                  className="hidden sm:flex items-center gap-1.5 rounded-full bg-gradient-to-r from-yellow-500/10 to-amber-500/10 hover:bg-gradient-to-r hover:from-yellow-500/20 hover:to-amber-500/20 text-amber-600 font-semibold"
                  onClick={() => router.push("/dashboard/wallet")}
                >
                  <Coins className="w-4 h-4" />
                  <span>{session.user.coins_balance || 0}</span>
                </Button>

                {/* Notifications */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative hidden sm:flex"
                  onClick={() => router.push("/dashboard/notifications")}
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full overflow-hidden">
                      {session.user.image && showUserImage ? (
                        <Image
                          src={session.user.image}
                          alt={session.user.name || "User"}
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                          unoptimized
                          onError={() => setShowUserImage(false)}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                          {session.user.name?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{session.user.name}</p>
                        {session.user.is_premium && (
                          <span className="inline-flex items-center gap-0.5 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            Premium
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground break-words">{session.user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                      <User className="w-4 h-4 mr-2" />
                      {t("dashboard")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
                      <Settings className="w-4 h-4 mr-2" />
                      {t("settings")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="w-4 h-4 mr-2" />
                      {t("signOut")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" className="hidden sm:inline-flex" asChild>
                  <Link href="/login">{t("signIn")}</Link>
                </Button>
                <Button className="gradient-bg hidden sm:inline-flex" asChild>
                  <Link href="/signup">{t("signUp")}</Link>
                </Button>
              </>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col gap-6 mt-8 p-4">
                  {/* Mobile Language Selector */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">{t("language")}</label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger>
                        <Globe className="w-4 h-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                        <SelectItem value="it">Italiano</SelectItem>
                        <SelectItem value="pt">Português</SelectItem>
                        <SelectItem value="ru">Русский</SelectItem>
                        <SelectItem value="zh">中文</SelectItem>
                        <SelectItem value="ja">日本語</SelectItem>
                        <SelectItem value="ko">한국어</SelectItem>
                        <SelectItem value="ar">العربية</SelectItem>
                        <SelectItem value="hi">हिन्दी</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Mobile Navigation */}
                  <nav className="flex flex-col gap-3">
                    <Link
                      href="/explore"
                      className="text-foreground/80 hover:text-foreground font-medium transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t("explore")}
                    </Link>
                    <Link
                      href="/marketplace"
                      className="text-foreground/80 hover:text-foreground font-medium transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t("marketplace")}
                    </Link>
                    <Link
                      href="/premium"
                      className="text-foreground/80 hover:text-foreground font-medium transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t("premium")}
                    </Link>
                    <Link
                      href="/blog"
                      className="text-foreground/80 hover:text-foreground font-medium transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t("blog")}
                    </Link>
                  </nav>

                  {/* Mobile Auth Buttons */}
                  {!session?.user && (
                    <div className="flex flex-col gap-3 mt-4">
                      <Button variant="outline" asChild className="w-full" onClick={() => setMobileMenuOpen(false)}>
                        <Link href="/login">{t("signIn")}</Link>
                      </Button>
                      <Button className="gradient-bg w-full" asChild onClick={() => setMobileMenuOpen(false)}>
                        <Link href="/signup">{t("signUp")}</Link>
                      </Button>
                    </div>
                  )}

                  {session?.user && (
                    <div className="flex flex-col gap-3 mt-4">
                      <Button variant="outline" className="w-full justify-start" onClick={() => {
                        router.push("/dashboard")
                        setMobileMenuOpen(false)
                      }}>
                        <User className="w-4 h-4 mr-2" />
                        {t("dashboard")}
                      </Button>
                      <Button variant="outline" className="w-full justify-start" onClick={() => {
                        router.push("/dashboard/wallet")
                        setMobileMenuOpen(false)
                      }}>
                        <Coins className="w-4 h-4 mr-2" />
                        Wallet
                      </Button>
                      <Button variant="outline" className="w-full justify-start" onClick={() => {
                        router.push("/dashboard/notifications")
                        setMobileMenuOpen(false)
                      }}>
                        <Bell className="w-4 h-4 mr-2" />
                        {t("notifications")}
                      </Button>
                      <Button variant="outline" className="w-full justify-start" onClick={() => {
                        router.push("/dashboard/settings")
                        setMobileMenuOpen(false)
                      }}>
                        <Settings className="w-4 h-4 mr-2" />
                        {t("settings")}
                      </Button>
                      <Button
                        variant="destructive"
                        className="w-full justify-start"
                        onClick={async () => {
                          await handleSignOut()
                          setMobileMenuOpen(false)
                        }}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        {t("signOut")}
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
