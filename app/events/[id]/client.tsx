"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export function EventRedirectClient({ id }: { id: string }) {
  const router = useRouter()

  useEffect(() => {
    router.replace(`/events?event_id=${id}`)
  }, [id, router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Redirecting to event details...</p>
    </div>
  )
}
