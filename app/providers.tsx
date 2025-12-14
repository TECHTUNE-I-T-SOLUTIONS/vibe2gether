"use client"

import { ThemeProvider } from "@/components/theme-provider"
import { I18nProvider } from "@/lib/i18n/context"
import { SessionProvider } from "@/lib/providers/session-provider"
import { ServiceWorkerProvider } from "@/components/service-worker-provider"
import { Toaster } from "@/components/ui/toaster"
import type React from "react"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange={false}>
        <I18nProvider>
          <ServiceWorkerProvider />
          {children}
          <Toaster />
        </I18nProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
