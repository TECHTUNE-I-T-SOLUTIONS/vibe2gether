"use client"

import { useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, Mail, Phone, Copy, AlertCircle, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

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
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const isOwnProduct = product?.user_id === session?.user?.id
  const unavailableReason = product && (!product.is_available || product.status !== "active") ? "This product is no longer available." : ""

  const handleMessageSeller = async () => {
    if (!session?.user?.id) {
      router.push("/login")
      return
    }

    // Navigate to messages with seller
    router.push(`/dashboard/messages?userId=${seller.id}`)
    onClose()
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
                    {product.media.map((media: any, index: number) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-12 h-12 rounded-lg border-2 overflow-hidden flex-shrink-0 transition-all ${
                          index === currentImageIndex ? "border-primary" : "border-border opacity-60 hover:opacity-100"
                        }`}
                      >
                        <Image
                          src={media?.url || media || "/placeholder.svg"}
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
              {unavailableReason && <Badge variant="secondary">{unavailableReason}</Badge>}
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
                      <p className="text-sm text-muted-foreground">Message the seller to connect and negotiate</p>
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
                <MessageSquare className="w-4 h-4" />
                Login to Message Seller
              </Button>
            ) : unavailableReason ? (
              <div className="text-sm text-muted-foreground">{unavailableReason}</div>
            ) : isOwnProduct ? (
              <div className="text-sm text-muted-foreground">This is your product</div>
            ) : (
              <>
                {/* Message Seller Button - Only action now */}
                <Button 
                  className="rounded-full gradient-bg gap-2"
                  onClick={handleMessageSeller}
                >
                  <MessageSquare className="w-4 h-4" />
                  Message Seller
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Modal removed - messaging only */}
    </>
  )
}
