"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Search, Phone, Video, MoreVertical, Send, Smile, ImagePlus, Mic, Loader2, MessageCircle, UserPlus, MessageSquare, MapPin, Users, Plus, X, ChevronLeft, ChevronRight, ArrowLeft, Flag, User, Pause, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

const EMOJIS = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣",
  "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰",
  "😘", "😗", "😚", "😙", "🥲", "😋", "😛", "😜",
  "🤪", "😒", "😔", "😏", "😜", "👍", "👎", "👏",
  "🙌", "👋", "🤝", "❤️", "💯", "🎉", "🎊", "🎈",
  "🎁", "⭐", "✨", "🔥", "💪", "🎭", "🎪", "🎨"
] as const

interface Conversation {
  id: string
  name: string
  avatar: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  online: boolean
  userId: string
}

interface Message {
  id: string
  sender_id: string
  senderId: string
  content: string
  media_url?: string
  mediaUrl?: string
  message_type: string
  messageType: string
  created_at: string
  createdAt: string
  sender?: {
    id: string
    name: string
    avatar: string
  }
}

interface User {
  id: string
  display_name: string
  profile_picture: string
  bio: string
  city: string
  country: string
  followers_count: number
  following_count: number
  is_verified: boolean
  is_premium: boolean
  isFollowing: boolean
}

