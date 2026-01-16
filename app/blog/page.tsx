"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { Search, Clock, User, ArrowRight, Loader2 } from "lucide-react"
import { getBlogPosts } from "@/lib/supabase/queries"

const categories = ["All", "Relationships", "Dating Tips", "Profile Tips", "Industry", "Self Improvement"]

export default function BlogPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function fetchPosts() {
      try {
        setLoading(true)
        const { data, error } = await getBlogPosts(100, 0)
        if (error) {
          setError("Failed to load blog posts")
        } else {
          setPosts(data || [])
        }
      } catch (err) {
        setError("Failed to load blog posts")
      } finally {
        setLoading(false)
      }
    }
    fetchPosts()
  }, [])

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const featuredPost = filteredPosts[0]

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-16 md:pt-20">
        {/* Hero */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 gradient-bg opacity-10" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                The Vibe <span className="gradient-text">Blog</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Tips, stories, and insights to help you find meaningful connections
              </p>
              <div className="relative max-w-md mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 rounded-full bg-background h-12"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-10">
          <div className="container mx-auto px-4">
            <div className="flex gap-2 py-4 overflow-x-auto no-scrollbar">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={cat === selectedCategory ? "default" : "ghost"}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full whitespace-nowrap ${cat === selectedCategory ? "gradient-bg" : ""}`}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        </section>

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
            {/* Featured Post */}
            {featuredPost && (
              <section className="py-12">
                <div className="container mx-auto px-4">
                  <Card className="border-border/50 overflow-hidden">
                    <div className="grid md:grid-cols-2">
                      <div className="relative aspect-video md:aspect-auto">
                        <Image
                          src={featuredPost.thumbnail || "/placeholder.svg"}
                          alt={featuredPost.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <CardContent className="p-6 md:p-8 flex flex-col justify-center">
                        <Badge className="w-fit gradient-bg text-primary-foreground mb-4">{featuredPost.category}</Badge>
                        <h2 className="text-2xl md:text-3xl font-bold mb-4">{featuredPost.title}</h2>
                        <p className="text-muted-foreground mb-6">{featuredPost.excerpt}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {featuredPost.author?.full_name || "Admin"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {new Date(featuredPost.published_at || featuredPost.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <Button className="rounded-full gradient-bg w-fit" onClick={() => router.push(`/blog/${featuredPost.slug}`)}>
                          Read Article
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </CardContent>
                    </div>
                  </Card>
                </div>
              </section>
            )}

            {/* Posts Grid */}
            <section className="py-12">
              <div className="container mx-auto px-4">
                <h2 className="text-2xl font-bold mb-8">
                  {selectedCategory === "All" ? "Latest Articles" : `${selectedCategory} Articles`}
                </h2>
                {filteredPosts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No articles found</p>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPosts.map((post) => (
                      <Card
                        key={post.id}
                        className="border-border/50 overflow-hidden group cursor-pointer transition-all hover:shadow-lg"
                        onClick={() => router.push(`/blog/${post.slug}`)}
                      >
                        <div className="relative aspect-video">
                          <Image
                            src={post.thumbnail || "/placeholder.svg"}
                            alt={post.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <Badge className="absolute top-3 left-3 gradient-bg text-primary-foreground">
                            {post.category}
                          </Badge>
                        </div>
                        <CardContent className="p-5">
                          <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                            {post.title}
                          </h3>
                          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{post.excerpt}</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{post.author?.full_name || "Admin"}</span>
                            <span>{new Date(post.published_at || post.created_at).toLocaleDateString()}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {/* Newsletter */}
        <section className="py-20 gradient-bg">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Subscribe to Our Newsletter</h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">
              Get the latest dating tips and relationship advice delivered to your inbox weekly.
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                className="flex-1 rounded-full bg-white/20 border-white/30 text-white placeholder:text-white/60"
              />
              <Button variant="secondary" className="rounded-full">
                Subscribe
              </Button>
            </form>
          </div>
        </section>
      </main>
      <Footer />
      <MobileNav />
    </div>
  )
}
