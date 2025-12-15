"use client"
import { useState, useEffect } from "react"
import { Heart, MessageCircle, Users, Eye, Coins, Star, Gift, Calendar, CheckCheck, Bell, Trash2, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useI18n } from "@/lib/i18n/context"

interface NotificationItem {
  id: string
  type: string
  user_id: string
  actor_name: string
  actor_image: string
  title?: string
  message?: string
  created_at: string
  read: boolean
}

const getNotificationMessage = (notification: NotificationItem): string => {
  // Use the actual message from the notification if available
  if (notification.message) {
    return notification.message
  }
  
  // Fallback to generic messages based on type
  switch (notification.type) {
    case "like":
      return `${notification.actor_name} liked your post`
    case "follow":
      return `${notification.actor_name} started following you`
    case "comment":
      return `${notification.actor_name} commented on your post`
    case "view":
      return `${notification.actor_name} viewed your post`
    case "match":
      return `You have a new match!`
    case "message":
      return `${notification.actor_name} sent you a message`
    case "save":
      return `${notification.actor_name} saved your post`
    case "new_post":
      return `${notification.actor_name} posted something new`
    case "coins_earned":
      return `You earned coins!`
    case "system":
      return notification.title || "System notification"
    default:
      return `${notification.actor_name} interacted with you`
  }
}

const getIcon = (type: string) => {
  switch (type) {
    case "like":
      return <Heart className="w-5 h-5 text-primary fill-primary" />
    case "follow":
      return <Users className="w-5 h-5 text-secondary" />
    case "message":
      return <MessageCircle className="w-5 h-5 text-accent" />
    case "view":
      return <Eye className="w-5 h-5 text-muted-foreground" />
    case "match":
      return <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
    case "gift":
      return <Gift className="w-5 h-5 text-purple-500" />
    case "event":
      return <Calendar className="w-5 h-5 text-green-500" />
    case "premium":
      return <Star className="w-5 h-5 text-accent fill-accent" />
    default:
      return <Bell className="w-5 h-5" />
  }
}

export default function NotificationsPage() {
  const { t } = useI18n()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchNotifications() {
      try {
        setLoading(true)
        const response = await fetch("/api/notifications")
        if (!response.ok) throw new Error("Failed to fetch notifications")
        const data = await response.json()
        setNotifications(data.notifications || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        console.error("Fetch error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchNotifications()
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{t("notifications")}</h1>
          <p className="text-muted-foreground">Stay updated with your activity</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-full bg-transparent">
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
          <Button variant="outline" className="rounded-full bg-transparent text-destructive hover:text-destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold">{unreadCount}</p>
              <p className="text-sm text-muted-foreground">Unread</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center">
              <Heart className="w-6 h-6 text-pink-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{notifications.filter((n) => n.type === "like").length}</p>
              <p className="text-sm text-muted-foreground">New Likes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Coins className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">+{notifications.filter((n) => n.type === "coins_earned").length}</p>
              <p className="text-sm text-muted-foreground">Coins Earned</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-full">
          <TabsTrigger value="all" className="rounded-full">
            All
          </TabsTrigger>
          <TabsTrigger value="likes" className="rounded-full">
            Likes
          </TabsTrigger>
          <TabsTrigger value="follows" className="rounded-full">
            Follows
          </TabsTrigger>
          <TabsTrigger value="messages" className="rounded-full">
            Messages
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="p-8 text-center">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No notifications yet</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/50">
              <CardContent className="p-0 divide-y divide-border">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors ${!notification.read ? "bg-primary/5" : ""}`}
                  >
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={notification.actor_image || "/placeholder.svg"} />
                        <AvatarFallback>{notification.actor_name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background flex items-center justify-center border border-border">
                        {getIcon(notification.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`${!notification.read ? "font-semibold" : ""}`}>
                        {notification.title || notification.message || getNotificationMessage(notification)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {!notification.read && <div className="w-2 h-2 rounded-full gradient-bg" />}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="likes">
          <Card className="border-border/50">
            <CardContent className="p-0 divide-y divide-border">
              {notifications.filter((n) => n.type === "like").length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p>No likes yet</p>
                </div>
              ) : (
                notifications
                  .filter((n) => n.type === "like")
                  .map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors ${!notification.read ? "bg-primary/5" : ""}`}
                    >
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={notification.actor_image || "/placeholder.svg"} />
                        <AvatarFallback>{notification.actor_name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p>
                          {notification.message || getNotificationMessage(notification)}
                        </p>
                        <p className="text-sm text-muted-foreground">{new Date(notification.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="follows">
          <Card className="border-border/50">
            <CardContent className="p-0 divide-y divide-border">
              {notifications.filter((n) => n.type === "follow").length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p>No new follows yet</p>
                </div>
              ) : (
                notifications
                  .filter((n) => n.type === "follow")
                  .map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors ${!notification.read ? "bg-primary/5" : ""}`}
                    >
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={notification.actor_image || "/placeholder.svg"} />
                        <AvatarFallback>{notification.actor_name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p>
                          {notification.message || getNotificationMessage(notification)}
                        </p>
                        <p className="text-sm text-muted-foreground">{new Date(notification.created_at).toLocaleDateString()}</p>
                      </div>
                      <Button size="sm" className="rounded-full gradient-bg">
                        Follow Back
                      </Button>
                    </div>
                  ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages">
          <Card className="border-border/50">
            <CardContent className="p-0 divide-y divide-border">
              {notifications.filter((n) => n.type === "message").length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p>No message notifications yet</p>
                </div>
              ) : (
                notifications
                  .filter((n) => n.type === "message")
                  .map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors ${!notification.read ? "bg-primary/5" : ""}`}
                    >
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={notification.actor_image || "/placeholder.svg"} />
                        <AvatarFallback>{notification.actor_name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p>
                          {notification.message || getNotificationMessage(notification)}
                        </p>
                        <p className="text-sm text-muted-foreground">{new Date(notification.created_at).toLocaleDateString()}</p>
                      </div>
                      <Button size="sm" variant="outline" className="rounded-full bg-transparent">
                        Reply
                      </Button>
                    </div>
                  ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
