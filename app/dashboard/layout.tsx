import type React from "react"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"

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
        <main className="pt-16 lg:pt-0 pb-8 lg:pb-8">{children}</main>
      </div>
    </div>
  )
}
