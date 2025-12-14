"use client"
import { Globe, Check, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useI18n } from "@/lib/i18n/context"
import { locales } from "@/lib/i18n/translations"
import { cn } from "@/lib/utils"

export function LanguageSwitcher({ variant = "icon" }: { variant?: "icon" | "full" }) {
  const { locale, setLocale } = useI18n()
  const currentLocale = locales.find((l) => l.code === locale)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "icon" ? (
          <Button variant="ghost" size="icon" className="rounded-full">
            <Globe className="w-5 h-5" />
          </Button>
        ) : (
          <Button variant="outline" className="rounded-full gap-2 bg-transparent">
            <span className="text-base">{currentLocale?.flag}</span>
            <span className="hidden sm:inline">{currentLocale?.name}</span>
            <ChevronDown className="w-4 h-4 opacity-50" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 max-h-80 overflow-y-auto">
        {locales.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLocale(l.code)}
            className={cn("flex items-center gap-3 cursor-pointer", locale === l.code && "bg-muted")}
          >
            <span className="text-lg">{l.flag}</span>
            <span className="flex-1">{l.name}</span>
            {locale === l.code && <Check className="w-4 h-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
