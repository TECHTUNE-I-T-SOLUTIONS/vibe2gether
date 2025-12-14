"use client"

import { useState } from "react"
import { Search, Phone, Video, MoreVertical, Send, Smile, ImagePlus, Mic } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/context"

const conversations = [
  {
    id: "1",
    name: "Emma Rodriguez",
    avatar: "/placeholder.svg?height=80&width=80",
    lastMessage: "That sounds amazing! I'd love to join you.",
    time: "2m",
    unread: 2,
    online: true,
  },
  {
    id: "2",
    name: "James Chen",
    avatar: "/placeholder.svg?height=80&width=80",
    lastMessage: "See you tomorrow at 7!",
    time: "15m",
    unread: 0,
    online: true,
  },
  {
    id: "3",
    name: "Sofia Martinez",
    avatar: "/placeholder.svg?height=80&width=80",
    lastMessage: "Thanks for the recommendation!",
    time: "1h",
    unread: 0,
    online: false,
  },
  {
    id: "4",
    name: "Marcus Williams",
    avatar: "/placeholder.svg?height=80&width=80",
    lastMessage: "Let me know when you're free",
    time: "3h",
    unread: 1,
    online: false,
  },
]

const messages = [
  { id: "1", sender: "them", text: "Hey! How are you doing? 😊", time: "10:30 AM" },
  { id: "2", sender: "me", text: "I'm great! Just got back from the gym. What about you?", time: "10:32 AM" },
  {
    id: "3",
    sender: "them",
    text: "Nice! I've been thinking about joining a gym too. Any recommendations?",
    time: "10:33 AM",
  },
  {
    id: "4",
    sender: "me",
    text: "Definitely! There's this amazing place near downtown. Great equipment and the trainers are really helpful.",
    time: "10:35 AM",
  },
  { id: "5", sender: "them", text: "That sounds amazing! I'd love to join you.", time: "10:36 AM" },
]

export default function MessagesPage() {
  const { t } = useI18n()
  const [selectedChat, setSelectedChat] = useState(conversations[0])
  const [newMessage, setNewMessage] = useState("")

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
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setSelectedChat(conv)}
              className={cn(
                "flex items-center gap-3 p-4 cursor-pointer transition-colors hover:bg-muted/50",
                selectedChat.id === conv.id && "bg-muted",
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
                  <span className="text-xs text-muted-foreground">{conv.time}</span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
              </div>
              {conv.unread > 0 && (
                <Badge className="gradient-bg h-5 min-w-5 flex items-center justify-center p-0">{conv.unread}</Badge>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="hidden md:flex flex-1 flex-col">
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
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex", msg.sender === "me" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[70%] px-4 py-2.5 rounded-2xl",
                  msg.sender === "me" ? "gradient-bg text-white rounded-br-md" : "bg-muted rounded-bl-md",
                )}
              >
                <p>{msg.text}</p>
                <p className={cn("text-xs mt-1", msg.sender === "me" ? "text-white/70" : "text-muted-foreground")}>
                  {msg.time}
                </p>
              </div>
            </div>
          ))}
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
      </div>
    </div>
  )
}
