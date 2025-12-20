import type React from "react"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardMobileBottomNav } from "@/components/dashboard/mobile-bottom-nav"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="lg:ml-64">
        <DashboardHeader />
        <main className="pt-16 md:pt-20 lg:pt-16 pb-24 md:pb-8">{children}</main>
      </div>
      <DashboardMobileBottomNav unreadNotifications={0} />
    </div>
  )
}
