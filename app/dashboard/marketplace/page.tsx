"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Loader2, ShoppingBag, MapPin, Star, MessageSquare } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useUserProfile } from "@/hooks/use-user-profile"
import { getMarketplaceProducts, createMarketplaceInquiry } from "@/lib/supabase/queries"
import Image from "next/image"

const CATEGORIES = [
  "All",
  "Electronics",
  "Fashion",
  "Home & Garden",
  "Sports & Outdoors",
  "Books",
  "Art & Crafts",
  "Other",
]

export default function MarketplacePage() {
  const { user, loading } = useUserProfile()
  const [products, setProducts] = useState<any[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All")
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [showInquiryDialog, setShowInquiryDialog] = useState(false)
  const [inquiryMessage, setInquiryMessage] = useState("")
  const [submittingInquiry, setSubmittingInquiry] = useState(false)
  const observerTarget = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchProducts(0)
  }, [search, category])

  async function fetchProducts(newOffset: number) {
    try {
      setLoadingProducts(true)
      const { data } = await getMarketplaceProducts(20, newOffset, category !== "All" ? category : undefined)

      if (newOffset === 0) {
        setProducts(data || [])
      } else {
        setProducts((prev) => [...prev, ...(data || [])])
      }

      setOffset(newOffset + 20)
      setHasMore((data || []).length === 20)
    } catch (err) {
      console.error("Failed to fetch products:", err)
    } finally {
      setLoadingProducts(false)
    }
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingProducts) {
          fetchProducts(offset)
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loadingProducts, offset])

  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  )

  async function handleSendInquiry() {
    if (!user || !selectedProduct || !inquiryMessage.trim()) return

    try {
      setSubmittingInquiry(true)
      await createMarketplaceInquiry(user.id, selectedProduct.id, {
        message: inquiryMessage,
      })
      setShowInquiryDialog(false)
      setInquiryMessage("")
      alert("Inquiry sent successfully!")
    } catch (err) {
      console.error("Failed to send inquiry:", err)
      alert("Failed to send inquiry")
    } finally {
      setSubmittingInquiry(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
            <ShoppingBag className="w-8 h-8" />
            Marketplace
          </h1>
          <p className="text-muted-foreground">Browse and discover items from the community</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredProducts.length === 0 && !loadingProducts ? (
        <div className="text-center py-12">
          <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const mainImage = product.images?.[0] || "/placeholder.jpg"
            return (
              <Card
                key={product.id}
                className="border-border/50 hover:border-primary/50 transition overflow-hidden cursor-pointer group"
                onClick={() => setSelectedProduct(product)}
              >
                <div className="relative h-40 bg-muted overflow-hidden">
                  <Image
                    src={mainImage}
                    alt={product.title}
                    fill
                    className="object-cover group-hover:scale-110 transition"
                  />
                  {product.condition && (
                    <div className="absolute top-2 right-2 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded">
                      {product.condition}
                    </div>
                  )}
                </div>

                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition">
                      {product.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">{product.category}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="text-lg font-bold text-primary">${product.price}</div>

                    {product.user && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-6 h-6 rounded-full bg-muted overflow-hidden flex-shrink-0">
                          {product.user.profile_picture && (
                            <Image
                              src={product.user.profile_picture}
                              alt={product.user.display_name}
                              width={24}
                              height={24}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <span>{product.user.display_name}</span>
                      </div>
                    )}

                    {product.rating && (
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                        <span>{product.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedProduct(product)
                      setShowInquiryDialog(true)
                    }}
                  >
                    <MessageSquare className="w-3 h-3 mr-2" />
                    Inquire
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {loadingProducts && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      <div ref={observerTarget} />

      {/* Product Detail & Inquiry Dialog */}
      <Dialog open={showInquiryDialog} onOpenChange={setShowInquiryDialog}>
        <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Product Inquiry</DialogTitle>
            <DialogDescription>Send a message to the seller</DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="relative h-40 bg-muted rounded-lg overflow-hidden">
                  <Image
                    src={selectedProduct.images?.[0] || "/placeholder.jpg"}
                    alt={selectedProduct.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold">{selectedProduct.title}</h3>
                    <p className="text-2xl font-bold text-primary mt-2">${selectedProduct.price}</p>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Category:</strong> {selectedProduct.category}</p>
                    <p><strong>Condition:</strong> {selectedProduct.condition}</p>
                    {selectedProduct.user && (
                      <p><strong>Seller:</strong> {selectedProduct.user.display_name}</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="inquiry-message">Your Message</Label>
                <Textarea
                  id="inquiry-message"
                  placeholder="Ask about the product, negotiate price, arrange meeting time, etc."
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                  className="mt-2 min-h-24"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                The seller will receive your message and can reply directly to you.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInquiryDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendInquiry}
              disabled={submittingInquiry || !inquiryMessage.trim()}
            >
              {submittingInquiry ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Inquiry"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
