"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Eye,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Coins,
  Send,
  Sparkles,
  BadgeCheck,
  Flag,
  UserX,
  Copy,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"

interface Media {
  type: "image" | "video"
  url: string
  thumbnail?: string
}

interface PostAuthor {
  id: string
  name: string
  username: string
  avatar: string
  verified: boolean
  online: boolean
}

interface ThreadPostProps {
  id: string
  author: PostAuthor
  content: string
  tags?: string[]
  media: Media[]
  likes: number
  comments: number
  views: number
  shares: number
  coinsEarned: number
  timestamp: string
  isLiked?: boolean
  isSaved?: boolean
  onDelete?: (id: string) => void
}

const COIN_RATES = {
  views: { amount: 10, coins: 1 },
  likes: { amount: 1, coins: 5 },
  follows: { amount: 1, coins: 10 },
}

export function ThreadPost({
  id,
  author,
  content,
  tags = [],
  media,
  likes,
  comments,
  views,
  shares,
  coinsEarned,
  timestamp,
  isLiked = false,
  isSaved = false,
  onDelete,
}: ThreadPostProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0)
  const [liked, setLiked] = useState(isLiked)
  const [saved, setSaved] = useState(isSaved)
  const [likeCount, setLikeCount] = useState(likes)
  const [viewCount, setViewCount] = useState(views)
  const [shareCount, setShareCount] = useState(shares)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [showControls, setShowControls] = useState(false)
  const [showCoinAnimation, setShowCoinAnimation] = useState(false)
  const [earnedCoin, setEarnedCoin] = useState(0)
  const [likeAnimation, setLikeAnimation] = useState(false)
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number; y: number }[]>([])
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [hasViewed, setHasViewed] = useState(false)

  // Track view when post comes into view
  const trackView = useCallback(async () => {
    if (hasViewed) return
    setHasViewed(true)
    try {
      await fetch("/api/posts/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: id }),
      })
      setViewCount((prev) => prev + 1)
    } catch (error) {
      console.error("Failed to track view:", error)
    }
  }, [id, hasViewed])

  // Intersection observer for view tracking
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          trackView()
        }
      },
      { threshold: 0.5 },
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [trackView])

  // Handle swipe gestures for media carousel with spring animation
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
    setIsDragging(true)
    setIsTransitioning(false)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentTouch = e.targetTouches[0].clientX
    setTouchEnd(currentTouch)
    if (isDragging) {
      setDragOffset(currentTouch - touchStart)
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    setIsTransitioning(true)
    setDragOffset(0)
    if (touchStart - touchEnd > 75 && currentMediaIndex < media.length - 1) {
      setCurrentMediaIndex((prev) => prev + 1)
    }
    if (touchEnd - touchStart > 75 && currentMediaIndex > 0) {
      setCurrentMediaIndex((prev) => prev - 1)
    }
    setTouchStart(0)
    setTouchEnd(0)
  }

  // Handle mouse drag for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    setTouchStart(e.clientX)
    setIsDragging(true)
    setIsTransitioning(false)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setTouchEnd(e.clientX)
      setDragOffset(e.clientX - touchStart)
    }
  }

  const handleMouseUp = () => {
    if (isDragging) {
      setIsTransitioning(true)
      setDragOffset(0)
      if (touchStart - touchEnd > 75 && currentMediaIndex < media.length - 1) {
        setCurrentMediaIndex((prev) => prev + 1)
      }
      if (touchEnd - touchStart > 75 && currentMediaIndex > 0) {
        setCurrentMediaIndex((prev) => prev - 1)
      }
    }
    setIsDragging(false)
    setTouchStart(0)
    setTouchEnd(0)
  }

  const handleLike = async () => {
    const newLiked = !liked
    setLiked(newLiked)
    setLikeCount((prev) => (newLiked ? prev + 1 : prev - 1))

    if (newLiked) {
      // Trigger like animation
      setLikeAnimation(true)
      setTimeout(() => setLikeAnimation(false), 600)

      // Add floating hearts
      const newHearts = Array.from({ length: 5 }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 100 - 50,
        y: Math.random() * -50 - 20,
      }))
      setFloatingHearts(newHearts)
      setTimeout(() => setFloatingHearts([]), 1000)

      // Show coin earned animation
      setEarnedCoin(COIN_RATES.likes.coins)
      setShowCoinAnimation(true)
      setTimeout(() => setShowCoinAnimation(false), 1500)
    }

    // API call
    try {
      await fetch("/api/posts/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: id }),
      })
    } catch (error) {
      // Revert on error
      setLiked(!newLiked)
      setLikeCount((prev) => (!newLiked ? prev + 1 : prev - 1))
    }
  }

  const handleSave = async () => {
    const newSaved = !saved
    setSaved(newSaved)

    try {
      await fetch("/api/posts/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: id }),
      })
      toast({
        title: newSaved ? "Post saved" : "Post unsaved",
        description: newSaved ? "Added to your saved posts" : "Removed from saved posts",
      })
    } catch (error) {
      setSaved(!newSaved)
    }
  }

  const handleShare = async () => {
    setShareCount((prev) => prev + 1)

    try {
      await fetch("/api/posts/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: id }),
      })

      if (navigator.share) {
        await navigator.share({
          title: `Post by ${author.name}`,
          text: content.substring(0, 100),
          url: `${window.location.origin}/post/${id}`,
        })
      } else {
        await navigator.clipboard.writeText(`${window.location.origin}/post/${id}`)
        toast({ title: "Link copied!", description: "Post link copied to clipboard" })
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        setShareCount((prev) => prev - 1)
      }
    }
  }

  const [lastTap, setLastTap] = useState(0)
  const handleDoubleTap = () => {
    const now = Date.now()
    if (now - lastTap < 300 && !liked) {
      handleLike()
    }
    setLastTap(now)
  }

  const toggleVideo = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && currentMediaIndex > 0) {
        setIsTransitioning(true)
        setCurrentMediaIndex((prev) => prev - 1)
      }
      if (e.key === "ArrowRight" && currentMediaIndex < media.length - 1) {
        setIsTransitioning(true)
        setCurrentMediaIndex((prev) => prev + 1)
      }
    }

    containerRef.current?.addEventListener("keydown", handleKeyDown as unknown as EventListener)
    return () => containerRef.current?.removeEventListener("keydown", handleKeyDown as unknown as EventListener)
  }, [currentMediaIndex, media.length])

  const isOwner = session?.user?.id === author.id

  return (
    <motion.article
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-card border-b border-border transition-all duration-300 hover:bg-muted/30"
    >
      <div className="p-4">
        {/* Author Header */}
        <div className="flex items-start gap-3">
          <Link href={`/profile/${author.id}`} className="relative flex-shrink-0">
            <Avatar className="w-10 h-10 ring-2 ring-primary/20 transition-transform hover:scale-105">
              <AvatarImage src={author.avatar || "/placeholder.svg"} alt={author.name} />
              <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-600 text-white">
                {author.name[0]}
              </AvatarFallback>
            </Avatar>
            {author.online && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full"
              />
            )}
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link href={`/profile/${author.id}`} className="font-semibold hover:underline truncate">
                {author.name}
              </Link>
              {author.verified && <BadgeCheck className="w-4 h-4 text-primary fill-primary/20 flex-shrink-0" />}
              <span className="text-muted-foreground text-sm">@{author.username}</span>
              <span className="text-muted-foreground text-sm">·</span>
              <span className="text-muted-foreground text-sm">{timestamp}</span>
            </div>

            {/* Post Content */}
            <p className="mt-2 text-foreground whitespace-pre-wrap leading-relaxed">{content}</p>

            {/* Tags */}
            {tags && tags.length > 0 && (
              <div className="mt-2 flex gap-2 flex-wrap">
                {tags.map((t, i) => (
                  <Badge key={i} variant="secondary">#{t}</Badge>
                ))}
              </div>
            )
          </div>

          {/* More Options Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full flex-shrink-0">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(`${window.location.origin}/post/${id}`)}>
                <Copy className="w-4 h-4 mr-2" />
                Copy link
              </DropdownMenuItem>
              {isOwner ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete?.(id)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete post
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem>
                    <UserX className="w-4 h-4 mr-2" />
                    Unfollow @{author.username}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive">
                    <Flag className="w-4 h-4 mr-2" />
                    Report post
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Media Carousel - Enhanced Thread Style with Animations */}
        {media.length > 0 && (
          <div
            className="mt-3 ml-13 relative rounded-2xl overflow-hidden bg-muted"
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
          >
            <div
              className="relative aspect-[4/5] md:aspect-video cursor-grab active:cursor-grabbing select-none overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onClick={handleDoubleTap}
            >
              <motion.div
                className="flex h-full"
                animate={{
                  x: `calc(-${currentMediaIndex * 100}% + ${dragOffset}px)`,
                }}
                transition={
                  isTransitioning
                    ? {
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }
                    : { duration: 0 }
                }
                style={{ width: `${media.length * 100}%` }}
              >
                {media.map((item, index) => (
                  <div
                    key={index}
                    className="relative flex-shrink-0 h-full"
                    style={{ width: `${100 / media.length}%` }}
                  >
                    {item.type === "image" ? (
                      <Image
                        src={item.url || "/placeholder.svg"}
                        alt={`Post media ${index + 1}`}
                        fill
                        className="object-cover"
                        draggable={false}
                      />
                    ) : (
                      <div className="relative w-full h-full">
                        <video
                          ref={index === currentMediaIndex ? videoRef : undefined}
                          src={item.url}
                          poster={item.thumbnail}
                          className="w-full h-full object-cover"
                          loop
                          muted={isMuted}
                          playsInline
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleVideo()
                          }}
                        />
                        {/* Video Controls Overlay */}
                        <AnimatePresence>
                          {(showControls || !isPlaying) && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-0 flex items-center justify-center bg-black/20"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleVideo()
                              }}
                            >
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  className="w-14 h-14 rounded-full bg-white/90 hover:bg-white shadow-lg"
                                >
                                  {isPlaying ? (
                                    <Pause className="w-6 h-6 text-foreground" />
                                  ) : (
                                    <Play className="w-6 h-6 text-foreground ml-1" />
                                  )}
                                </Button>
                              </motion.div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        {/* Mute Button */}
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 transition-all duration-200"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleMute()
                          }}
                        >
                          {isMuted ? (
                            <VolumeX className="w-4 h-4 text-white" />
                          ) : (
                            <Volume2 className="w-4 h-4 text-white" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>

              {/* Like Animation */}
              <AnimatePresence>
                {likeAnimation && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                  >
                    <Heart className="w-24 h-24 text-primary fill-primary" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Floating Hearts */}
              <AnimatePresence>
                {floatingHearts.map((heart) => (
                  <motion.div
                    key={heart.id}
                    initial={{ opacity: 1, y: 0, x: 0, scale: 0 }}
                    animate={{
                      opacity: 0,
                      y: heart.y - 100,
                      x: heart.x,
                      scale: 1,
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="absolute top-1/2 left-1/2 pointer-events-none z-20"
                  >
                    <Heart className="w-6 h-6 text-primary fill-primary" />
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Navigation Arrows with animation */}
              {media.length > 1 && (
                <>
                  <AnimatePresence>
                    {currentMediaIndex > 0 && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="absolute left-2 top-1/2 -translate-y-1/2"
                      >
                        <Button
                          variant="secondary"
                          size="icon"
                          className="w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-lg hover:scale-110 transition-transform"
                          onClick={(e) => {
                            e.stopPropagation()
                            setIsTransitioning(true)
                            setCurrentMediaIndex((prev) => Math.max(0, prev - 1))
                          }}
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <AnimatePresence>
                    {currentMediaIndex < media.length - 1 && (
                      <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                      >
                        <Button
                          variant="secondary"
                          size="icon"
                          className="w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-lg hover:scale-110 transition-transform"
                          onClick={(e) => {
                            e.stopPropagation()
                            setIsTransitioning(true)
                            setCurrentMediaIndex((prev) => Math.min(media.length - 1, prev + 1))
                          }}
                        >
                          <ChevronRight className="w-5 h-5" />
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}

              {/* Dots Indicator */}
              {media.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/30 px-2 py-1 rounded-full backdrop-blur-sm">
                  {media.map((_, index) => (
                    <motion.button
                      key={index}
                      animate={{
                        width: index === currentMediaIndex ? 24 : 8,
                        backgroundColor: index === currentMediaIndex ? "#fff" : "rgba(255,255,255,0.5)",
                      }}
                      className="h-2 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsTransitioning(true)
                        setCurrentMediaIndex(index)
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Media Counter */}
              {media.length > 1 && (
                <Badge className="absolute top-3 right-3 bg-black/50 text-white border-0 backdrop-blur-sm">
                  {currentMediaIndex + 1}/{media.length}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Engagement Actions */}
        <div className="mt-3 ml-13 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {/* Like with animation */}
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="sm"
                className={cn("rounded-full gap-1.5 transition-all duration-200 group", liked && "text-primary")}
                onClick={handleLike}
              >
                <motion.div animate={liked ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.3 }}>
                  <Heart className={cn("w-5 h-5", liked && "fill-current")} />
                </motion.div>
                <span className="text-sm">{likeCount > 0 && likeCount.toLocaleString()}</span>
              </Button>
            </motion.div>

            {/* Comment */}
            <Link href={`/post/${id}`}>
              <Button variant="ghost" size="sm" className="rounded-full gap-1.5 group">
                <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                <span className="text-sm">{comments > 0 && comments.toLocaleString()}</span>
              </Button>
            </Link>

            {/* Share */}
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button variant="ghost" size="sm" className="rounded-full gap-1.5 group" onClick={handleShare}>
                <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                <span className="text-sm">{shareCount > 0 && shareCount.toLocaleString()}</span>
              </Button>
            </motion.div>

            {/* Send/DM */}
            <Button variant="ghost" size="sm" className="rounded-full group">
              <Send className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            {/* Views & Coins */}
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <Eye className="w-4 h-4" />
              <span>{viewCount.toLocaleString()}</span>
            </div>

            {coinsEarned > 0 && (
              <div className="relative">
                <motion.div
                  className="flex items-center gap-1 text-amber-500 text-sm font-medium"
                  animate={showCoinAnimation ? { scale: [1, 1.2, 1] } : {}}
                >
                  <Coins className="w-4 h-4" />
                  <span>+{coinsEarned}</span>
                </motion.div>

                {/* Coin earned animation popup */}
                <AnimatePresence>
                  {showCoinAnimation && (
                    <motion.div
                      initial={{ opacity: 0, y: 0 }}
                      animate={{ opacity: 1, y: -30 }}
                      exit={{ opacity: 0, y: -50 }}
                      className="absolute -top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 text-amber-500 font-bold whitespace-nowrap"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>+{earnedCoin}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Bookmark with animation */}
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                className={cn("rounded-full w-8 h-8 transition-all duration-200 group", saved && "text-amber-500")}
                onClick={handleSave}
              >
                <motion.div animate={saved ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.3 }}>
                  <Bookmark className={cn("w-5 h-5", saved && "fill-current")} />
                </motion.div>
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Coin Info Banner */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-3 ml-13 flex items-center gap-4 text-xs text-muted-foreground bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg px-3 py-2 border border-amber-500/20"
        >
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            <span>
              {COIN_RATES.views.amount} views = {COIN_RATES.views.coins} coin
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Heart className="w-3 h-3" />
            <span>
              {COIN_RATES.likes.amount} like = {COIN_RATES.likes.coins} coins
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Coins className="w-3 h-3 text-amber-500" />
            <span className="text-amber-600 dark:text-amber-400 font-medium">Coins = Money</span>
          </div>
        </motion.div>
      </div>
    </motion.article>
  )
}
