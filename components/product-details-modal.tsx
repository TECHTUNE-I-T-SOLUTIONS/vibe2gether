"use client"

import { useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, Mail, Phone, Copy, ExternalLink, Loader2, AlertCircle, ChevronLeft, ChevronRight, MessageSquare, ShoppingCart } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { PaystackPaymentModal } from "@/components/paystack-payment-modal"

interface ProductDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  product: any
  seller: any
}

export function ProductDetailsModal({ isOpen, onClose, product, seller }: ProductDetailsModalProps) {
  const { toast } = useToast()
  const { data: session } = useSession()
  const router = useRouter()
  const [showPayment, setShowPayment] = useState(false)
  const [paymentType, setPaymentType] = useState<"contact" | "buy">("contact")
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [hasAccessDetails, setHasAccessDetails] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const isOwnProduct = product?.seller_id === session?.user?.id

  // Check if user has already paid for this
  const checkAccessDetails = async () => {
    if (!session?.user?.id) {
      router.push("/login")
      return
    }

    try {
      setVerifying(true)
      const response = await fetch(`/api/transactions/check-access?itemId=${product.id}&itemType=product`)
      if (response.ok) {
        const data = await response.json()
        if (data.hasAccess) {
          setHasAccessDetails(true)
        } else {
          setPaymentType("contact")
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

  const handleContactSeller = async () => {
    if (!session?.user?.id) {
      router.push("/login")
      return
    }

    if (!hasAccessDetails) {
      checkAccessDetails()
      return
    }

    // Copy seller contact and navigate to messaging
    navigator.clipboard.writeText(seller?.email || "")
    toast({
      title: "Copied",
      description: "Seller email copied to clipboard",
    })

    // Navigate to messages with seller
    router.push(`/messages?userId=${seller.id}`)
  }

  const handleBuyProduct = () => {
    if (!session?.user?.id) {
      router.push("/login")
      return
    }

    setPaymentType("buy")
    setShowPayment(true)
  }

  const handlePaymentSuccess = () => {
    if (paymentType === "contact") {
      setHasAccessDetails(true)
      toast({
        title: "Success",
        description: "Payment verified! You can now contact the seller.",
      })
    } else {
      toast({
        title: "Success",
        description: "Payment successful! Product purchased.",
      })
    }
    setShowPayment(false)
  }

  // Image navigation
  const nextImage = () => {
    if (product?.media && currentImageIndex < product.media.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1)
    }
  }

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1)
    }
  }

  // Determine price display format
  const priceDisplay = !product ? "" : product.currency === "NGN" ? `₦${product.price.toLocaleString()}` : `$${product.price}`

  if (!product) {
    return null
  }

  const currentImage = product.media?.[currentImageIndex]
  const totalImages = product.media?.length || 0

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{product.title}</DialogTitle>
            <DialogDescription>{product.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Images with Navigation */}
            {product.media && product.media.length > 0 && (
              <div className="space-y-2">
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted group">
                  <Image
                    src={currentImage?.url || currentImage || "/placeholder.svg"}
                    alt={`${product.title} - ${currentImageIndex + 1} of ${totalImages}`}
                    fill
                    className="object-cover"
                  />
                  
                  {/* Image Navigation Buttons */}
                  {totalImages > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        disabled={currentImageIndex === 0}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        disabled={currentImageIndex === totalImages - 1}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Image Counter */}
                  {totalImages > 1 && (
                    <Badge className="absolute bottom-4 right-4 bg-black/50 text-white border-0">
                      {currentImageIndex + 1} of {totalImages}
                    </Badge>
                  )}
                </div>
                
                {/* Thumbnail Indicator */}
                {totalImages > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {product.media.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-12 h-12 rounded-lg border-2 overflow-hidden flex-shrink-0 transition-all ${
                          index === currentImageIndex ? "border-primary" : "border-border opacity-60 hover:opacity-100"
                        }`}
                      >
                        <Image
                          src={_?.url || _ || "/placeholder.svg"}
                          alt={`Thumbnail ${index + 1}`}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Category & Location */}
            <div className="flex flex-wrap gap-2">
              {product.category && (
                <Badge variant="outline" className="capitalize">
                  {product.category}
                </Badge>
              )}
              {product.location_name && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {product.location_name}
                </Badge>
              )}
            </div>

            {/* Price */}
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold gradient-text">{priceDisplay}</div>
              {product.currency === "USD" && (
                <span className="text-sm text-muted-foreground">≈ ₦{(product.price * 1670).toLocaleString()}</span>
              )}
            </div>

            {/* Seller Info */}
            {seller ? (
              <Card className="border-border/50 bg-card/50">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <span>Seller Information</span>
                  </h3>
                  <div className="flex items-start gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={seller.profile_picture || "/placeholder.svg"} />
                      <AvatarFallback>{seller.full_name?.[0] || "S"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{seller.full_name || "Unknown Seller"}</p>
                      <p className="text-sm text-muted-foreground mb-2">{seller.city || "N/A"}, {seller.country || "N/A"}</p>
                      
                      {hasAccessDetails ? (
                        <div className="space-y-2 text-sm">
                          {seller.email && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="w-4 h-4" />
                              <span>{seller.email}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(seller.email)
                                  toast({ title: "Copied", description: "Email copied to clipboard" })
                                }}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                          {seller.mobile_number && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="w-4 h-4" />
                              <span>{seller.mobile_number}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(seller.mobile_number)
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
                            Pay ₦1,500 to unlock seller details and send a message
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
                  Seller information unavailable
                </AlertDescription>
              </Alert>
            )}

            {/* Details Section */}
            {product.details && (
              <div className="space-y-2">
                <h3 className="font-semibold">Details</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{product.details}</p>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            
            {!session?.user?.id ? (
              <Button className="rounded-full gradient-bg gap-2" onClick={() => router.push("/login")}>
                <ShoppingCart className="w-4 h-4" />
                Login to Buy
              </Button>
            ) : isOwnProduct ? (
              <div className="text-sm text-muted-foreground">This is your product</div>
            ) : (
              <>
                {/* Message Button (only if not own product) */}
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={handleContactSeller}
                  disabled={verifying}
                >
                  <MessageSquare className="w-4 h-4" />
                  {verifying ? "Checking..." : hasAccessDetails ? "Message Seller" : "Message (₦1,500)"}
                </Button>

                {/* Buy Button */}
                <Button 
                  className="rounded-full gradient-bg gap-2"
                  onClick={handleBuyProduct}
                >
                  <ShoppingCart className="w-4 h-4" />
                  Buy {priceDisplay}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <PaystackPaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        amount={paymentType === "contact" ? 1500 : product.currency === "USD" ? Math.round(product.price * 1670) : product.price}
        currency="NGN"
        itemType="product"
        itemData={{
          id: product.id,
          title: paymentType === "contact" ? `Contact Seller: ${product.title}` : `Buy: ${product.title}`,
        }}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </>
  )
}
