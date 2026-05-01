"use client"

import { useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, Mail, Phone, Copy, ExternalLink, Loader2, AlertCircle, Calendar, Clock, Users, MessageSquare, Share2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { PaystackPaymentModal } from "@/components/paystack-payment-modal"

interface EventDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  event: any
  creator: any
}

export function EventDetailsModal({ isOpen, onClose, event, creator }: EventDetailsModalProps) {
  const { toast } = useToast()
  const { data: session } = useSession()
  const router = useRouter()
  const [showPayment, setShowPayment] = useState(false)
  const [hasAccessDetails, setHasAccessDetails] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [registering, setRegistering] = useState(false)

  const checkAccessDetails = async () => {
    if (!session?.user?.id) {
      router.push("/login")
      return
    }

    try {
      setVerifying(true)
      const response = await fetch(`/api/transactions/check-access?itemId=${event.id}&itemType=event`)
      if (response.ok) {
        const data = await response.json()
        if (data.hasAccess) {
          setHasAccessDetails(true)
        } else {
          setShowPayment(true)
        }
      }
    } catch (error) {
      console.error("Failed to check access:", error)
      toast({
        title: "Error",
        description: "Failed to check access",
        variant: "destructive",
      })
    } finally {
      setVerifying(false)
    }
  }

  const handleMessageCreator = async () => {
    if (!session?.user?.id) {
      router.push("/login")
      return
    }

    // Guard against null creator
    if (!creator || !creator.id) {
      toast({
        title: "Error",
        description: "Organizer information not available",
        variant: "destructive",
      })
      return
    }

    // Navigate to messages with event creator
    router.push(`/dashboard/messages?userId=${creator.id}`)
    onClose()
  }

  const handleRegister = async () => {
    if (!session?.user?.id) {
      router.push("/login")
      return
    }

    try {
      setRegistering(true)
      // Check if user already registered
      const checkResponse = await fetch(`/api/events/${event.id}/check-registration`)
      if (checkResponse.ok) {
        const data = await checkResponse.json()
        if (data.registered) {
          toast({
            title: "Already Registered",
            description: "You are already registered for this event",
          })
          return
        }
      }

      // Register for event
      const response = await fetch(`/api/events/${event.id}/register`, {
        method: "POST",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "You have been registered for the event",
        })
        onClose()
      }
    } catch (error) {
      console.error("Failed to register:", error)
      toast({
        title: "Error",
        description: "Failed to register for event",
        variant: "destructive",
      })
    } finally {
      setRegistering(false)
    }
  }

  const handlePaymentSuccess = () => {
    setHasAccessDetails(true)
    setShowPayment(false)
    toast({
      title: "Success",
      description: "Payment verified! You can now book a table or get more details.",
    })
  }

  const isRestaurant = event?.type === "restaurant" || event?.type === "Food & Drink" || event?.category === "restaurant" || "Food & Drink" || event?.title.toLowerCase().includes("restaurant")
  const bookingPrice = event?.ticket_price || 0
  const USD_TO_NGN = 1450
  const USD_TO_XAF = 605
  const priceDisplay = event?.ticket_price ? (
    <div className="flex flex-col items-end">
      <span>₦{Math.round(bookingPrice * USD_TO_NGN).toLocaleString()}</span>
      <span className="text-sm text-muted-foreground font-normal">
        ${bookingPrice} • XAF {Math.round(bookingPrice * USD_TO_XAF).toLocaleString()}
      </span>
    </div>
  ) : "Free"
  const eventDate = event ? new Date(event.event_date) : new Date()

  if (!event) {
    return null
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{event.title}</DialogTitle>
            <DialogDescription>{event.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Image */}
            {event.thumbnail_url && (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
                <Image
                  src={event.thumbnail_url || "/placeholder.svg"}
                  alt={event.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* Category, Date, Location */}
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {event.category && (
                  <Badge variant="outline" className="capitalize">
                    {event.category}
                  </Badge>
                )}
                {event.type && (
                  <Badge variant="secondary" className="capitalize">
                    {event.type}
                  </Badge>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {eventDate.toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {eventDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {event.location_name || "Location TBD"}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  {event.registered_count || 0} registered
                </div>
              </div>
            </div>

            {/* Price */}
            {(event.ticket_price || isRestaurant) && (
              <div className="flex items-center justify-between p-4 bg-accent/10 rounded-lg">
                <span className="font-semibold">
                  {isRestaurant ? "Booking Fee:" : "Ticket Price:"}
                </span>
                <div className="text-2xl font-bold gradient-text">{priceDisplay}</div>
              </div>
            )}

            {/* Creator Info */}
            {creator ? (
              <Card className="border-border/50 bg-card/50">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3">Organizer</h3>
                  <div className="flex items-start gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={creator.profile_picture || "/placeholder.svg"} />
                      <AvatarFallback>{creator.full_name?.[0] || "O"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{creator.full_name || "Unknown Organizer"}</p>
                      {(creator.city || creator.country) && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {[creator.city, creator.country].filter(Boolean).join(", ")}
                        </p>
                      )}

                      {hasAccessDetails ? (
                        <div className="space-y-2 text-sm">
                          {creator.email && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="w-4 h-4" />
                              <span>{creator.email}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(creator.email)
                                  toast({ title: "Copied", description: "Email copied to clipboard" })
                                }}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                          {creator.mobile_number && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="w-4 h-4" />
                              <span>{creator.mobile_number}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(creator.mobile_number)
                                  toast({ title: "Copied", description: "Phone copied to clipboard" })
                                }}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <Alert className="border-amber-200 bg-amber-50 text-amber-900">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Price: {event?.ticket_price ? `₦${Math.round(bookingPrice * USD_TO_NGN).toLocaleString()}` : "Free"}, <br /> 
                            Message {creator.full_name} to {isRestaurant ? "book a ticket" : "register"} and get organizer details
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Alert className="border-amber-200 bg-amber-50 text-amber-900">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Organizer information unavailable
                </AlertDescription>
              </Alert>
            )}

            {/* Details */}
            {event.details && (
              <div className="space-y-2">
                <h3 className="font-semibold">Event Details</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{event.details}</p>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2 flex-col sm:flex-row">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                const url = `${process.env.NEXT_PUBLIC_APP_BASE_URL || window.location.origin}/events?event_id=${event.id}`;
                navigator.clipboard.writeText(url);
                toast({ title: "Link Copied", description: "Event link has been copied to clipboard." });
              }}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            
            {/* Message Button - Only show if creator exists and user is logged in */}
            {session?.user?.id && creator && creator.id && (
              <Button 
                className="gap-2 rounded-full gradient-bg"
                onClick={handleMessageCreator}
              >
                <MessageSquare className="w-4 h-4" />
                Message
              </Button>
            )}

            {/* Register Button - Payment is handled by organizer */}
            {!session?.user?.id ? (
              <Button className="rounded-full gradient-bg" onClick={() => router.push("/login")}>
                Login to {isRestaurant ? "Book Ticket" : "Register"}
              </Button>
            ) : (
              <Button
                className="rounded-full gradient-bg"
                onClick={() => {
                  onClose()
                  router.push("/dashboard/events/manage")
                }}
              >
                {isRestaurant ? "Book Ticket" : "Book Ticket"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <PaystackPaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        amount={bookingPrice}
        currency={event.currency || "NGN"}
        itemType="event"
        itemData={{
          id: event.id,
          title: `${isRestaurant ? "Book Table" : "Register"}: ${event.title}`,
        }}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </>
  )
}
