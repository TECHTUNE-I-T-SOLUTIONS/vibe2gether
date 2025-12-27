"use client"

import type React from "react"

import { useState, useRef } from "react"
import Image from "next/image"
import { ImagePlus, Video, Smile, MapPin, X, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useI18n } from "@/lib/i18n/context"

export function CreatePost() {
  const { t } = useI18n()
  const [content, setContent] = useState("")
  const [selectedMedia, setSelectedMedia] = useState<string[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }

  const removeMedia = (index: number) => {
    setSelectedMedia((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="border-b border-border p-4 bg-card">
      <div className="flex gap-3">
        <Avatar className="w-10 h-10 ring-2 ring-primary/20">
          <AvatarImage src="/man-avatar-happy.jpg" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextareaChange}
            placeholder={t("whatsOnYourMind")}
            className="w-full min-h-[60px] max-h-40 bg-transparent border-0 resize-none text-foreground placeholder:text-muted-foreground focus:outline-none text-base"
            rows={2}
          />

          {/* Selected Media Preview */}
          {selectedMedia.length > 0 && (
            <div className="mt-3 flex gap-2 flex-wrap">
              {selectedMedia.map((url, index) => (
                <div key={index} className="relative group w-20 h-20 rounded-xl overflow-hidden">
                  <Image src={url || "/placeholder.svg"} alt="" fill className="object-cover" />
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeMedia(index)}
                  >
                    <X className="w-3 h-3 text-white" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 text-primary">
                <ImagePlus className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 text-secondary">
                <Video className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 text-accent">
                <Smile className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 text-muted-foreground">
                <MapPin className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {content.length > 0 && <span className="text-xs text-muted-foreground">{content.length}/500</span>}
              <Button
                className="rounded-full gradient-bg px-5"
                size="sm"
                disabled={content.length === 0 && selectedMedia.length === 0}
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                {t("share")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
