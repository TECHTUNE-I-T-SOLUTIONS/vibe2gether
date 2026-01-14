"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Search, Send, Loader, Phone, Video, MoreVertical } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Conversation {
  id: string
  user_id: string
  admin_id: string
  last_message?: string
  last_message_time?: string
  unread_count?: number
  user?: any
  is_resolved?: boolean
}

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  sender_type: string
  content: string
  created_at: string
}

export default function AdminMessagesPage() {
  const searchParams = useSearchParams()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [messageInput, setMessageInput] = useState("")
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchConversations()
  }, [])

  // Handle user query parameter to open/create conversation with specific user
  useEffect(() => {
    const userId = searchParams.get("user")
    if (userId && conversations.length > 0) {
      const existingConversation = conversations.find((conv) => conv.user_id === userId)
      if (existingConversation) {
        setSelectedConversation(existingConversation)
        fetchMessages(existingConversation.id)
      } else {
        // Create new conversation with this user
        createConversation(userId)
      }
    }
  }, [searchParams, conversations])

  async function createConversation(userId: string) {
    try {
      const supabase = createClient()
      const response = await fetch("/api/admin/auth/me")
      const data = await response.json()
      const adminData = data.admin || data
      const adminId = adminData.id

      // Check if conversation already exists
      const { data: existing } = await supabase
        .from("admin_messages_conversations")
        .select("*")
        .eq("user_id", userId)
        .eq("admin_id", adminId)
        .single()

      if (existing) {
        setSelectedConversation(existing)
        fetchMessages(existing.id)
      } else {
        // Create new conversation
        const { data: newConversation, error } = await supabase
          .from("admin_messages_conversations")
          .insert({
            user_id: userId,
            admin_id: adminId,
            last_message: null,
            last_message_time: new Date().toISOString(),
            is_resolved: false,
          })
          .select(
            `
            id,
            user_id,
            admin_id,
            last_message,
            last_message_time,
            unread_count,
            is_resolved,
            users(full_name, profile_picture, email)
          `
          )
          .single()

        if (!error && newConversation) {
          const conversation = {
            ...newConversation,
            user: newConversation.users,
          }
          setSelectedConversation(conversation)
          setConversations([conversation, ...conversations])
        }
      }
    } catch (error) {
      console.error("Error creating conversation:", error)
    }
  }

  async function fetchConversations() {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("admin_messages_conversations")
        .select(
          `
          id,
          user_id,
          admin_id,
          last_message,
          last_message_time,
          unread_count,
          is_resolved,
          users(full_name, profile_picture, email)
        `
        )
        .order("last_message_time", { ascending: false })

      if (!error && data) {
        setConversations(
          data.map((conv: any) => ({
            ...conv,
            user: conv.users,
          }))
        )
      }
    } catch (error) {
      console.error("Error fetching conversations:", error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchMessages(conversationId: string) {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("admin_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })

      if (!error && data) {
        setMessages(data)
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  async function sendMessage() {
    if (!messageInput.trim() || !selectedConversation) return

    setSending(true)
    try {
      const supabase = createClient()

      // Get current admin from session/token
      const response = await fetch("/api/admin/auth/me")
      const data = await response.json()
      // Handle both flat and nested response structures
      const adminData = data.admin || data

      const { error } = await supabase.from("admin_messages").insert([
        {
          conversation_id: selectedConversation.id,
          sender_id: adminData.id,
          sender_type: "admin",
          content: messageInput,
        },
      ])

      if (!error) {
        setMessageInput("")
        await fetchMessages(selectedConversation.id)
        // Update conversation last message
        await supabase
          .from("admin_messages_conversations")
          .update({
            last_message: messageInput,
            last_message_time: new Date().toISOString(),
          })
          .eq("id", selectedConversation.id)
      }
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setSending(false)
    }
  }

  async function markAsResolved(conversationId: string) {
    try {
      const supabase = createClient()
      await supabase
        .from("admin_messages_conversations")
        .update({ is_resolved: true })
        .eq("id", conversationId)
      await fetchConversations()
    } catch (error) {
      console.error("Error resolving conversation:", error)
    }
  }

  const filteredConversations = conversations.filter((conv) =>
    conv.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex items-center justify-center min-h-[500px]">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Admin Messages</h1>
        <p className="text-muted-foreground">Communicate with users and manage support tickets</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Conversations List */}
        <Card className="border-border/50 flex flex-col overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Conversations</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            {/* Search */}
            <div className="px-4 pb-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  No conversations
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setSelectedConversation(conv)
                      fetchMessages(conv.id)
                    }}
                    className={`w-full p-4 border-b border-border text-left transition-colors hover:bg-muted/50 ${
                      selectedConversation?.id === conv.id ? "bg-muted" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar className="w-10 h-10 flex-shrink-0">
                        <AvatarImage src={conv.user?.profile_picture} />
                        <AvatarFallback>{conv.user?.full_name?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{conv.user?.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{conv.user?.email}</p>
                      </div>
                      {conv.unread_count ? (
                        <Badge className="flex-shrink-0">{conv.unread_count}</Badge>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{conv.last_message}</p>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chat Area */}
        {selectedConversation ? (
          <Card className="border-border/50 lg:col-span-2 flex flex-col overflow-hidden">
            {/* Header */}
            <CardHeader className="pb-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedConversation.user?.profile_picture} />
                    <AvatarFallback>{selectedConversation.user?.full_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedConversation.user?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{selectedConversation.user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedConversation.is_resolved && (
                    <Badge className="bg-green-500">Resolved</Badge>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Phone className="w-4 h-4 mr-2" />
                        Call User
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Video className="w-4 h-4 mr-2" />
                        Video Call
                      </DropdownMenuItem>
                      {!selectedConversation.is_resolved && (
                        <DropdownMenuItem
                          onClick={() => markAsResolved(selectedConversation.id)}
                          className="text-green-600"
                        >
                          Mark as Resolved
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No messages yet
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_type === "admin" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.sender_type === "admin"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>

            {/* Input */}
            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  disabled={sending}
                  className="text-sm"
                />
                <Button
                  onClick={sendMessage}
                  disabled={sending || !messageInput.trim()}
                  className="gap-2"
                >
                  {sending ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="border-border/50 lg:col-span-2 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p>Select a conversation to start messaging</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
