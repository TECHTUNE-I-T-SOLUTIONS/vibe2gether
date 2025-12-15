"use client"

import { useState, useEffect } from "react"
import { Search, Phone, Video, MoreVertical, Send, Smile, ImagePlus, Mic, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/context"

interface Conversation {
  id: string
  name: string
  avatar: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  online: boolean
}

interface Message {
  id: string
  sender_id: string
  text: string
  created_at: string
}

export default function MessagesPage() {
  const { t } = useI18n()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedChat, setSelectedChat] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchConversations() {
      try {
        setLoading(true)
        const response = await fetch("/api/messages")
        if (!response.ok) throw new Error("Failed to fetch conversations")
        const data = await response.json()
        const convs = data.conversations || []
        setConversations(convs)
        if (convs.length > 0) {
          setSelectedChat(convs[0])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        console.error("Fetch error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchConversations()
  }, [])

  useEffect(() => {
    async function fetchMessages() {
      if (!selectedChat) return
      try {
        const response = await fetch(`/api/messages?matchId=${selectedChat.id}`)
        if (!response.ok) throw new Error("Failed to fetch messages")
        const data = await response.json()
        setMessages(data.messages || [])
      } catch (err) {
        console.error("Fetch messages error:", err)
      }
    }
    if (selectedChat) {
      fetchMessages()
    }
  }, [selectedChat])

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Conversations List */}
      <div className="w-full md:w-80 lg:w-96 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h1 className="text-xl font-bold mb-4">{t("messages")}</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder={t("search")} className="pl-10 rounded-full bg-muted/50 border-0" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <p>No conversations yet</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedChat(conv)}
                className={cn(
                  "flex items-center gap-3 p-4 cursor-pointer transition-colors hover:bg-muted/50",
                  selectedChat?.id === conv.id && "bg-muted",
                )}
              >
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={conv.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{conv.name[0]}</AvatarFallback>
                  </Avatar>
                  {conv.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold truncate">{conv.name}</p>
                    <span className="text-xs text-muted-foreground">{conv.lastMessageTime}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                </div>
                {conv.unreadCount > 0 && (
                  <Badge className="gradient-bg h-5 min-w-5 flex items-center justify-center p-0">{conv.unreadCount}</Badge>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="hidden md:flex flex-1 flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={selectedChat.avatar || "/placeholder.svg"} />
                  <AvatarFallback>{selectedChat.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{selectedChat.name}</p>
                  <p className="text-xs text-green-500">{selectedChat.online ? t("online") : t("offline")}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Phone className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Video className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={cn("flex", msg.sender_id === currentUserId ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[70%] px-4 py-2.5 rounded-2xl",
                        msg.sender_id === currentUserId ? "gradient-bg text-white rounded-br-md" : "bg-muted rounded-bl-md",
                      )}
                    >
                      <p>{msg.text}</p>
                      <p className={cn("text-xs mt-1", msg.sender_id === currentUserId ? "text-white/70" : "text-muted-foreground")}>
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground">
                  <ImagePlus className="w-5 h-5" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="pr-10 rounded-full bg-muted/50 border-0"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full w-8 h-8"
                  >
                    <Smile className="w-5 h-5 text-muted-foreground" />
                  </Button>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground">
                  <Mic className="w-5 h-5" />
                </Button>
                <Button size="icon" className="rounded-full gradient-bg">
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p>Select a conversation to view messages</p>
          </div>
        )}
      </div>
    </div>
  )
}
