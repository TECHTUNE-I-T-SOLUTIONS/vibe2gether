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
  title: "Vibe2Gether - Find Your Perfect Match",
  description: "Connect with amazing people worldwide. Dating meets marketplace on the most romantic social platform.",
  generator: "v0.app",
  keywords: ["dating", "social", "marketplace", "connection", "love", "relationships"],
  authors: [{ name: "Vibe2Gether" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/v2g-logo.png",
    apple: "/v2g-logo.png",
    shortcut: "/v2g-logo.png",
  },
  openGraph: {
    title: "Vibe2Gether - Find Your Perfect Match",
    description:
      "Connect with amazing people worldwide. Dating meets marketplace on the most romantic social platform.",
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
      <body className={`${plusJakartaSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  )
}
