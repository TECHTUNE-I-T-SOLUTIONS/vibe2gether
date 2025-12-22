"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { AdminSidebar } from "@/components/admin/sidebar"
import { AdminHeader } from "@/components/admin/header"
import { AdminMobileBottomNav } from "@/components/admin/mobile-bottom-nav"
import { LogoutConfirmationDialog } from "@/components/logout-confirmation-dialog"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [badges, setBadges] = useState({
    reports: 0,
    featured: 0,
    notifications: 0,
  })

  useEffect(() => {
    checkAdminAuth()
    fetchBadges()
  }, [])

  const fetchBadges = async () => {
    try {
      const [reportsRes, featuredRes, notificationsRes] = await Promise.all([
        fetch("/api/admin/reports?limit=1"),
        fetch("/api/admin/featured-requests?limit=1"),
        fetch("/api/admin/notifications?limit=1"),
      ])

      const newBadges = {
        reports: 0,
        featured: 0,
        notifications: 0,
      }

      if (reportsRes.ok) {
        const data = await reportsRes.json()
        newBadges.reports = data.count || 0
      }

      if (featuredRes.ok) {
        const data = await featuredRes.json()
        newBadges.featured = data.count || 0
      }

      if (notificationsRes.ok) {
        const data = await notificationsRes.json()
        newBadges.notifications = data.unreadCount || 0
      }

      setBadges(newBadges)
    } catch (error) {
      console.error("Failed to fetch badge counts:", error)
    }
  }

  const checkAdminAuth = async () => {
    try {
      const response = await fetch("/api/admin/auth/me")
      if (!response.ok) {
        setIsAuthenticated(false)
        router.push("/auth/login")
        return
      }
      setIsAuthenticated(true)
    } catch (error) {
      console.error("Auth check failed:", error)
      setIsAuthenticated(false)
      router.push("/auth/login")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Desktop Layout */}
        <div className="flex flex-col lg:flex-row h-screen lg:min-h-screen">
          {/* Desktop Sidebar - fixed on desktop, hidden on mobile */}
          <div className="hidden lg:block w-64 fixed left-0 top-0 h-screen">
            <AdminSidebar />
          </div>

          {/* Main content area */}
          <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
            <AdminHeader onLogoutClick={() => setShowLogoutDialog(true)} />
            <main className="flex-1 pt-20 px-4 md:px-6 overflow-y-auto pb-24 lg:pb-0">{children}</main>
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <AdminMobileBottomNav
          reportsBadge={badges.reports}
          featuredBadge={badges.featured}
          notificationsBadge={badges.notifications}
        />

      </div>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmationDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog} isAdminLogout={true} />
    </>
  )
}
