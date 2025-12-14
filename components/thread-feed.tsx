"use client"

import { useState } from "react"
import { ThreadPost } from "./thread-post"
import { CreatePost } from "./create-post"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useI18n } from "@/lib/i18n/context"

// Sample posts data
const samplePosts = [
  {
    id: "1",
    author: {
      id: "u1",
      name: "Emma Rodriguez",
      username: "emma_vibes",
      avatar: "/beautiful-latina-woman-portrait.jpg",
      verified: true,
      online: true,
    },
    content:
      "Just had the most amazing sunset dinner date! Sometimes the simple moments are the most romantic. Who else believes in spontaneous adventures?",
    media: [
      { type: "image" as const, url: "/romantic-sunset-dinner-on-beach.jpg" },
      { type: "image" as const, url: "/couple-sunset-hands.png" },
      { type: "image" as const, url: "/beautiful-beach-dinner-setup.jpg" },
    ],
    likes: 1247,
    comments: 89,
    views: 15420,
    shares: 34,
    coinsEarned: 156,
    timestamp: "2h",
    isLiked: false,
    isSaved: false,
  },
  {
    id: "2",
    author: {
      id: "u2",
      name: "James Chen",
      username: "james_traveler",
      avatar: "/handsome-asian-man-portrait.png",
      verified: true,
      online: false,
    },
    content:
      "Found my soulmate on Vibe2Gether 6 months ago. Today we're celebrating in Paris! Don't give up on love, your person is out there.",
    media: [
      { type: "image" as const, url: "/couple-in-front-of-eiffel-tower-paris-romantic.jpg" },
      { type: "image" as const, url: "/romantic-paris-cafe-couple.jpg" },
    ],
    likes: 3891,
    comments: 245,
    views: 42100,
    shares: 187,
    coinsEarned: 421,
    timestamp: "4h",
    isLiked: true,
    isSaved: true,
  },
  {
    id: "3",
    author: {
      id: "u3",
      name: "Sofia Martinez",
      username: "sofia_dreams",
      avatar: "/beautiful-spanish-woman-portrait.jpg",
      verified: false,
      online: true,
    },
    content:
      "Self-love is the best love. Taking myself on a date today because I deserve it! Who else practices solo dates?",
    media: [{ type: "image" as const, url: "/woman-at-fancy-restaurant-self-care.jpg" }],
    likes: 892,
    comments: 67,
    views: 8930,
    shares: 23,
    coinsEarned: 89,
    timestamp: "5h",
    isLiked: false,
    isSaved: false,
  },
  {
    id: "4",
    author: {
      id: "u4",
      name: "Marcus Williams",
      username: "marcus_fit",
      avatar: "/fit-african-american-man-portrait.jpg",
      verified: true,
      online: true,
    },
    content:
      "Morning workout with my partner hits different. Find someone who motivates you to be better every single day!",
    media: [
      { type: "image" as const, url: "/couple-working-out-gym-together.jpg" },
      { type: "image" as const, url: "/couple-running-together-sunrise.jpg" },
      { type: "image" as const, url: "/healthy-breakfast-couple.jpg" },
      { type: "image" as const, url: "/couple-yoga-meditation.jpg" },
    ],
    likes: 2156,
    comments: 134,
    views: 28900,
    shares: 78,
    coinsEarned: 289,
    timestamp: "8h",
    isLiked: false,
    isSaved: false,
  },
  {
    id: "5",
    author: {
      id: "u5",
      name: "Yuki Tanaka",
      username: "yuki_art",
      avatar: "/japanese-woman-artist-portrait.jpg",
      verified: false,
      online: false,
    },
    content: "Made this digital art piece for my girlfriend's birthday. Art is the ultimate love language!",
    media: [
      { type: "image" as const, url: "/romantic-digital-art-couple-illustration.jpg" },
      { type: "image" as const, url: "/couple-portrait-drawing-art.jpg" },
    ],
    likes: 4521,
    comments: 312,
    views: 56700,
    shares: 423,
    coinsEarned: 567,
    timestamp: "12h",
    isLiked: false,
    isSaved: false,
  },
]

type FeedTab = "forYou" | "following" | "trending"

export function ThreadFeed() {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<FeedTab>("forYou")
  const [posts, setPosts] = useState(samplePosts)

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Feed Tabs */}
      <div className="sticky top-16 md:top-20 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FeedTab)} className="w-full">
          <TabsList className="w-full h-12 bg-transparent p-0 gap-0">
            <TabsTrigger
              value="forYou"
              className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              For You
            </TabsTrigger>
            <TabsTrigger
              value="following"
              className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Following
            </TabsTrigger>
            <TabsTrigger
              value="trending"
              className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Trending
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Create Post */}
      <CreatePost />

      {/* Posts Feed */}
      <div className="divide-y divide-border">
        {posts.map((post, index) => (
          <div
            key={post.id}
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <ThreadPost {...post} />
          </div>
        ))}
      </div>
    </div>
  )
}
