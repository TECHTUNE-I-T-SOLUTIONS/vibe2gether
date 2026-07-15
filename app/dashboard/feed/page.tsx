"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import dynamic from "next/dynamic"
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MapPin,
  MoreHorizontal,
  Loader2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  ImagePlus,
  Video,
  Smile,
  X,
  Sparkles,
  RefreshCw,
  Crown,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { getFlagAssetFromLocation } from "@/lib/location-country"
import { cn } from "@/lib/utils"
import { PostMenu } from "@/components/post-menu"
import { CreatePost } from "@/components/create-post"

// Lazy load non-critical components for performance
const FeatureCards = dynamic(() => import("@/components/dashboard/feature-cards").then(mod => ({ default: mod.FeatureCards })), {
  loading: () => <div className="h-20 bg-muted rounded-lg animate-pulse" />,
  ssr: false
})
import { useUserProfile } from "@/hooks/use-user-profile"
import { usePremiumCheck } from "@/hooks/use-premium-check"
import { getPostComments, deletePost, createPost } from "@/lib/supabase/queries"
import { uploadPostMedia } from "@/lib/supabase/storage"

// Types
interface Post {
  id: string
  user_id?: string
  content: string
  media: any[]
  tags: string[]
  location_name?: string
  created_at: string
  likes_count: number
  comments_count: number
  saves_count: number
  views_count: number
  is_premium?: boolean
  user: {
    id: string
    display_name: string
    full_name: string
    profile_picture?: string
  }
  isLiked: boolean
  isSaved: boolean
}

// Skeleton components
function PostSkeleton() {
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3 mb-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-32 w-full mb-4" />
        <div className="flex space-x-4">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </CardContent>
    </Card>
  )
}

// Optimized Image component with preloading
function OptimizedImage({ src, alt, priority = false, className }: {
  src: string
  alt: string
  priority?: boolean
  className?: string
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  return (
    <div className={cn("relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800", className)}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}
      {!hasError ? (
        <Image
          src={src}
          alt={alt}
          fill
          className={cn(
            "object-cover transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100"
          )}
          priority={priority}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false)
            setHasError(true)
          }}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      ) : (
        <div className="flex items-center justify-center h-full text-gray-400">
          <span className="text-sm">Image unavailable</span>
        </div>
      )}
    </div>
  )
}

