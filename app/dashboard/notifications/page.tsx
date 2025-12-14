"use client"
import { Heart, MessageCircle, Users, Eye, Coins, Star, Gift, Calendar, CheckCheck, Bell, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useI18n } from "@/lib/i18n/context"

const notifications = [
  {
    id: 1,
    type: "like",
    user: { name: "Emma Rodriguez", avatar: "/emma-woman-avatar.jpg" },
    message: "liked your profile",
    time: "2 min ago",
    read: false,
    coins: 1,
  },
  {
    id: 2,
    type: "follow",
    user: { name: "James Chen", avatar: "/placeholder.svg?height=40&width=40" },
    message: "started following you",
    time: "15 min ago",
    read: false,
    coins: 2,
  },
  {
    id: 3,
    type: "message",
    user: { name: "Sofia Martinez", avatar: "/placeholder.svg?height=40&width=40" },
    message: "sent you a message",
    time: "1 hour ago",
    read: false,
    coins: 0,
  },
  {
    id: 4,
    type: "view",
    user: { name: "Yuki Tanaka", avatar: "/placeholder.svg?height=40&width=40" },
    message: "viewed your profile",
    time: "2 hours ago",
    read: true,
    coins: 0,
  },
  {
    id: 5,
    type: "match",
    user: { name: "Isabella", avatar: "/placeholder.svg?height=40&width=40" },
    message: "You have a new match!",
    time: "3 hours ago",
    read: true,
    coins: 5,
  },
  {
    id: 6,
    type: "gift",
    user: { name: "Marcus Williams", avatar: "/placeholder.svg?height=40&width=40" },
    message: "sent you a virtual gift",
    time: "5 hours ago",
    read: true,
    coins: 10,
  },
  {
    id: 7,
    type: "event",
    user: { name: "System", avatar: "/v2g-logo.png" },
    message: "Upcoming event: Singles Mixer this Saturday!",
    time: "1 day ago",
    read: true,
    coins: 0,
  },
  {
    id: 8,
    type: "premium",
    user: { name: "System", avatar: "/v2g-logo.png" },
    message: "Someone special liked you! Upgrade to see who",
    time: "2 days ago",
    read: true,
    coins: 0,
  },
]

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
              <p className="text-2xl font-bold">+{notifications.reduce((acc, n) => acc + n.coins, 0)}</p>
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
          <Card className="border-border/50">
            <CardContent className="p-0 divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors ${!notification.read ? "bg-primary/5" : ""}`}
                >
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={notification.user.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{notification.user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background flex items-center justify-center border border-border">
                      {getIcon(notification.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`${!notification.read ? "font-semibold" : ""}`}>
                      <span className="font-medium">{notification.user.name}</span>{" "}
                      <span className="text-muted-foreground">{notification.message}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">{notification.time}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {notification.coins > 0 && (
                      <Badge variant="outline" className="text-accent border-accent/30 bg-accent/10">
                        <Coins className="w-3 h-3 mr-1" />+{notification.coins}
                      </Badge>
                    )}
                    {!notification.read && <div className="w-2 h-2 rounded-full gradient-bg" />}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="likes">
          <Card className="border-border/50">
            <CardContent className="p-0 divide-y divide-border">
              {notifications
                .filter((n) => n.type === "like")
                .map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors ${!notification.read ? "bg-primary/5" : ""}`}
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={notification.user.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{notification.user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p>
                        <span className="font-medium">{notification.user.name}</span> {notification.message}
                      </p>
                      <p className="text-sm text-muted-foreground">{notification.time}</p>
                    </div>
                    {notification.coins > 0 && (
                      <Badge variant="outline" className="text-accent border-accent/30">
                        +{notification.coins} coins
                      </Badge>
                    )}
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="follows">
          <Card className="border-border/50">
            <CardContent className="p-0 divide-y divide-border">
              {notifications
                .filter((n) => n.type === "follow")
                .map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors ${!notification.read ? "bg-primary/5" : ""}`}
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={notification.user.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{notification.user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p>
                        <span className="font-medium">{notification.user.name}</span> {notification.message}
                      </p>
                      <p className="text-sm text-muted-foreground">{notification.time}</p>
                    </div>
                    <Button size="sm" className="rounded-full gradient-bg">
                      Follow Back
                    </Button>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages">
          <Card className="border-border/50">
            <CardContent className="p-0 divide-y divide-border">
              {notifications
                .filter((n) => n.type === "message")
                .map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors ${!notification.read ? "bg-primary/5" : ""}`}
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={notification.user.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{notification.user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p>
                        <span className="font-medium">{notification.user.name}</span> {notification.message}
                      </p>
                      <p className="text-sm text-muted-foreground">{notification.time}</p>
                    </div>
                    <Button size="sm" variant="outline" className="rounded-full bg-transparent">
                      Reply
                    </Button>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
