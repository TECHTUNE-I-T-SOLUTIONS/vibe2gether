"use client"

import { useState } from "react"
import Image from "next/image"
import { Star, Check, X, Eye, Clock, ShoppingBag, Calendar, Wrench, Filter, Search } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useI18n } from "@/lib/i18n/context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

const featuredRequests = [
  {
    id: "1",
    user: { name: "Fashion Store", avatar: "/placeholder.svg?height=60&width=60", email: "fashion@store.com" },
    type: "Product",
    title: "Valentine's Day Collection",
    description: "Premium romantic gifts and accessories for couples. High-quality items with fast shipping worldwide.",
    image: "/placeholder.svg?height=200&width=300",
    status: "pending",
    date: "Dec 8, 2025",
    views: 0,
  },
  {
    id: "2",
    user: { name: "Romantic Gifts Co", avatar: "/placeholder.svg?height=60&width=60", email: "contact@romantic.co" },
    type: "Product",
    title: "Couple's Experience Box",
    description: "Curated monthly box with date night essentials, activities, and treats for couples.",
    image: "/placeholder.svg?height=200&width=300",
    status: "pending",
    date: "Dec 8, 2025",
    views: 0,
  },
  {
    id: "3",
    user: { name: "Love Letters Inc", avatar: "/placeholder.svg?height=60&width=60", email: "hello@loveletters.inc" },
    type: "Service",
    title: "Personalized Love Letter Service",
    description: "Professional writers craft beautiful, personalized love letters for any occasion.",
    image: "/placeholder.svg?height=200&width=300",
    status: "pending",
    date: "Dec 7, 2025",
    views: 0,
  },
  {
    id: "4",
    user: { name: "Date Night Box", avatar: "/placeholder.svg?height=60&width=60", email: "info@datenightbox.com" },
    type: "Product",
    title: "At-Home Date Night Kit",
    description: "Everything you need for a perfect date night at home. Games, snacks, and activities included.",
    image: "/placeholder.svg?height=200&width=300",
    status: "approved",
    date: "Dec 6, 2025",
    views: 1245,
  },
  {
    id: "5",
    user: { name: "Couples Retreat", avatar: "/placeholder.svg?height=60&width=60", email: "book@couplesretreat.com" },
    type: "Event",
    title: "Weekend Couples Retreat",
    description: "Luxurious weekend getaway for couples featuring spa treatments, workshops, and romantic dinners.",
    image: "/placeholder.svg?height=200&width=300",
    status: "rejected",
    date: "Dec 5, 2025",
    views: 0,
  },
]

export default function FeaturedRequestsPage() {
  const { t } = useI18n()
  const [requests, setRequests] = useState(featuredRequests)
  const [selectedRequest, setSelectedRequest] = useState<(typeof featuredRequests)[0] | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  const handleApprove = (id: string) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "approved" } : r)))
  }

  const handleReject = (id: string) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "rejected" } : r)))
    setRejectReason("")
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Product":
        return <ShoppingBag className="w-4 h-4" />
      case "Service":
        return <Wrench className="w-4 h-4" />
      case "Event":
        return <Calendar className="w-4 h-4" />
      default:
        return <Star className="w-4 h-4" />
    }
  }

  const pendingCount = requests.filter((r) => r.status === "pending").length
  const approvedCount = requests.filter((r) => r.status === "approved").length
  const rejectedCount = requests.filter((r) => r.status === "rejected").length

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2">
            <Star className="w-8 h-8 text-accent" />
            {t("featuredRequests")}
          </h1>
          <p className="text-muted-foreground">Review and manage product/service feature requests from users</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search requests..." className="pl-10 w-64 rounded-full" />
          </div>
          <Button variant="outline" className="rounded-full bg-transparent">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">{t("pending")}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Check className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{approvedCount}</p>
              <p className="text-sm text-muted-foreground">{t("approved")}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
              <X className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{rejectedCount}</p>
              <p className="text-sm text-muted-foreground">{t("rejected")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-full">
          <TabsTrigger value="pending" className="rounded-full">
            {t("pending")} ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="approved" className="rounded-full">
            {t("approved")} ({approvedCount})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="rounded-full">
            {t("rejected")} ({rejectedCount})
          </TabsTrigger>
          <TabsTrigger value="all" className="rounded-full">
            All ({requests.length})
          </TabsTrigger>
        </TabsList>

        {["pending", "approved", "rejected", "all"].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            {requests
              .filter((r) => tab === "all" || r.status === tab)
              .map((request) => (
                <Card key={request.id} className="border-border/50 overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    {/* Image */}
                    <div className="relative w-full md:w-72 h-48 md:h-auto">
                      <Image
                        src={request.image || "/placeholder.svg"}
                        alt={request.title}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={request.user.avatar || "/placeholder.svg"} />
                            <AvatarFallback>{request.user.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{request.user.name}</p>
                            <p className="text-sm text-muted-foreground">{request.user.email}</p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            request.status === "pending"
                              ? "secondary"
                              : request.status === "approved"
                                ? "default"
                                : "destructive"
                          }
                          className={request.status === "approved" ? "bg-green-500" : ""}
                        >
                          {t(request.status)}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="gap-1">
                          {getTypeIcon(request.type)}
                          {request.type}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{request.date}</span>
                        {request.views > 0 && (
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {request.views.toLocaleString()} views
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-semibold mb-2">{request.title}</h3>
                      <p className="text-muted-foreground mb-4">{request.description}</p>

                      {request.status === "pending" && (
                        <div className="flex items-center gap-2">
                          <Button
                            className="rounded-full bg-green-500 hover:bg-green-600"
                            onClick={() => handleApprove(request.id)}
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                className="rounded-full text-destructive hover:text-destructive bg-transparent"
                              >
                                <X className="w-4 h-4 mr-2" />
                                Reject
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reject Request</DialogTitle>
                                <DialogDescription>
                                  Please provide a reason for rejecting this feature request.
                                </DialogDescription>
                              </DialogHeader>
                              <Textarea
                                placeholder="Enter rejection reason..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="min-h-24"
                              />
                              <DialogFooter>
                                <Button
                                  variant="destructive"
                                  className="rounded-full"
                                  onClick={() => handleReject(request.id)}
                                >
                                  Confirm Rejection
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <Button variant="ghost" className="rounded-full">
                            <Eye className="w-4 h-4 mr-2" />
                            Preview
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}

            {requests.filter((r) => tab === "all" || r.status === tab).length === 0 && (
              <Card className="border-border/50">
                <CardContent className="p-12 text-center">
                  <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">No {tab} requests</p>
                  <p className="text-muted-foreground">There are no {tab} feature requests at this time.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