export default function MessagesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { t } = useI18n()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedChat, setSelectedChat] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [searchTab, setSearchTab] = useState<"following" | "discover">("following")
  const [followingUsers, setFollowingUsers] = useState<User[]>([])
  const [discoveryUsers, setDiscoveryUsers] = useState<User[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [allFollowingUsers, setAllFollowingUsers] = useState<User[]>([])
  const [allDiscoveryUsers, setAllDiscoveryUsers] = useState<User[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const usersPerPage = 10
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)

  // Check authentication
  useEffect(() => {
    if (session === undefined) return
    if (!session?.user?.id) {
      router.push("/login")
    } else {
      setCurrentUserId(session.user.id)
    }
  }, [session, router])
  const [audioPreview, setAudioPreview] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [reportingUser, setReportingUser] = useState<Conversation | null>(null)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const [reportDescription, setReportDescription] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)
  const [mediaCaption, setMediaCaption] = useState("")
  const [justSentMessageIds, setJustSentMessageIds] = useState<Set<string>>(new Set())

  // Realtime subscription ref
  const realtimeSubscriptionRef = useRef<any>(null)

  // Initialize
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true)
        const sessionResponse = await fetch("/api/auth/session")
        const sessionData = await sessionResponse.json()
        if (sessionData.user?.id) {
          setCurrentUserId(sessionData.user.id)
        }

        const response = await fetch("/api/messages")
        if (response.ok) {
          const data = await response.json()
          const convs = data.conversations || []
          setConversations(convs)
        }
      } catch (err) {
        console.error("Initialize error:", err)
      } finally {
        setLoading(false)
      }
    }
    initialize()
  }, [])

  // Load messages when chat is selected
  useEffect(() => {
    if (!selectedChat?.id) {
      setMessages([])
      return
    }

    const loadMessages = async () => {
      try {
        const response = await fetch(`/api/messages?matchId=${selectedChat.id}`)
        if (response.ok) {
          const data = await response.json()
          const msgs = data.messages || []
          setMessages(msgs)
        }
      } catch (err) {
        console.error("Load messages error:", err)
      }
    }

    loadMessages()
  }, [selectedChat?.id])

  // Realtime subscription for messages
  useEffect(() => {
    if (!selectedChat || !currentUserId) return

    const subscribeToMessages = async () => {
      try {
        const supabase = createClient()
        
        // Unsubscribe from previous subscription
        if (realtimeSubscriptionRef.current) {
          await realtimeSubscriptionRef.current.unsubscribe()
        }

        // Subscribe to realtime changes
        realtimeSubscriptionRef.current = supabase
          .channel(`messages:${selectedChat.id}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
              filter: `match_id=eq.${selectedChat.id}`,
            },
            (payload) => {
              const newMessage = payload.new as Message
              const messageId = newMessage.id || (newMessage as any).message_id
              
              console.log("Realtime message received:", messageId, "Is in justSentIds?", justSentMessageIds.has(messageId))
              
              // CRITICAL: Only add if we didn't just send it AND it's not already in the array
              if (!justSentMessageIds.has(messageId)) {
                setMessages((prev) => {
                  // Aggressive duplicate check
                  const isDuplicate = prev.some(
                    (m) => (m.id === messageId) || 
                           ((m as any).message_id === messageId) ||
                           (m.id === newMessage.id)
                  )
                  
                  if (isDuplicate) {
                    console.log("Message already exists in state, skipping:", messageId)
                    return prev
                  }
                  
                  console.log("Adding new message from realtime:", messageId)
                  return [...prev, newMessage]
                })
              } else {
                console.log("Skipping message we just sent:", messageId)
              }
            }
          )
          .subscribe()
      } catch (err) {
        console.error("Realtime subscription error:", err)
      }
    }

    subscribeToMessages()

    return () => {
      if (realtimeSubscriptionRef.current) {
        realtimeSubscriptionRef.current.unsubscribe()
      }
    }
  }, [selectedChat, currentUserId])

  const fetchAllUsers = async (page: number = 1, query: string = "") => {
    try {
      const response = await fetch(
        `/api/users/all?page=${page}&limit=${usersPerPage}${query ? `&search=${encodeURIComponent(query)}` : ""}`
      )
      if (response.ok) {
        const data = await response.json()
        setAllUsers(data.users || [])
        setTotalUsers(data.total || 0)
        setCurrentPage(page)

        const following = data.users.filter((u: User) => u.isFollowing)
        const discovery = data.users.filter((u: User) => !u.isFollowing)
        setAllFollowingUsers(following)
        setAllDiscoveryUsers(discovery)
      }
    } catch (err) {
      console.error("Fetch users error:", err)
    }
  }

  useEffect(() => {
    if (modalOpen) {
      fetchAllUsers(1, "")
    }
  }, [modalOpen])

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setSearching(false)
      return
    }

    setSearching(true)
    try {
      const response = await fetch(`/api/users/all?search=${encodeURIComponent(query)}&limit=50`)
      if (response.ok) {
        const data = await response.json()
        const users = data.users || []
        const following = users.filter((u: User) => u.isFollowing)
        const notFollowing = users.filter((u: User) => !u.isFollowing)
        setFollowingUsers(following)
        setDiscoveryUsers(notFollowing)
      }
    } catch (err) {
      console.error("Search error:", err)
    } finally {
      setSearching(false)
    }
  }

  const handleFollow = async (userId: string) => {
    try {
      const response = await fetch("/api/users/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      if (response.ok) {
        const data = await response.json()
        setAllUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, isFollowing: data.following } : u
          )
        )
        setFollowingUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, isFollowing: data.following } : u
          )
        )
        setDiscoveryUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, isFollowing: data.following } : u
          )
        )
        setAllFollowingUsers((prev) =>
          data.following ? [...prev, ...allUsers.filter((u) => u.id === userId)] : prev.filter((u) => u.id !== userId)
        )
        setAllDiscoveryUsers((prev) =>
          !data.following ? [...prev, ...allUsers.filter((u) => u.id === userId)] : prev.filter((u) => u.id !== userId)
        )
      }
    } catch (err) {
      console.error("Follow error:", err)
      toast({ title: "Error", description: "Failed to follow user", variant: "destructive" })
    }
  }

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", "image")

      const response = await fetch("/api/messages/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setSelectedImage(data.url)
        toast({ title: "Success", description: "Image ready to send" })
      } else {
        toast({ title: "Error", description: "Failed to upload image", variant: "destructive" })
      }
    } catch (err) {
      console.error("Upload error:", err)
      toast({ title: "Error", description: "Failed to upload image", variant: "destructive" })
    } finally {
      setUploadingImage(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.onstart = () => {
        setIsRecording(true)
        setRecordingTime(0)
        const timer = setInterval(() => {
          setRecordingTime((prev) => {
            if (prev >= 300) {
              stopRecording()
              return 0
            }
            return prev + 1
          })
        }, 1000)
        ;(mediaRecorder as any).timerInterval = timer
      }

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        clearInterval((mediaRecorder as any).timerInterval)
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" })
        const audioUrl = URL.createObjectURL(audioBlob)
        setAudioPreview(audioUrl)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
    } catch (err) {
      toast({ title: "Error", description: "Unable to access microphone", variant: "destructive" })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const sendAudioMessage = async () => {
    if (!audioPreview || !selectedChat) return

    try {
      setSendingMessage(true)
      const blob = await fetch(audioPreview).then((r) => r.blob())
      const formData = new FormData()
      formData.append("file", blob, "audio.wav")
      formData.append("type", "audio")

      const uploadResponse = await fetch("/api/messages/upload", {
        method: "POST",
        body: formData,
      })

      if (uploadResponse.ok) {
        const uploadData = await uploadResponse.json()
        
        // Send with caption if provided, otherwise use default
        const messageContent = mediaCaption.trim() || "[Audio message]"
        
        const response = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matchId: selectedChat.id,
            content: messageContent,
            mediaUrl: uploadData.url,
            messageType: "audio",
          }),
        })

        if (response.ok) {
          const data = await response.json()
          const sentMessage = data.message
          
          // Track this message ID to prevent duplicate from realtime
          if (sentMessage?.id) {
            setJustSentMessageIds((prev) => new Set(prev).add(sentMessage.id))
            // Auto-remove from tracking after 2 seconds (same as sendMessage)
            setTimeout(() => {
              setJustSentMessageIds((prev) => {
                const newSet = new Set(prev)
                newSet.delete(sentMessage.id)
                return newSet
              })
            }, 2000)
          }
          
          // Add message to state with duplicate check
          setMessages((prev) => {
            // Check if message already exists to prevent duplication
            if (prev.some((m) => (m.id === sentMessage.id) || ((m as any).message_id === sentMessage.id))) {
              console.log("Message already in state, skipping")
              return prev
            }
            console.log("Adding audio message to state:", sentMessage.id)
            return [...prev, sentMessage]
          })
          setAudioPreview(null)
          setMediaCaption("")
          toast({ title: "Success", description: "Audio message sent" })
        } else {
          toast({ title: "Error", description: "Failed to send audio message", variant: "destructive" })
        }
      } else {
        toast({ title: "Error", description: "Failed to upload audio", variant: "destructive" })
      }
    } catch (err) {
      console.error("Send audio error:", err)
      toast({ title: "Error", description: "Failed to send audio", variant: "destructive" })
    } finally {
      setSendingMessage(false)
    }
  }

  const sendMessage = async (mediaUrl?: string, messageType?: string) => {
    if (!selectedChat || (!newMessage.trim() && !mediaUrl)) return

    try {
      setSendingMessage(true)
      
      // Combine caption with content - use fallback for empty media messages
      let messageContent: string
      if (mediaUrl) {
        // For media messages, use caption or fallback
        messageContent = mediaCaption.trim() || `[${messageType === "audio" ? "Audio" : messageType === "image" ? "Image" : "Media"}]
`
      } else {
        // For text messages, use the actual text
        messageContent = newMessage.trim()
      }
      
      const payload = {
        matchId: selectedChat.id,
        content: messageContent,
        mediaUrl: mediaUrl || null,
        messageType: messageType || "text",
      }

      console.log("Sending message payload:", payload)
      
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("API error:", response.status, errorData)
        toast({ title: "Error", description: `Failed to send message: ${response.status}`, variant: "destructive" })
        return
      }

      const data = await response.json()
      const sentMessage = data.message
      
      if (!sentMessage) {
        console.error("No message returned from API")
        toast({ title: "Error", description: "Message created but not returned", variant: "destructive" })
        return
      }
      
      // Mark this message ID to prevent duplicate from realtime subscription
      const msgId = sentMessage.id || (sentMessage as any).message_id
      if (msgId) {
        setJustSentMessageIds((prev) => new Set(prev).add(msgId))
        // Auto-remove from tracking after 2 seconds
        setTimeout(() => {
          setJustSentMessageIds((prev) => {
            const newSet = new Set(prev)
            newSet.delete(msgId)
            return newSet
          })
        }, 2000)
      }
      
      // Add message to state IMMEDIATELY for optimistic update
      setMessages((prev) => {
        // Check if message already exists to prevent duplication
        if (prev.some((m) => (m.id === msgId) || ((m as any).message_id === msgId))) {
          console.log("Message already in state, skipping")
          return prev
        }
        console.log("Adding message to state:", msgId)
        return [...prev, sentMessage]
      })
      setNewMessage("")
      setMediaCaption("")
      setSelectedImage(null)
      setAudioPreview(null)
      toast({ title: "Success", description: "Message sent" })
    } catch (err) {
      console.error("Send message error:", err)
      toast({ title: "Error", description: `Error: ${err instanceof Error ? err.message : "Unknown error"}`, variant: "destructive" })
    } finally {
      setSendingMessage(false)
    }
  }

  const submitReport = async () => {
    if (!reportingUser || !reportReason) return

    try {
      const response = await fetch("/api/reports/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportedType: "user",
          reportedId: reportingUser.userId,
          reason: reportReason,
          description: reportDescription,
        }),
      })

      if (response.ok) {
        toast({ title: "Success", description: "Report submitted successfully" })
        setReportModalOpen(false)
        setReportReason("")
        setReportDescription("")
        setReportingUser(null)
      } else {
        toast({ title: "Error", description: "Failed to submit report", variant: "destructive" })
      }
    } catch (err) {
      console.error("Report error:", err)
      toast({ title: "Error", description: "Failed to submit report", variant: "destructive" })
    }
  }

  const renderUserCard = (user: User) => (
    <div key={user.id} className="flex items-start gap-3 p-4 border-b border-border hover:bg-muted/50 transition-colors">
      <Link href={`/user/${user.id}`} className="flex-shrink-0">
        <Avatar className="w-12 h-12">
          <AvatarImage src={user.profile_picture || "/placeholder.svg"} />
          <AvatarFallback>{user.display_name?.[0] || "U"}</AvatarFallback>
        </Avatar>
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Link href={`/user/${user.id}`} className="font-semibold hover:underline">
            {user.display_name}
          </Link>
          {user.is_verified && <Badge variant="secondary" className="text-xs">Verified</Badge>}
          {user.is_premium && <Badge variant="secondary" className="text-xs bg-yellow-500/20">Premium</Badge>}
        </div>

        {user.bio && <p className="text-sm text-muted-foreground truncate">{user.bio}</p>}

        <div className="flex gap-3 text-xs text-muted-foreground mt-2">
          {user.city && <span>{user.city}</span>}
          <span>{user.followers_count} followers</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 flex-shrink-0">
        <Button size="sm" variant={user.isFollowing ? "outline" : "default"} onClick={() => handleFollow(user.id)}>
          {user.isFollowing ? "Following" : "Follow"}
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => {
            setSelectedChat({ 
              id: user.id, 
              name: user.display_name, 
              avatar: user.profile_picture, 
              lastMessage: "", 
              lastMessageTime: "", 
              unreadCount: 0, 
              online: false, 
              userId: user.id 
            })
            setModalOpen(false)
          }}
        >
          Message
        </Button>
      </div>
    </div>
  )

  const totalPages = Math.ceil(totalUsers / usersPerPage)

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Sidebar */}
      <div className={cn("border-r border-border flex flex-col bg-background transition-all", selectedChat ? "hidden md:w-80 md:flex lg:w-96" : "w-full md:w-80 lg:w-96 flex")}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">{t("messages")}</h1>
            <Button size="icon" className="rounded-full gradient-bg h-8 w-8" onClick={() => setModalOpen(true)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 rounded-full bg-muted/50 border-0"
            />
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
                onClick={() => {
                  setSelectedChat(conv)
                }}
                className={cn(
                  "flex items-center gap-3 p-4 cursor-pointer transition-colors hover:bg-muted/50 border-b border-border",
                  selectedChat?.id === conv.id && "bg-muted"
                )}
              >
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={conv.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{conv.name[0]}</AvatarFallback>
                  </Avatar>
                  {conv.online && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />}
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
      <div className={cn("flex flex-1 flex-col", selectedChat ? "flex" : "hidden md:flex")}>
        {selectedChat ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden mr-2 flex-shrink-0"
                  onClick={() => setSelectedChat(null)}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarImage src={selectedChat.avatar || "/placeholder.svg"} />
                  <AvatarFallback>{selectedChat.name[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{selectedChat.name}</p>
                  <p className="text-xs text-green-500">{selectedChat.online ? t("online") : t("offline")}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-muted transition-colors active:scale-95"
                  onClick={() => toast({ title: "Coming Soon", description: "Voice call feature coming soon" })}
                >
                  <Phone className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-muted transition-colors active:scale-95"
                  onClick={() => toast({ title: "Coming Soon", description: "Video call feature coming soon" })}
                >
                  <Video className="w-5 h-5" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push(`/user/${selectedChat.userId}`)}>
                      <User className="w-4 h-4 mr-2" />
                      View Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        setReportingUser(selectedChat)
                        setReportModalOpen(true)
                      }}
                      className="text-red-600"
                    >
                      <Flag className="w-4 h-4 mr-2" />
                      Report User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const senderId = msg.sender_id || msg.senderId
                  const messageType = msg.message_type || msg.messageType
                  const mediaUrl = msg.media_url || msg.mediaUrl
                  const createdAt = msg.created_at || msg.createdAt
                  const isOwn = senderId === currentUserId

                  return (
                    <div key={msg.id} className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[70%] px-4 py-2.5 rounded-2xl break-words",
                          isOwn
                            ? "gradient-bg text-white rounded-br-md"
                            : "bg-muted rounded-bl-md"
                        )}
                      >
                        {messageType === "image" && mediaUrl && (
                          <img src={mediaUrl} alt="attachment" className="max-w-[200px] rounded mb-2" />
                        )}
                        {messageType === "audio" && mediaUrl && (
                          <audio controls className="max-w-[200px] mb-2">
                            <source src={mediaUrl} type="audio/wav" />
                          </audio>
                        )}
                        {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                        <p className={cn("text-xs mt-1", isOwn ? "text-white/70" : "text-muted-foreground")}>
                          {new Date(createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Audio Preview */}
            {audioPreview && (
              <div className="p-4 border-t border-border bg-muted/50 space-y-3">
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setIsPlaying(!isPlaying)}>
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <audio src={audioPreview} onEnded={() => setIsPlaying(false)} autoPlay={isPlaying} />
                  <span className="text-sm text-muted-foreground flex-1">Audio ({recordingTime}s)</span>
                  <Button size="sm" variant="outline" onClick={() => setAudioPreview(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <Input
                  value={mediaCaption}
                  onChange={(e) => setMediaCaption(e.target.value)}
                  placeholder="Add a description... (optional)"
                  className="text-sm rounded-full bg-background border border-border"
                  maxLength={500}
                />
                <div className="flex justify-end">
                  <Button size="sm" className="gradient-bg" onClick={sendAudioMessage} disabled={sendingMessage}>
                    {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}

            {/* Image Preview */}
            {selectedImage && (
              <div className="p-4 border-t border-border bg-muted/50 space-y-3">
                <img src={selectedImage} alt="preview" className="w-20 h-20 rounded object-cover" />
                <Input
                  value={mediaCaption}
                  onChange={(e) => setMediaCaption(e.target.value)}
                  placeholder="Add a caption... (optional)"
                  className="text-sm rounded-full bg-background border border-border"
                  maxLength={500}
                />
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="outline" onClick={() => {
                    setSelectedImage(null)
                    setMediaCaption("")
                  }}>
                    <X className="w-4 h-4" />
                  </Button>
                  <Button size="sm" className="gradient-bg" onClick={() => sendMessage(selectedImage, "image")} disabled={sendingMessage}>
                    {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}

            {/* Input - Hidden when showing media preview */}
            {!selectedImage && !audioPreview && (
            <div className="p-4 border-t border-border bg-background">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-muted-foreground hover:bg-muted active:scale-95 flex-shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleImageUpload(e.target.files[0])
                    }
                  }}
                />

                <div className="flex-1 relative min-w-0">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && newMessage.trim() && !sendingMessage) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                    placeholder="Type a message..."
                    className="pr-10 rounded-full bg-muted/50 border-0 text-base"
                    disabled={sendingMessage}
                  />
                  <div className="absolute right-1 top-1/2 -translate-y-1/2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 hover:bg-transparent active:scale-95"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                      <Smile className="w-5 h-5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "rounded-full active:scale-95 flex-shrink-0",
                    isRecording ? "bg-red-500 text-white" : "text-muted-foreground hover:bg-muted"
                  )}
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={audioPreview !== null}
                >
                  <Mic className="w-5 h-5" />
                </Button>

                <Button
                  size="icon"
                  className="rounded-full gradient-bg hover:opacity-90 active:scale-95 flex-shrink-0"
                  onClick={() => sendMessage()}
                  disabled={sendingMessage || (!newMessage.trim() && !selectedImage && !audioPreview)}
                >
                  {sendingMessage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
              </div>

              {showEmojiPicker && (
                <div className="mt-3 p-3 bg-muted rounded-lg grid grid-cols-8 gap-2">
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        setNewMessage((prev) => prev + emoji)
                        setShowEmojiPicker(false)
                      }}
                      className="text-xl hover:scale-125 transition-transform cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {isRecording && (
                <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                  <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                  Recording... {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, "0")}
                </div>
              )}
            </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p>Select a conversation to view messages</p>
          </div>
        )}
      </div>

      {/* Discovery Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Discover People</DialogTitle>
          </DialogHeader>

          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search people..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  if (e.target.value) {
                    handleSearch(e.target.value)
                  } else {
                    fetchAllUsers(1, "")
                  }
                }}
                className="pl-10 rounded-full bg-muted/50 border-0"
              />
            </div>
          </div>

          <Tabs value={searchTab} onValueChange={(v) => setSearchTab(v as "following" | "discover")} className="flex-1 flex flex-col">
            <TabsList className="w-full rounded-none border-b border-border bg-background">
              <TabsTrigger value="following" className="flex-1">
                Following {allFollowingUsers.length > 0 && `(${allFollowingUsers.length})`}
              </TabsTrigger>
              <TabsTrigger value="discover" className="flex-1">
                Discover {allDiscoveryUsers.length > 0 && `(${allDiscoveryUsers.length})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="following" className="flex-1 overflow-y-auto m-0">
              {searching ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : allFollowingUsers.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                  <p>No one in your following</p>
                </div>
              ) : (
                allFollowingUsers.map((user) => renderUserCard(user))
              )}
            </TabsContent>

            <TabsContent value="discover" className="flex-1 overflow-y-auto m-0">
              {searching ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : allDiscoveryUsers.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                  <p>No one to discover</p>
                </div>
              ) : (
                allDiscoveryUsers.map((user) => renderUserCard(user))
              )}
            </TabsContent>
          </Tabs>

          {!searchQuery && totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => fetchAllUsers(currentPage - 1, "")}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => fetchAllUsers(currentPage + 1, "")}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Report Modal */}
      <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Report User</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {reportingUser && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Avatar>
                  <AvatarImage src={reportingUser.avatar} />
                  <AvatarFallback>{reportingUser.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{reportingUser.name}</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Reason *</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
              >
                <option value="">Select a reason</option>
                <option value="Harassment">Harassment</option>
                <option value="Inappropriate Content">Inappropriate Content</option>
                <option value="Spam">Spam</option>
                <option value="Offensive Language">Offensive Language</option>
                <option value="Scam">Scam</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description (Optional)</label>
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Please provide more details..."
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm h-24 resize-none"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setReportModalOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={submitReport} className="flex-1 gradient-bg" disabled={!reportReason}>
                Submit Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
