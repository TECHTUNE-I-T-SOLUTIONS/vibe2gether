"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Search, ShoppingBag, Calendar, Ticket, Gift, Sparkles, MapPin, ArrowRight, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { getMarketplaceProducts } from "@/lib/supabase/queries"
import { ProductDetailsModal } from "@/components/product-details-modal"
import { PaymentVerificationModal } from "@/components/payment-verification-modal"
import { createClient } from "@/lib/supabase/client"

export default function MarketplacePage() {
  const searchParams = useSearchParams()
  const paymentReference = searchParams.get("reference")
  
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [products, setProducts] = useState<any[]>([])
  const [productCategories, setProductCategories] = useState<any[]>([{ id: "all", label: "All", icon: Sparkles }])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [sellerInfo, setSellerInfo] = useState<any>(null)
  const [showPaymentVerification, setShowPaymentVerification] = useState(false)

  // Handle payment callback redirect
  useEffect(() => {
    if (paymentReference) {
      setShowPaymentVerification(true)
    }
  }, [paymentReference])

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true)
        const { data, error } = await getMarketplaceProducts(100, 0)
        if (error) {
          setError("Failed to load products")
        } else {
          setProducts(data || [])
          
          // Extract unique categories from products
          const categories = new Set<string>()
          data?.forEach((product: any) => {
            if (product.category) {
              categories.add(product.category)
            }
          })
          
          // Create category objects with generic icons
          const dynamicCategories = Array.from(categories).map((cat) => ({
            id: cat.toLowerCase().replace(/\s+/g, "-"),
            label: cat,
            icon: ShoppingBag,
          }))
          
          setProductCategories([
            { id: "all", label: "All", icon: Sparkles },
            ...dynamicCategories,
          ])
        }
      } catch (err) {
        setError("Failed to load products")
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Normalize category comparison (case-insensitive)
    const productCategory = product.category?.toLowerCase() || ""
    const selectedCategoryId = activeCategory.toLowerCase()
    const selectedCategoryLabel = productCategories.find(c => c.id === selectedCategoryId)?.label?.toLowerCase() || ""
    
    const matchesCategory =
      selectedCategoryId === "all" ||
      productCategory === selectedCategoryLabel ||
      productCategory === selectedCategoryId
    
    return matchesSearch && matchesCategory
  })

  const handleViewDetails = async (product: any) => {
    setSelectedProduct(product)
    
    // Fetch seller info
    try {
      const supabase = await createClient()
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", product.seller_id)
        .single()
      
      if (data) {
        setSellerInfo(data)
      }
    } catch (error) {
      console.error("Failed to fetch seller info:", error)
    }
    
    setDetailsModalOpen(true)
  }

  const formatPrice = (price: number, currency?: string) => {
    const curr = currency || "USD"
    if (curr === "NGN") {
      return `₦${price.toLocaleString()}`
    }
    return `$${price}`
  }

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <Header />
      <main className="pt-20 md:pt-24">
        {/* Hero */}
        <div className="relative bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 py-12 md:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <Badge className="mb-4 gradient-bg text-primary-foreground">
                <ShoppingBag className="w-4 h-4 mr-1" />
                Marketplace
              </Badge>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                Discover <span className="gradient-text">Romantic Gifts</span> & Experiences
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Find the perfect gift, plan unforgettable experiences, and make your special moments extraordinary.
              </p>
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search gifts, experiences, tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 rounded-full bg-background text-base"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="sticky top-16 md:top-20 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="container mx-auto px-4">
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-4">
              {productCategories.map((category) => {
                const Icon = category.icon
                return (
                  <Button
                    key={category.id}
                    variant={activeCategory === category.id ? "default" : "outline"}
                    className={cn("rounded-full shrink-0", activeCategory === category.id && "gradient-bg border-0")}
                    onClick={() => setActiveCategory(category.id)}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {category.label}
                  </Button>
                )
              })}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="container mx-auto px-4 py-20 text-center">
            <p className="text-red-500">{error}</p>
          </div>
        ) : (
          <>
            {/* Featured */}
            {activeCategory === "all" && filteredProducts.length > 0 && (
              <div className="container mx-auto px-4 py-8">
                <h2 className="text-2xl font-bold mb-6">Featured Products</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {filteredProducts.slice(0, 2).map((product) => (
                    <Card
                      key={product.id}
                      className="group overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300"
                    >
                      <div className="flex flex-col md:flex-row">
                        <div className="relative aspect-video md:aspect-square md:w-1/2">
                          <Image
                          src={product.media?.[0]?.url || product.media?.[0] || "/placeholder.svg"}
                            alt={product.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <Badge className="absolute top-4 left-4 gradient-bg text-primary-foreground">Featured</Badge>
                        </div>
                        <CardContent className="flex-1 p-6 flex flex-col justify-between">
                          <div>
                            <h3 className="text-xl font-bold mb-2">{product.title}</h3>
                            <p className="text-muted-foreground mb-4">{product.description}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              {product.location_name}
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                            <div className="text-2xl font-bold gradient-text">
                              {formatPrice(product.price, product.currency)}
                            </div>
                            <Button 
                              className="rounded-full gradient-bg"
                              onClick={() => handleViewDetails(product)}
                            >
                              View Details
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Products Grid */}
            <div className="container mx-auto px-4 py-8">
              <h2 className="text-2xl font-bold mb-6">
                {activeCategory === "all" ? "All Products" : productCategories.find((c) => c.id === activeCategory)?.label}
              </h2>
              {filteredProducts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No products found</p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map((product) => (
                    <Card
                      key={product.id}
                      className="group overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300"
                    >
                      <div className="relative aspect-[4/3]">
                        <Image
                          src={product.media?.[0]?.url || product.media?.[0] || "/placeholder.svg"}
                          alt={product.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <CardContent className="p-4">
                        <Badge variant="outline" className="mb-2 text-xs capitalize">
                          {product.category}
                        </Badge>
                        <h3 className="font-semibold mb-1 line-clamp-1">{product.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{product.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-bold gradient-text">
                            {formatPrice(product.price, product.currency)}
                          </div>
                          <Button 
                            size="sm" 
                            className="rounded-full gradient-bg"
                            onClick={() => handleViewDetails(product)}
                          >
                            Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
      <Footer />
      <MobileNav />

      {/* Product Details Modal */}
      <ProductDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false)
          setSelectedProduct(null)
          setSellerInfo(null)
        }}
        product={selectedProduct}
        seller={sellerInfo}
      />

      {/* Payment Verification Modal */}
      <PaymentVerificationModal
        isOpen={showPaymentVerification}
        reference={paymentReference}
        onClose={() => {
          setShowPaymentVerification(false)
          // Clean up the URL
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, document.title, "/marketplace")
          }
          // Refresh product details if open to show updated purchase status
          if (detailsModalOpen && selectedProduct) {
            // Re-open the details modal to refresh purchase status
            setDetailsModalOpen(false)
            setTimeout(() => {
              setDetailsModalOpen(true)
            }, 500)
          }
        }}
      />
    </div>
  )
}
