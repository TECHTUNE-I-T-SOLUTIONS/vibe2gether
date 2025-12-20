"use client"

import { useState, useEffect, useRef } from "react"
import { Loader2, BookOpen, Search, User, Calendar as CalendarIcon } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUserProfile } from "@/hooks/use-user-profile"
import { getBlogPosts } from "@/lib/supabase/queries"
import Image from "next/image"
import Link from "next/link"

const BLOG_CATEGORIES = [
  "All",
  "Lifestyle",
  "Relationships",
  "Travel",
  "Health",
  "Technology",
  "Entertainment",
  "Tips & Advice",
]

export default function BlogPage() {
  const { user, loading } = useUserProfile()
  const [posts, setPosts] = useState<any[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All")
  const observerTarget = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchPosts(0)
  }, [search, category])

  async function fetchPosts(newOffset: number) {
    try {
      setLoadingPosts(true)
      const { data } = await getBlogPosts(10, newOffset, category !== "All" ? category : undefined)

      if (newOffset === 0) {
        setPosts(data || [])
      } else {
        setPosts((prev) => [...prev, ...(data || [])])
      }

      setOffset(newOffset + 10)
      setHasMore((data || []).length === 10)
    } catch (err) {
      console.error("Failed to fetch posts:", err)
    } finally {
      setLoadingPosts(false)
    }
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingPosts) {
          fetchPosts(offset)
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loadingPosts, offset])

  const filteredPosts = posts.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.excerpt?.toLowerCase().includes(search.toLowerCase())
  )

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  function formatReadTime(content: string) {
    const wordsPerMinute = 200
    const words = content.split(/\s+/).length
    const minutes = Math.ceil(words / wordsPerMinute)
    return `${minutes} min read`
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
            <BookOpen className="w-8 h-8" />
            Blog
          </h1>
          <p className="text-muted-foreground">Read articles and stories from our community</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BLOG_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredPosts.length === 0 && !loadingPosts ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No articles found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <Link key={post.id} href={`/dashboard/blog/${post.slug}`}>
              <Card className="border-border/50 hover:border-primary/50 transition cursor-pointer group">
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {post.thumbnail && (
                      <div className="relative h-48 md:h-auto rounded-l-lg overflow-hidden">
                        <Image
                          src={post.thumbnail}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-105 transition"
                        />
                      </div>
                    )}

                    <div className={`p-6 flex flex-col justify-between ${post.thumbnail ? "md:col-span-3" : "col-span-1"}`}>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          {post.category && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                              {post.category}
                            </span>
                          )}
                          {post.is_featured && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                              Featured
                            </span>
                          )}
                        </div>
                        <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition line-clamp-2">
                          {post.title}
                        </h2>
                        <p className="text-muted-foreground text-sm line-clamp-2">
                          {post.excerpt || "Read this article..."}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                          {post.user && (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-muted overflow-hidden flex-shrink-0">
                                {post.user.profile_picture && (
                                  <Image
                                    src={post.user.profile_picture}
                                    alt={post.user.display_name}
                                    width={24}
                                    height={24}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                              <span>{post.user.display_name}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          {post.created_at && (
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="w-4 h-4" />
                              <span>{formatDate(post.created_at)}</span>
                            </div>
                          )}
                          {post.content && (
                            <span>{formatReadTime(post.content)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {loadingPosts && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      <div ref={observerTarget} />
    </div>
  )
}
