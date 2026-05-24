"use client"

import { useState } from "react"
import { Share2, Link as LinkIcon, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

type Props = {
  title: string
  description?: string | null
  shareUrl: string
}

async function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const input = document.createElement("input")
  input.value = text
  input.style.position = "fixed"
  input.style.opacity = "0"
  document.body.appendChild(input)
  input.focus()
  input.select()
  document.execCommand("copy")
  document.body.removeChild(input)
}

export function ShareActions({ title, description, shareUrl }: Props) {
  const [busy, setBusy] = useState(false)
  const { toast } = useToast()

  async function handleShare() {
    try {
      setBusy(true)
      const payload = {
        title,
        text: description || "Check out this event!",
        url: shareUrl,
      }

      if (navigator.share) {
        await navigator.share(payload)
        return
      }

      await copyToClipboard(shareUrl)
      toast({ title: "Link copied", description: "Event link copied to clipboard." })
    } catch (error: any) {
      if (error?.name !== "AbortError") {
        toast({ title: "Share failed", description: "Could not open share sheet.", variant: "destructive" })
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-6 flex flex-wrap gap-3 grid-2 md:grid-cols-3 lg:grid-cols-4">
      <Button onClick={handleShare} disabled={busy} className="h-12 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-black hover:from-orange-400 hover:to-yellow-400 dark:bg-gradient-to-r dark:from-orange-500 dark:to-amber-500 px-6 font-bold dark:text-black dark:hover:from-orange-400 dark:hover:to-yellow-400">
        <Share2 className="mr-2 h-4 w-4" />
        Share Event
      </Button>
      {/* <Button onClick={handleShare} disabled={busy} variant="outline" className="h-12 rounded-full border-white/20 bg-black/5 dark:bg-white/5 px-6 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10">
        <Copy className="mr-2 h-4 w-4" />
        Open Share Link
      </Button>
      <Button onClick={handleShare} disabled={busy} variant="outline" className="h-12 rounded-full border-white/20 bg-black/5 dark:bg-white/5 px-6 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10">
        <LinkIcon className="mr-2 h-4 w-4" />
        Share Link
      </Button> */}
    </div>
  )
}
