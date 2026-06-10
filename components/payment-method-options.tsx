"use client"

import { CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

type PaymentMethod = "paystack" | "flutterwave"

type PaymentMethodOptionsProps = {
  className?: string
  value?: PaymentMethod
  onChange?: (method: PaymentMethod) => void
  layout?: "grid" | "stack"
}

export function PaymentMethodOptions({ className, value = "paystack", onChange, layout = "grid" }: PaymentMethodOptionsProps) {
  const selectable = Boolean(onChange)

  return (
    <div className={cn(layout === "grid" ? "grid gap-3 sm:grid-cols-2" : "grid gap-2", className)}>
      <button
        type="button"
        onClick={() => onChange?.("paystack")}
        className={cn(
          "flex items-center justify-between gap-3 rounded-lg border p-3 text-left transition",
          value === "paystack" ? "border-primary bg-primary/10" : "bg-background hover:border-primary/60",
          !selectable && "cursor-default"
        )}
      >
        <div>
          <p className="font-semibold">Payment method I</p>
          <p className="text-xs text-muted-foreground">Supports Nigerian currency only.</p>
          <p className="mt-2 text-xs font-medium text-primary">Currency: NGN</p>
        </div>
        {value === "paystack" && <CheckCircle2 className="h-4 w-4 text-primary" />}
      </button>
      <button
        type="button"
        onClick={() => onChange?.("flutterwave")}
        className={cn(
          "flex items-center justify-between gap-3 rounded-lg border p-3 text-left transition",
          value === "flutterwave" ? "border-primary bg-primary/10" : "bg-background hover:border-primary/60",
          !selectable && "cursor-default"
        )}
      >
        <div>
          <p className="font-semibold">Payment method II</p>
          <p className="text-xs text-muted-foreground">Supports Cameroon mobile money.</p>
          <p className="mt-2 text-xs font-medium text-primary">Currency: XAF</p>
        </div>
        {value === "flutterwave" && <CheckCircle2 className="h-4 w-4 text-primary" />}
      </button>
    </div>
  )
}
