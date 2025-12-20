"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Search, ShoppingBag, Calendar, Ticket, Gift, Sparkles, Heart, MapPin, Star, ArrowRight, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { getMarketplaceProducts } from "@/lib/supabase/queries"

const categories = [
  { id: "all", label: "All", icon: Sparkles },
  { id: "gifts", label: "Gifts", icon: Gift },
  { id: "experiences", label: "Experiences", icon: Calendar },
  { id: "tickets", label: "Tickets", icon: Ticket },
  { id: "services", label: "Services", icon: ShoppingBag },
]

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [wishlist, setWishlist] = useState<string[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true)
        const { data, error } = await getMarketplaceProducts(100, 0)
        if (error) {
          setError("Failed to load products")
        } else {
          setProducts(data || [])
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
    const matchesCategory = activeCategory === "all" || product.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    )
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
              {categories.map((category) => {
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
                            src={product.media?.[0] || product.thumbnail || "/placeholder.svg"}
                            alt={product.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <Badge className="absolute top-4 left-4 gradient-bg text-primary-foreground">Featured</Badge>
                          <Button
                            size="icon"
                            variant="ghost"
                            className={cn(
                              "absolute top-4 right-4 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40",
                              wishlist.includes(product.id) && "text-primary"
                            )}
                            onClick={() => toggleWishlist(product.id)}
                          >
                            <Heart className={cn("w-5 h-5", wishlist.includes(product.id) && "fill-primary")} />
                          </Button>
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
                              ${product.price} {product.currency || "USD"}
                            </div>
                            <Button className="rounded-full gradient-bg">
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
                {activeCategory === "all" ? "All Products" : categories.find((c) => c.id === activeCategory)?.label}
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
                          src={product.media?.[0] || product.thumbnail || "/placeholder.svg"}
                          alt={product.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className={cn(
                            "absolute top-3 right-3 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40",
                            wishlist.includes(product.id) && "text-primary"
                          )}
                          onClick={() => toggleWishlist(product.id)}
                        >
                          <Heart className={cn("w-5 h-5", wishlist.includes(product.id) && "fill-primary")} />
                        </Button>
                      </div>
                      <CardContent className="p-4">
                        <Badge variant="outline" className="mb-2 text-xs capitalize">
                          {product.category}
                        </Badge>
                        <h3 className="font-semibold mb-1 line-clamp-1">{product.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{product.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-bold gradient-text">
                            ${product.price} {product.currency || "USD"}
                          </div>
                          <Button size="sm" className="rounded-full gradient-bg">
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
    </div>
  )
}
