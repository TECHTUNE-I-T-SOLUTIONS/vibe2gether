import type React from "react"
import type { Metadata, Viewport } from "next"
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Providers } from "./providers"

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Join Vibe2Gether — the community hub where young professionals Learn, Connect, and Earn. Discover jobs, funding, events, and a marketplace in one place.",
  description: "Join Vibe2Gether — the community hub where young professionals Learn, Connect, and Earn. Discover jobs, funding, events, and a marketplace in one place.",
  keywords: ["vibing", "networking", "marketplace", "events", "connections", "monetization"],
  authors: [{ name: "Vibe2Gether" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/v2g-logo.png",
    apple: "/v2g-logo.png",
    shortcut: "/v2g-logo.png",
  },
  openGraph: {
    title: "Join Vibe2Gether — the community hub where young professionals Learn, Connect, and Earn. Discover jobs, funding, events, and a marketplace in one place.",
    description:
      "Join Vibe2Gether — the community hub where young professionals Learn, Connect, and Earn. Discover jobs, funding, events, and a marketplace in one place.",
    type: "website",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ff477e" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0d0f" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${plusJakartaSans.variable} ${geistMono.variable} font-sans antialiased`} suppressHydrationWarning>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  )
}
