"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminSidebar } from "@/components/admin/sidebar"
import { AdminHeader } from "@/components/admin/header"
import { AdminMobileSidebar } from "@/components/admin/mobile-sidebar"
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

  useEffect(() => {
    checkAdminAuth()
  }, [])

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
            <main className="flex-1 pt-20 px-4 md:px-6 overflow-y-auto">{children}</main>
          </div>
        </div>

        {/* Mobile Sidebar Footer - only visible on mobile */}
        <div className="lg:hidden">
          <AdminMobileSidebar />
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmationDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog} isAdminLogout={true} />
    </>
  )
}
