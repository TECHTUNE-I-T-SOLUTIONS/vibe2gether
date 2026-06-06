"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { BadgeCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

const dashboardHref = "/dashboard/subscriptions"
const loginHref = `/login?callbackUrl=${encodeURIComponent(dashboardHref)}`

export function PublicSubscriptionPrimaryAction({ label = "Subscribe" }: { label?: string }) {
  const { status } = useSession()
  const href = status === "authenticated" ? dashboardHref : loginHref

  return (
    <Button asChild className="rounded-full gradient-bg">
      <Link href={href}>
        <BadgeCheck className="mr-2 h-4 w-4" />
        {status === "authenticated" ? label : "Log in to Subscribe"}
      </Link>
    </Button>
  )
}

export function PublicSubscriptionHeroActions() {
  const { status } = useSession()
  const primaryHref = status === "authenticated" ? dashboardHref : loginHref

  return (
    <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
      <Button asChild size="lg" className="rounded-full gradient-bg">
        <Link href={primaryHref}>{status === "authenticated" ? "View in Dashboard" : "Log in to Subscribe"}</Link>
      </Button>
      {/* <Button asChild size="lg" variant="outline" className="rounded-full">
        <Link href={dashboardHref}>View Dashboard</Link>
      </Button> */}
    </div>
  )
}