// Main component
export default function NewFeedPage() {
  const { data: session } = useSession()
  const { user } = useUserProfile()
  const { isPremium } = usePremiumCheck()
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const viewTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const viewedPostsRef = useRef<Set<string>>(new Set()) // Track viewed posts to prevent double-counting
  const mediaObserverRef = useRef<IntersectionObserver | null>(null)

  // Optimistic UI state for likes and saves
  const [likedPosts, setLikedPosts] = useState<Map<string, boolean>>(new Map())
  const [savedPosts, setSavedPosts] = useState<Map<string, boolean>>(new Map())

  // Post creation state
  const [postContent, setPostContent] = useState("")
  const [postFiles, setPostFiles] = useState<File[]>([])
  const [postTags, setPostTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [postLocation, setPostLocation] = useState<{
    name: string
    latitude: number
    longitude: number
  } | null>(null)
  const [isCreatingPost, setIsCreatingPost] = useState(false)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [showTagInput, setShowTagInput] = useState(false)
  const [locationSearch, setLocationSearch] = useState("")
  const [locationSuggestions, setLocationSuggestions] = useState<Array<{
    name: string
    latitude: number
    longitude: number
  }>>([])
  const [isSearchingLocation, setIsSearchingLocation] = useState(false)
  const [isPremiumPost, setIsPremiumPost] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [hasSeenPremiumModal, setHasSeenPremiumModal] = useState(false)

  // Comment-related state
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [postComments, setPostComments] = useState<Map<string, any[]>>(new Map())
  const [newComments, setNewComments] = useState<Map<string, string>>(new Map())
  const [submittingComment, setSubmittingComment] = useState<Map<string, boolean>>(new Map())

  // Media carousel state
  const [mediaCarouselIndex, setMediaCarouselIndex] = useState<Map<string, number>>(new Map())
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())

  const [loadKey, setLoadKey] = useState(0)

  // Handle premium checkbox change with modal
  const handlePremiumCheckboxChange = (checked: boolean) => {
    if (checked && !hasSeenPremiumModal) {
      setShowPremiumModal(true)
    } else {
      setIsPremiumPost(checked)
    }
  }

  const handleConfirmPremiumPost = () => {
    setIsPremiumPost(true)
    setShowPremiumModal(false)
    setHasSeenPremiumModal(true)
    // Store in localStorage so it persists across sessions
    if (typeof window !== "undefined") {
      localStorage.setItem("hasSeenPremiumPostModal", "true")
    }
  }

  const handleCancelPremiumPost = () => {
    setIsPremiumPost(false)
    setShowPremiumModal(false)
  }

  // Check if user has seen the modal before
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasSeen = localStorage.getItem("hasSeenPremiumPostModal") === "true"
      setHasSeenPremiumModal(hasSeen)
    }
  }, [])

  // Force reshuffle on page load/refresh
  useEffect(() => {
    setLoadKey(prev => prev + 1)
  }, [])

  // Fetch posts with React Query - using infinite query for appending posts
  const {
    data,
    isLoading,
    error: queryError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["new-feed-posts", session?.user?.id, loadKey], // Include load key for reshuffle
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetch(`/api/new-feed/posts?page=${pageParam}&limit=10`)
      if (!response.ok) throw new Error("Failed to fetch posts")
      return response.json() as Promise<{ posts: Post[] }>
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      // If we got less than 10 posts, we've reached the end
      if (lastPage.posts.length < 10) return undefined
      return allPages.length + 1
    },
    staleTime: 0,
    gcTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  })

  // Flatten all pages into a single array of posts
  const allPosts = data?.pages.flatMap(page => page.posts) || []

  // Handle loading more posts
  const loadMore = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return
    fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // Reset pagination when refresh is clicked
  const handleRefresh = useCallback(() => {
    refetch()
  }, [refetch])

  // Warm up the first few videos so they are playable as soon as the feed settles.
  useEffect(() => {
    if (!allPosts.length) return

    const initialMediaToLoad = new Set<string>()
    let warmedVideos = 0

    allPosts.forEach((post: Post) => {
      const mediaUrl = getMediaUrl(post.media, 0)
      if (!mediaUrl) return

      const mediaId = `${post.id}-0`

      // Skip if already loaded
      if (loadedImages.has(mediaId)) return

      if (!isVideo(mediaUrl)) {
        initialMediaToLoad.add(mediaId)
        return
      }

      if (warmedVideos < 3) {
        initialMediaToLoad.add(mediaId)
        warmedVideos += 1
      }
    })

    if (initialMediaToLoad.size > 0) {
      setLoadedImages((prev) => {
        const next = new Set(prev)
        initialMediaToLoad.forEach((mediaId) => next.add(mediaId))
        return next
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allPosts.length]) // Only re-run when number of posts changes, not on every render

  // Preload images for better performance
  const preloadImage = useCallback((src: string) => {
    if (preloadedImages.has(src)) return

    const img = new window.Image()
    img.src = src
    img.onload = () => {
      setPreloadedImages(prev => new Set(prev).add(src))
    }
  }, [preloadedImages])

  // Track post views when scrolling into viewport (only for logged-in users)
  const trackPostView = useCallback(async (postId: string) => {
    // Only track views for authenticated users
    if (!session?.user?.id) return

    // Prevent double-counting: check if already viewed in this session
    if (viewedPostsRef.current.has(postId)) return

    try {
      const response = await fetch("/api/posts/scroll-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error(`[Feed] API error: ${error.error}`)
        throw new Error(error.error || "Failed to track view")
      }

      const data = await response.json()
      const newViewCount = data.newViewCount

      if (typeof newViewCount !== "number") {
        console.error(`[Feed] Invalid view count received: ${newViewCount}`)
        return
      }

      // Mark as viewed to prevent double-counting
      viewedPostsRef.current.add(postId)

      // Update view count in the React Query cache
      queryClient.setQueryData(["new-feed-posts", session?.user?.id], (oldData: any) => {
        if (!oldData?.posts) return oldData

        return {
          ...oldData,
          posts: oldData.posts.map((post: any) =>
            post.id === postId
              ? { ...post, views_count: newViewCount }
              : post
          )
        }
      })

      console.log(`[Feed] View tracked for post ${postId}, new count: ${newViewCount}`)
    } catch (err) {
      console.error("[Feed] Failed to track view:", err)
    }
  }, [session?.user?.id])

  // Setup view tracking observer
  useEffect(() => {
    const observerOptions = {
      threshold: 0.5,
      rootMargin: "0px",
    }

    const viewObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const postId = entry.target.getAttribute("data-post-id")
        if (!postId) return

        if (entry.isIntersecting) {
          const existingTimeout = viewTimeoutsRef.current.get(postId)
          if (existingTimeout) clearTimeout(existingTimeout)

          const timeout = setTimeout(() => {
            trackPostView(postId)
            viewTimeoutsRef.current.delete(postId)
          }, 2000) // 2 seconds

          viewTimeoutsRef.current.set(postId, timeout)
        } else {
          const timeout = viewTimeoutsRef.current.get(postId)
          if (timeout) {
            clearTimeout(timeout)
            viewTimeoutsRef.current.delete(postId)
          }
        }
      })
    }, observerOptions)

    const postCards = document.querySelectorAll("[data-post-id]")
    postCards.forEach((card) => viewObserver.observe(card))

    return () => {
      viewTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout))
      viewTimeoutsRef.current.clear()
      viewObserver.disconnect()
    }
  }, [allPosts, trackPostView])

  // Setup lazy-load media observer
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: "600px 0px",
      threshold: 0.01,
    }

    mediaObserverRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const mediaId = (entry.target as HTMLElement).getAttribute("data-media-id")

          if (mediaId && !loadedImages.has(mediaId)) {
            setLoadedImages((prev) => {
              const next = new Set(prev)
              next.add(mediaId)
              return next
            })
            if (mediaObserverRef.current) {
              mediaObserverRef.current.unobserve(entry.target)
            }
          }
        }
      })
    }, options)

    return () => {
      if (mediaObserverRef.current) {
        mediaObserverRef.current.disconnect()
      }
    }
  }, [loadedImages])

  const handleShowComments = async (postId: string) => {
    const isExpanded = expandedComments.has(postId)

    if (!isExpanded) {
      // Fetch comments
      try {
        const { data, error } = await getPostComments(postId, 10)
        if (error) throw error
        setPostComments((prev) => new Map(prev).set(postId, data || []))
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to load comments",
          variant: "destructive",
        })
      }
    }

    setExpandedComments((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(postId)) {
        newSet.delete(postId)
      } else {
        newSet.add(postId)
      }
      return newSet
    })
  }

  const handleSubmitComment = async (postId: string) => {
    if (!user) {
      router.push("/login")
      return
    }

    const comment = newComments.get(postId) || ""
    if (!comment.trim()) return

    setSubmittingComment((prev) => new Map(prev).set(postId, true))

    try {
      const response = await fetch("/api/posts/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content: comment }),
      })

      if (!response.ok) {
        throw new Error("Failed to post comment")
      }

      const { comment: newComment, commentsCount } = await response.json()

      setPostComments((prev) => {
        const comments = prev.get(postId) || []
        return new Map(prev).set(postId, [newComment, ...comments])
      })

      setNewComments((prev) => new Map(prev).set(postId, ""))

      // Update the comment count locally to avoid feed refetch and reorder
      queryClient.setQueryData(["new-feed-posts", session?.user?.id], (oldData: any) => {
        if (!oldData?.posts) return oldData

        return {
          ...oldData,
          posts: oldData.posts.map((post: any) =>
            post.id === postId
              ? {
                  ...post,
                  comments_count: (post.comments_count || 0) + 1,
                }
              : post
          )
        }
      })

      toast({
        title: "Success",
        description: "Comment posted",
      })
    } catch (err) {
      console.error("Comment error:", err)
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      })
    } finally {
      setSubmittingComment((prev) => new Map(prev).set(postId, false))
    }
  }

  const handleDeletePost = async (postId: string) => {
    try {
      const { error } = await deletePost(postId)
      if (error) throw error

      // Invalidate the query to remove the deleted post
      queryClient.invalidateQueries({ queryKey: ["new-feed-posts", session?.user?.id] })

      toast({
        title: "Success",
        description: "Post deleted",
      })
    } catch (err) {
      console.error("Failed to delete post:", err)
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      })
    }
  }

  const handleLike = async (postId: string) => {
    const currentlyLiked = likedPosts.get(postId) || false

    // Optimistic update
    setLikedPosts(prev => new Map(prev).set(postId, !currentlyLiked))

    try {
      const response = await fetch("/api/posts/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      })

      if (!response.ok) throw new Error("Failed to like post")

      // Update the cache to mark post as liked/unliked without refetching
      queryClient.setQueryData(["new-feed-posts", session?.user?.id], (oldData: any) => {
        if (!oldData?.posts) return oldData

        return {
          ...oldData,
          posts: oldData.posts.map((post: any) =>
            post.id === postId
              ? {
                  ...post,
                  isLiked: !currentlyLiked,
                  likes_count: currentlyLiked ? Math.max((post.likes_count || 1) - 1, 0) : (post.likes_count || 0) + 1,
                }
              : post
          )
        }
      })

      toast({
        title: "Success",
        description: currentlyLiked ? "Post unliked" : "Post liked",
      })
    } catch (error) {
      // Revert optimistic update on error
      setLikedPosts(prev => new Map(prev).set(postId, currentlyLiked))

      toast({
        title: "Error",
        description: "Failed to like post",
        variant: "destructive",
      })
    }
  }

  const handleSave = async (postId: string) => {
    const currentlySaved = savedPosts.get(postId) || false

    // Optimistic update
    setSavedPosts(prev => new Map(prev).set(postId, !currentlySaved))

    try {
      const response = await fetch("/api/posts/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      })

      if (!response.ok) throw new Error("Failed to save post")

      // Update the cache to mark post as saved/unsaved without refetching
      queryClient.setQueryData(["new-feed-posts", session?.user?.id], (oldData: any) => {
        if (!oldData?.posts) return oldData

        return {
          ...oldData,
          posts: oldData.posts.map((post: any) =>
            post.id === postId
              ? { ...post, isSaved: !currentlySaved }
              : post
          )
        }
      })

      toast({
        title: "Success",
        description: currentlySaved ? "Post unsaved" : "Post saved",
      })
    } catch (error) {
      // Revert optimistic update on error
      setSavedPosts(prev => new Map(prev).set(postId, currentlySaved))

      toast({
        title: "Error",
        description: "Failed to save post",
        variant: "destructive",
      })
    }
  }

  // Post creation functions
  const handleAddTag = () => {
    const tag = tagInput.trim()
    if (tag && !postTags.includes(tag)) {
      setPostTags(prev => [...prev, tag])
    }
    setTagInput("")
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setPostTags(prev => prev.filter(tag => tag !== tagToRemove))
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return
    const allFiles = Array.from(files)
    const newFiles = allFiles.filter(file => file.type.startsWith('image/'))
    
    if (newFiles.length !== allFiles.length) {
      toast({
        title: "Invalid file format",
        description: "Only image files are allowed. Videos have been removed.",
        variant: "destructive",
      })
    }
    
    setPostFiles(prev => [...prev, ...newFiles].slice(0, 10)) // Max 10 files
  }

  const handleRemoveFile = (index: number) => {
    setPostFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Location search function
  const searchLocations = async (query: string) => {
    if (!query.trim()) {
      setLocationSuggestions([])
      return
    }

    setIsSearchingLocation(true)
    try {
      // Using Nominatim (OpenStreetMap) for free geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      )
      const data = await response.json()

      const suggestions = data.map((item: any) => ({
        name: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon)
      }))

      setLocationSuggestions(suggestions)
    } catch (error) {
      console.error("Location search error:", error)
      setLocationSuggestions([])
    } finally {
      setIsSearchingLocation(false)
    }
  }

  // Debounced location search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (locationSearch) {
        searchLocations(locationSearch)
      } else {
        setLocationSuggestions([])
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [locationSearch])

  const handleCreatePost = async () => {
    if (!session?.user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to create a post",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    if (!postContent.trim() && postFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please add some content or media to your post",
        variant: "destructive",
      })
      return
    }

    setIsCreatingPost(true)
    try {
      let mediaUrls: string[] = []

      // Upload files if any
      if (postFiles.length > 0) {
        // Filter out any invalid files
        const validFiles = postFiles.filter(file => file && file instanceof File && file.size > 0)

        if (validFiles.length !== postFiles.length) {
          console.warn(`Found ${postFiles.length - validFiles.length} invalid files, using ${validFiles.length} valid files`)
        }

        if (validFiles.length > 0) {
          const uploadPromises = validFiles.map(file => {
            try {
              return uploadPostMedia(session.user.id, file)
            } catch (error) {
              console.error("Upload error for file:", file.name, error)
              return Promise.resolve({ url: null, error: "Upload failed" })
            }
          })

          const uploadResults = await Promise.all(uploadPromises)

          // Check for upload errors
          const failedUploads = uploadResults.filter(result => result.error)
          if (failedUploads.length > 0) {
            toast({
              title: "Upload Error",
              description: `Failed to upload ${failedUploads.length} file(s). Please try again.`,
              variant: "destructive",
            })
            return
          }

          // Extract URLs from successful uploads
          mediaUrls = uploadResults.map(result => result.url).filter(Boolean) as string[]
        }
      }

      // Create the post with individual parameters
      const { data: newPost, error } = await createPost(
        session.user.id,
        postContent.trim(),
        mediaUrls,
        postTags,
        postLocation?.name,
        postLocation?.latitude,
        postLocation?.longitude,
        true, // isPublic
        true, // allowComments
        isPremiumPost // isPremium
      )

      if (error) {
        console.error("Create post error:", error)
        toast({
          title: "Error",
          description: "Failed to create post. Please try again.",
          variant: "destructive",
        })
        return
      }

      // Immediately add the new post to the top of the feed
      if (newPost && newPost[0]) {
        const createdPost = {
          ...newPost[0],
          user: {
            id: session.user.id,
            display_name: user?.display_name || session.user.name,
            profile_picture: user?.profile_picture,
            bio: user?.bio
          },
          isLiked: false,
          isSaved: false,
          likes_count: 0,
          comments_count: 0,
          saves_count: 0,
          views_count: 0
        }

        // Update the query cache to add the new post at the top
        queryClient.setQueryData(["new-feed-posts", session.user.id], (oldData: any) => {
          if (!oldData) return oldData
          return {
            ...oldData,
            pages: [
              { posts: [createdPost, ...(oldData.pages[0]?.posts || [])] },
              ...oldData.pages.slice(1)
            ]
          }
        })
      }

      // Also invalidate the cache to ensure fresh data on next fetch
      queryClient.invalidateQueries({ queryKey: ["new-feed-posts", session.user.id] })

      // Reset form
      setPostContent("")
      setPostFiles([])
      setPostTags([])
      setTagInput("")
      setPostLocation(null)

      toast({
        title: "Success",
        description: "Post created successfully!",
      })
    } catch (error) {
      console.error("Failed to create post:", error)
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreatingPost(false)
    }
  }

  // Media helper functions
  const getMediaArray = (media: any) => {
    if (!media) return []
    if (Array.isArray(media)) {
      return media.map((m) => (typeof m === "string" ? m : m.url || m))
    }
    return []
  }

  const getMediaUrl = (media: any, index: number = 0) => {
    const mediaArray = getMediaArray(media)
    return mediaArray[index] || null
  }

  const isVideo = (url: string) => {
    return /\.(mp4|webm|ogg|avi|mov|mkv|flv|wmv|m3u8)$/i.test(url) ||
           /\.(mp4|webm|ogg|avi|mov|mkv|flv|wmv|m3u8)\?/i.test(url)
  }

  const isImage = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico|tiff|heic|heif|avif)$/i.test(url) ||
           /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico|tiff|heic|heif|avif)\?/i.test(url)
  }

  const getImageMimeType = (url: string): string => {
    const ext = url.toLowerCase().split(/[\?#]/)[0].split('.').pop() || ''
    const mimeMap: { [key: string]: string } = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'bmp': 'image/bmp',
      'ico': 'image/x-icon',
      'tiff': 'image/tiff',
      'heic': 'image/heic',
      'heif': 'image/heif',
      'avif': 'image/avif',
    }
    return mimeMap[ext] || 'image/jpeg'
  }

  return (
    <>
    <div className="max-w-2xl mx-auto p-3 sm:p-4 space-y-4 sm:space-y-6">
      {/* Error Alert */}
      {queryError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-900">Failed to load posts</p>
            <p className="text-sm text-red-800">{queryError.message || "An error occurred"}</p>
          </div>
        </div>
      )}

      {/* Create Post Card */}
      <Card className="border-border/50 mb-4 sm:mb-6 overflow-hidden">
        <CardContent className="p-3 sm:p-4">
          <div className="flex gap-4">
            <Avatar className="w-10 h-10 ring-2 ring-primary/20 flex-shrink-0 cursor-pointer" onClick={() => router.push(`/profile/${user?.id}`)}>
              <AvatarImage src={user?.profile_picture || undefined} />
              <AvatarFallback>{user?.display_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-3">
              <Textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="What's on your mind?"
                className="min-h-[80px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base placeholder:text-muted-foreground"
                rows={3}
              />

              {/* Selected Files Preview */}
              {postFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {postFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      {file.type.startsWith('image/') ? (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted">
                          <Image
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                          <Video className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveFile(index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Tags */}
              {postTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {postTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs"
                    >
                      #{tag}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-destructive"
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </span>
                  ))}
                </div>
              )}

              {/* Tag Input */}
              {showTagInput && (
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag..."
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                  />
                  <Button size="sm" onClick={handleAddTag} disabled={!tagInput.trim()}>
                    Add
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowTagInput(false)}>
                    Cancel
                  </Button>
                </div>
              )}

              {/* Location */}
              {postLocation && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {postLocation.name}
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-destructive"
                    onClick={() => setPostLocation(null)}
                  />
                </div>
              )}

              {/* Location Picker */}
              {showLocationPicker && (
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      placeholder="Search for a location..."
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                      className="pr-8"
                    />
                    {isSearchingLocation && (
                      <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>

                  {/* Location Suggestions */}
                  {locationSuggestions.length > 0 && (
                    <div className="max-h-40 overflow-y-auto border rounded-md bg-background">
                      {locationSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-muted transition-colors border-b last:border-b-0"
                          onClick={() => {
                            setPostLocation(suggestion)
                            setShowLocationPicker(false)
                            setLocationSearch("")
                            setLocationSuggestions([])
                          }}
                        >
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm">{suggestion.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowLocationPicker(false)
                        setLocationSearch("")
                        setLocationSuggestions([])
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="flex items-center gap-1 sm:gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    id="media-upload"
                    onChange={(e) => handleFileSelect(e.target.files)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => document.getElementById('media-upload')?.click()}
                    className="text-muted-foreground hover:text-foreground p-2 sm:px-3"
                    title="Photo"
                  >
                    <ImagePlus className="w-4 h-4" />
                    <span className="hidden sm:inline ml-2">Photo</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowLocationPicker(true)}
                    className="text-muted-foreground hover:text-foreground p-2 sm:px-3"
                    title="Location"
                  >
                    <MapPin className="w-4 h-4" />
                    <span className="hidden sm:inline ml-2">Location</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTagInput(true)}
                    className="text-muted-foreground hover:text-foreground p-2 sm:px-3"
                    title="Tag"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span className="hidden sm:inline ml-2">Tag</span>
                  </Button>

                  {isPremium && (
                    <div className="flex items-center gap-2 px-2 py-1 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                      <Checkbox
                        id="premium-post"
                        checked={isPremiumPost}
                        onCheckedChange={(checked) => handlePremiumCheckboxChange(checked as boolean)}
                        className="border-amber-300 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                      />
                      <label
                        htmlFor="premium-post"
                        className="text-xs font-medium text-amber-700 dark:text-amber-400 cursor-pointer flex items-center gap-1"
                      >
                        <Crown className="w-3 h-3" />
                        Premium
                      </label>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleCreatePost}
                  disabled={isCreatingPost || (!postContent.trim() && postFiles.length === 0)}
                  className="px-6"
                >
                  {isCreatingPost ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    "Post"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">Feed</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Feature Stats Cards - Removed for performance */}
      {/* <div className="mb-2">
        <FeatureCards />
      </div> */}

      {/* Posts */}
      {isLoading ? (
        // Initial loading skeletons
        Array.from({ length: 5 }).map((_, i) => <PostSkeleton key={i} />)
      ) : (
        <>
          {allPosts.map((post: Post, index: number) => {
            const mediaArray = getMediaArray(post.media)
            const currentMediaIndex = mediaCarouselIndex.get(post.id) || 0
            const mediaUrl = getMediaUrl(post.media, currentMediaIndex)
            const locationFlag = getFlagAssetFromLocation(post.location_name)
            const comments = postComments.get(post.id) || []
            const isExpanded = expandedComments.has(post.id)
            const commentValue = newComments.get(post.id) || ""
            const isSubmittingComment = submittingComment.get(post.id) || false
            const timeAgo = new Date(post.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })

            return (
              <Card
                key={post.id}
                data-post-id={post.id}
                className="border-border/50 overflow-hidden hover:shadow-md transition-shadow"
              >
                <CardContent className="p-3 sm:p-4">
                  {/* Post Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div 
                      className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => router.push(`/user/${post.user.id}`)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={post.user.profile_picture} alt={post.user.display_name} />
                        <AvatarFallback>{post.user.display_name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <Link href={`/user/${post.user.id}`} className="hover:underline">
                          <p className="font-semibold text-sm flex items-center gap-1.5">
                            <span>{post.user.display_name}</span>
                            {post.is_premium && (
                              <Crown className="w-4 h-4 text-amber-500" />
                            )}
                            <Image
                              src={locationFlag.src}
                              alt={`${locationFlag.name} flag`}
                              width={16}
                              height={16}
                              className="h-4 w-4 rounded-[2px] object-cover"
                              unoptimized
                            />
                          </p>
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          @{post.user.display_name || post.user.full_name} • {timeAgo}
                        </p>
                      </div>
                    </div>
                    <PostMenu 
                      postId={post.id} 
                      postAuthorId={post.user.id}
                      postLink={`${typeof window !== "undefined" ? window.location.origin : ""}/post/${post.id}`}
                      onDelete={() => handleDeletePost(post.id)} 
                    />
                  </div>

                  {/* Post Content */}
                  <div className="mb-4">
                    {post.user_id === session?.user?.id ? (
                      <Link href={`/user/${session?.user?.id}`}>
                        <p className="text-sm mb-3 cursor-pointer hover:text-primary transition-colors whitespace-pre-wrap">{post.content}</p>
                      </Link>
                    ) : (
                      <Link href={`/post/${post.id}`}>
                        <p className="text-sm mb-3 cursor-pointer hover:text-primary transition-colors whitespace-pre-wrap">{post.content}</p>
                      </Link>
                    )}

                    {/* Media */}
                    {mediaUrl && (
                      <div className="relative w-full rounded-lg overflow-hidden mb-4 bg-black">
                        <div
                          className="relative w-full bg-black flex items-center justify-center rounded-lg overflow-hidden"
                          onClick={() => post.user_id === session?.user?.id ? router.push(`/user/${session?.user?.id}`) : router.push(`/post/${post.id}`)}
                          data-media-id={`${post.id}-${currentMediaIndex}`}
                          data-is-video={isVideo(mediaUrl)}
                          ref={(el) => {
                            if (el && mediaObserverRef.current) {
                              mediaObserverRef.current.observe(el)
                            }
                          }}
                        >
                          {loadedImages.has(`${post.id}-${currentMediaIndex}`) ? (
                            isVideo(mediaUrl) ? (
                              <video
                                className="w-screen max-w-[calc(100vw-24px)] sm:max-w-[calc(100vw-32px)] max-h-[600px] object-contain"
                                src={mediaUrl}
                                controls
                                controlsList="nofullscreen nodownload"
                                disablePictureInPicture
                                playsInline
                                preload="metadata"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <track kind="captions" />
                                Your browser does not support this video format.
                              </video>
                            ) : (
                              <>
                                {/* Blurred background image */}
                                <div 
                                  className="absolute inset-0 rounded-lg"
                                  style={{
                                    backgroundImage: `url(${mediaUrl})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    filter: 'blur(40px) brightness(0.6)',
                                    zIndex: 0,
                                  }}
                                />
                                {/* Main image on top with soft edges */}
                                <Image
                                  src={mediaUrl}
                                  alt={`Post media ${currentMediaIndex + 1}`}
                                  width={1200}
                                  height={800}
                                  className="relative w-auto h-auto max-w-auto object-contain cursor-pointer z-10 rounded-lg"
                                  priority={false}
                                  sizes="100vw"
                                  style={{
                                    boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.3)'
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    post.user_id === session?.user?.id ? router.push(`/user/${session?.user?.id}`) : router.push(`/post/${post.id}`)
                                  }}
                                />
                              </>
                            )
                          ) : (
                            <div className="flex items-center justify-center w-full h-64 bg-muted">
                              <Loader2 className="w-8 h-8 animate-spin" />
                            </div>
                          )}
                        </div>

                        {/* Media Navigation */}
                        {mediaArray.length > 1 && (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white border-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                setMediaCarouselIndex(
                                  (prev) =>
                                    new Map(prev).set(
                                      post.id,
                                      currentMediaIndex === 0 ? mediaArray.length - 1 : currentMediaIndex - 1
                                    )
                                )
                              }}
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </Button>

                            <Button
                              variant="secondary"
                              size="sm"
                              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white border-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                setMediaCarouselIndex(
                                  (prev) =>
                                    new Map(prev).set(
                                      post.id,
                                      currentMediaIndex === mediaArray.length - 1 ? 0 : currentMediaIndex + 1
                                    )
                                )
                              }}
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Button>

                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                              {currentMediaIndex + 1} / {mediaArray.length}
                            </div>
                          </>
                        )}
                      </div>
                    )}

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {post.tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Location */}
                  {post.location_name && (
                    <div className="flex items-center text-xs text-muted-foreground mb-3">
                      <MapPin className="w-3 h-3 mr-1" />
                      {post.location_name}
                    </div>
                  )}
                </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4 pb-4 border-b border-border/50">
                    <span>{post.likes_count} likes</span>
                    <div className="flex gap-4">
                      <span>{post.comments_count} comments</span>
                      <span>{post.saves_count || 0} saves</span>
                      <span>{post.views_count || 0} views</span>
                    </div>
                  </div>

                  {/* Post Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(post.id)}
                        className={cn(
                          "flex items-center space-x-1 p-2 sm:px-3",
                          (likedPosts.get(post.id) || post.isLiked) && "text-red-500"
                        )}
                        title="Like"
                      >
                        <Heart className={cn("w-4 h-4", (likedPosts.get(post.id) || post.isLiked) && "fill-current")} />
                        <span className="hidden sm:inline text-xs">Like</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn("flex items-center space-x-1 p-2 sm:px-3", isExpanded && "text-primary")}
                        onClick={() => handleShowComments(post.id)}
                        title="Comment"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span className="hidden sm:inline text-xs">Comment</span>
                      </Button>

                      <Button variant="ghost" size="sm" className="flex items-center space-x-1 p-2 sm:px-3" title="Share">
                        <Share2 className="w-4 h-4" />
                        <span className="hidden sm:inline text-xs">Share</span>
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSave(post.id)}
                      className={cn(
                        "flex items-center space-x-1 p-2 sm:px-3",
                        (savedPosts.get(post.id) || post.isSaved) && "text-blue-500"
                      )}
                      title="Save"
                    >
                      <Bookmark className={cn("w-4 h-4", (savedPosts.get(post.id) || post.isSaved) && "fill-current")} />
                      <span className="hidden sm:inline text-xs">Save</span>
                    </Button>
                  </div>

                  {/* Comments Section */}
                  {isExpanded && (
                    <div className="space-y-3 pt-4 border-t border-border/50">
                      {user && (
                        <div className="space-y-2">
                          <Textarea
                            placeholder="Write a comment..."
                            value={commentValue}
                            onChange={(e) => setNewComments((prev) => new Map(prev).set(post.id, e.target.value))}
                            className="min-h-20 text-sm"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleSubmitComment(post.id)}
                            disabled={isSubmittingComment || !commentValue.trim()}
                            className="w-full"
                          >
                            {isSubmittingComment ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                Posting...
                              </>
                            ) : (
                              "Post Comment"
                            )}
                          </Button>
                        </div>
                      )}

                      {comments.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first!</p>
                      ) : (
                        <div className="space-y-3">
                          {comments.slice(0, 2).map((comment: any) => (
                            <div key={comment.id} className="flex gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={comment.user?.profile_picture} />
                                <AvatarFallback>{comment.user?.display_name?.[0]}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="bg-muted rounded-lg px-3 py-2">
                                  <Link href={`/profile/${comment.user?.id}`} className="font-semibold text-sm hover:underline">
                                    {comment.user?.display_name}
                                  </Link>
                                  <p className="text-sm text-foreground">{comment.content}</p>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(comment.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          ))}

                          {comments.length > 2 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full text-primary text-xs"
                            >
                              <ChevronDown className="w-3 h-3 mr-1" />
                              Show {comments.length - 2} more comments
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
              </CardContent>
            </Card>
          )})}

          {/* Empty state */}
          {allPosts.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No posts yet</p>
              <Button>Create the first post</Button>
            </div>
          )}

          {/* Load More Button */}
          {allPosts.length > 0 && hasNextPage && (
            <div className="text-center py-8">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={isFetchingNextPage}
                className="min-w-32"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </Button>
            </div>
          )}

          {/* No more posts indicator */}
          {allPosts.length > 0 && !hasNextPage && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              You've reached the end of the feed
            </div>
          )}
        </>
      )}
    </div>

    {/* Premium Post Explanation Modal */}
    <Dialog open={showPremiumModal} onOpenChange={setShowPremiumModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            Premium Post
          </DialogTitle>
          <DialogDescription>
            Make this post exclusive to premium members only
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>When you mark a post as premium:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Only premium users can see this post in their feed</li>
              <li>Non-premium users won't see it on your profile</li>
              <li>The post will display a premium crown badge</li>
              <li>Perfect for exclusive content, special updates, or premium-only offers</li>
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancelPremiumPost}>
            Cancel
          </Button>
          <Button onClick={handleConfirmPremiumPost} className="gradient-bg">
            Make Premium
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
