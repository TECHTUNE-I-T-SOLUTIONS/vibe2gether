"use client"

import { Lock } from "lucide-react"
import { cn } from "@/lib/utils"

export function PaymentMethodOptions({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-2", className)}>
      <div className="rounded-lg border border-primary bg-primary/10 p-3 text-left">
        <p className="font-semibold">Payment method I</p>
        <p className="text-xs text-muted-foreground">Available now.</p>
      </div>
      <div className="flex cursor-not-allowed items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3 text-left opacity-70">
        <div>
          <p className="font-semibold">Payment method II</p>
          <p className="text-xs text-muted-foreground">Coming soon.</p>
        </div>
        <Lock className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  )
}
