import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { Search, Clock, User, ArrowRight } from "lucide-react"

const featuredPost = {
  title: "The Science of Attraction: What Makes Us Click",
  excerpt:
    "Discover the psychology behind what makes us attracted to certain people and how our AI uses these insights to find your perfect match.",
  image: "/romantic-couple-sunset.png",
  category: "Relationships",
  author: "Dr. Sarah Chen",
  date: "December 6, 2024",
  readTime: "8 min read",
}

const posts = [
  {
    title: "10 First Date Ideas That Actually Work",
    excerpt: "Skip the boring dinner dates. Here are creative first date ideas that lead to real connections.",
    image: "/couple-coffee-date.png",
    category: "Dating Tips",
    author: "Alex Rivera",
    date: "December 4, 2024",
    readTime: "5 min read",
  },
  {
    title: "How to Write a Profile That Gets Noticed",
    excerpt: "Your dating profile is your first impression. Learn how to make it count.",
    image: "/person-writing-phone.jpg",
    category: "Profile Tips",
    author: "Maya Johnson",
    date: "December 2, 2024",
    readTime: "6 min read",
  },
  {
    title: "Long Distance Love: Making It Work",
    excerpt: "Tips and tricks from couples who have successfully navigated long distance relationships.",
    image: "/video-call-couple.jpg",
    category: "Relationships",
    author: "James Lee",
    date: "November 30, 2024",
    readTime: "7 min read",
  },
  {
    title: "The Evolution of Online Dating",
    excerpt: "From the first dating websites to AI-powered matching, explore how online dating has transformed.",
    image: "/technology-evolution.jpg",
    category: "Industry",
    author: "Emma Watson",
    date: "November 28, 2024",
    readTime: "10 min read",
  },
  {
    title: "Red Flags vs Butterflies: Trust Your Gut",
    excerpt: "Learn to distinguish between genuine excitement and warning signs in new relationships.",
    image: "/thoughtful-woman.jpg",
    category: "Relationships",
    author: "Dr. Sarah Chen",
    date: "November 25, 2024",
    readTime: "6 min read",
  },
  {
    title: "Building Confidence for Dating Success",
    excerpt: "Practical strategies to boost your confidence and show up as your best self.",
    image: "/confident-person-mirror.jpg",
    category: "Self Improvement",
    author: "Marcus Thompson",
    date: "November 22, 2024",
    readTime: "5 min read",
  },
]

const categories = ["All", "Dating Tips", "Relationships", "Profile Tips", "Industry", "Self Improvement"]

export default function BlogPage() {
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
                  variant={cat === "All" ? "default" : "ghost"}
                  className={`rounded-full whitespace-nowrap ${cat === "All" ? "gradient-bg" : ""}`}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Post */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <Card className="border-border/50 overflow-hidden">
              <div className="grid md:grid-cols-2">
                <div className="relative aspect-video md:aspect-auto">
                  <Image
                    src={featuredPost.image || "/placeholder.svg"}
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
                      {featuredPost.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {featuredPost.readTime}
                    </span>
                  </div>
                  <Button className="rounded-full gradient-bg w-fit">
                    Read Article
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </div>
            </Card>
          </div>
        </section>

        {/* Posts Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8">Latest Articles</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post, i) => (
                <Card key={i} className="border-border/50 overflow-hidden group cursor-pointer">
                  <div className="relative aspect-video">
                    <Image
                      src={post.image || "/placeholder.svg"}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <Badge className="absolute top-3 left-3 gradient-bg text-primary-foreground">{post.category}</Badge>
                  </div>
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{post.excerpt}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{post.author}</span>
                      <span>{post.readTime}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center mt-12">
              <Button variant="outline" className="rounded-full bg-transparent">
                Load More Articles
              </Button>
            </div>
          </div>
        </section>

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
