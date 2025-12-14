"use client"

import { useState } from "react"
import Image from "next/image"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Search, ShoppingBag, Calendar, Ticket, Gift, Sparkles, Heart, MapPin, Star, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

const categories = [
  { id: "all", label: "All", icon: Sparkles },
  { id: "gifts", label: "Gifts", icon: Gift },
  { id: "experiences", label: "Experiences", icon: Calendar },
  { id: "tickets", label: "Tickets", icon: Ticket },
  { id: "services", label: "Services", icon: ShoppingBag },
]

const products = [
  {
    id: 1,
    title: "Romantic Dinner Experience",
    description: "A curated 5-course dinner for two at a secret location with stunning views.",
    image: "/romantic-candlelit-dinner-restaurant.jpg",
    price: 299,
    currency: "USD",
    category: "experiences",
    rating: 4.9,
    reviews: 128,
    location: "Multiple Cities",
    featured: true,
  },
  {
    id: 2,
    title: "Personalized Love Letter Kit",
    description: "Handcrafted stationery set with vintage paper, wax seal, and calligraphy pen.",
    image: "/placeholder.svg?height=400&width=600",
    price: 49,
    currency: "USD",
    category: "gifts",
    rating: 4.8,
    reviews: 256,
    location: "Ships Worldwide",
    featured: false,
  },
  {
    id: 3,
    title: "Couples Spa Retreat",
    description: "Full day spa package including massage, facial, and private jacuzzi session.",
    image: "/placeholder.svg?height=400&width=600",
    price: 450,
    currency: "USD",
    category: "experiences",
    rating: 5.0,
    reviews: 89,
    location: "Premium Spas",
    featured: true,
  },
  {
    id: 4,
    title: "Concert VIP Tickets",
    description: "Front row seats with backstage access to top romantic artists.",
    image: "/placeholder.svg?height=400&width=600",
    price: 350,
    currency: "USD",
    category: "tickets",
    rating: 4.7,
    reviews: 45,
    location: "Various Venues",
    featured: false,
  },
  {
    id: 5,
    title: "Professional Photoshoot",
    description: "2-hour couples photography session with edited photos and prints.",
    image: "/placeholder.svg?height=400&width=600",
    price: 199,
    currency: "USD",
    category: "services",
    rating: 4.9,
    reviews: 312,
    location: "On Location",
    featured: true,
  },
  {
    id: 6,
    title: "Custom Jewelry Box",
    description: "Handcrafted wooden jewelry box with personalized engraving.",
    image: "/placeholder.svg?height=400&width=600",
    price: 129,
    currency: "USD",
    category: "gifts",
    rating: 4.8,
    reviews: 178,
    location: "Ships Worldwide",
    featured: false,
  },
  {
    id: 7,
    title: "Hot Air Balloon Ride",
    description: "Sunrise balloon ride over scenic landscapes with champagne breakfast.",
    image: "/placeholder.svg?height=400&width=600",
    price: 399,
    currency: "USD",
    category: "experiences",
    rating: 5.0,
    reviews: 67,
    location: "Select Locations",
    featured: true,
  },
  {
    id: 8,
    title: "Relationship Coaching",
    description: "3 sessions with certified relationship coach for stronger connections.",
    image: "/placeholder.svg?height=400&width=600",
    price: 249,
    currency: "USD",
    category: "services",
    rating: 4.6,
    reviews: 94,
    location: "Online",
    featured: false,
  },
]

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [wishlist, setWishlist] = useState<number[]>([])

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === "all" || product.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const toggleWishlist = (productId: number) => {
    setWishlist((prev) => (prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]))
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

        {/* Featured */}
        {activeCategory === "all" && (
          <div className="container mx-auto px-4 py-8">
            <h2 className="text-2xl font-bold mb-6">Featured</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {filteredProducts
                .filter((p) => p.featured)
                .slice(0, 2)
                .map((product) => (
                  <Card
                    key={product.id}
                    className="group overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300"
                  >
                    <div className="flex flex-col md:flex-row">
                      <div className="relative aspect-video md:aspect-square md:w-1/2">
                        <Image
                          src={product.image || "/placeholder.svg"}
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
                            wishlist.includes(product.id) && "text-primary",
                          )}
                          onClick={() => toggleWishlist(product.id)}
                        >
                          <Heart className={cn("w-5 h-5", wishlist.includes(product.id) && "fill-primary")} />
                        </Button>
                      </div>
                      <CardContent className="flex-1 p-6 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-accent text-accent" />
                              <span className="font-medium">{product.rating}</span>
                            </div>
                            <span className="text-muted-foreground text-sm">({product.reviews} reviews)</span>
                          </div>
                          <h3 className="text-xl font-bold mb-2">{product.title}</h3>
                          <p className="text-muted-foreground mb-4">{product.description}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            {product.location}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                          <div className="text-2xl font-bold gradient-text">${product.price}</div>
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="group overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300"
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={product.image || "/placeholder.svg"}
                    alt={product.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className={cn(
                      "absolute top-3 right-3 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40",
                      wishlist.includes(product.id) && "text-primary",
                    )}
                    onClick={() => toggleWishlist(product.id)}
                  >
                    <Heart className={cn("w-5 h-5", wishlist.includes(product.id) && "fill-primary")} />
                  </Button>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-accent text-accent" />
                      <span className="font-medium text-sm">{product.rating}</span>
                    </div>
                    <span className="text-muted-foreground text-xs">({product.reviews})</span>
                    <Badge variant="outline" className="ml-auto text-xs capitalize">
                      {product.category}
                    </Badge>
                  </div>
                  <h3 className="font-semibold mb-1 line-clamp-1">{product.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold gradient-text">${product.price}</div>
                    <Button size="sm" className="rounded-full gradient-bg">
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
      <MobileNav />
    </div>
  )
}
