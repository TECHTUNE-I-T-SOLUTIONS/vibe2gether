"use client"

import { useState, useEffect } from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MapPin, Link as LinkIcon, Calendar, Loader2, ArrowLeft, Heart, MessageCircle, Bookmark } from "lucide-react"
import { useUserProfile } from "@/hooks/use-user-profile"
import { useToast } from "@/hooks/use-toast"
import { getUserPosts, deletePost } from "@/lib/supabase/queries"
import { cn } from "@/lib/utils"
import { PostMenu } from "@/components/post-menu"

export default function UserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const router = useRouter()
  const { user: currentUser } = useUserProfile()
  const { toast } = useToast()
  const unwrappedParams = use(params)
  const [user, setUser] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)

  useEffect(() => {
    fetchUserProfile()
  }, [unwrappedParams.userId])

  async function fetchUserProfile() {
    try {
      setLoading(true)
      const { data: posts } = await getUserPosts(unwrappedParams.userId, 10, 0)
      
      if (posts && posts.length > 0) {
        setUser(posts[0].user)
        setPosts(posts)
      }
    } catch (err) {
      console.error("Failed to fetch user profile:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePost = async (postId: string) => {
    try {
      const { error } = await deletePost(postId)
      if (error) throw error

      // Remove from posts list
      setPosts((prev) => prev.filter((post) => post.id !== postId))

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Card className="border-border/50 p-12 text-center">
          <p className="text-muted-foreground">User not found</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Back Button */}
      <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      {/* Profile Card */}
      <Card className="border-border/50 mb-6 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <Avatar className="w-24 h-24 ring-2 ring-primary/20">
              <AvatarImage src={user.profile_picture} />
              <AvatarFallback>{user.display_name?.[0] || "U"}</AvatarFallback>
            </Avatar>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold">{user.display_name}</h1>
                  {user.email && (
                    <p className="text-muted-foreground">@{user.email.split("@")[0]}</p>
                  )}
                </div>
                {currentUser?.id !== user.id && (
                  <Button
                    variant={isFollowing ? "outline" : "default"}
                    onClick={() => setIsFollowing(!isFollowing)}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </Button>
                )}
              </div>

              {user.bio && (
                <p className="text-sm text-foreground mb-4">{user.bio}</p>
              )}

              {/* User Meta */}
              <div className="flex gap-4 text-sm text-muted-foreground flex-wrap">
                {user.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {user.location}
                  </div>
                )}
                {user.website && (
                  <a href={user.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
                    <LinkIcon className="w-4 h-4" />
                    Website
                  </a>
                )}
                {user.created_at && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined {new Date(user.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-6 mt-4 text-sm">
                <div>
                  <p className="font-semibold">{posts.length}</p>
                  <p className="text-muted-foreground">Posts</p>
                </div>
                <div>
                  <p className="font-semibold">{user.followers_count || 0}</p>
                  <p className="text-muted-foreground">Followers</p>
                </div>
                <div>
                  <p className="font-semibold">{user.following_count || 0}</p>
                  <p className="text-muted-foreground">Following</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts */}
      <div>
        <h2 className="text-xl font-bold mb-4">Posts</h2>
        {posts.length === 0 ? (
          <Card className="border-border/50 p-12 text-center">
            <p className="text-muted-foreground">No posts yet</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id} className="border-border/50 overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  {/* Post Header with Menu */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1" />
                    {currentUser && currentUser.id === unwrappedParams.userId && (
                      <PostMenu
                        postId={post.id}
                        postAuthorId={post.user_id}
                        postLink={`${typeof window !== "undefined" ? window.location.origin : ""}/post/${post.id}`}
                        onDelete={handleDeletePost}
                      />
                    )}
                  </div>

                  {/* Post Content */}
                  <p className="text-sm text-foreground mb-3 line-clamp-3">{post.content}</p>

                  {/* Media Preview */}
                  {post.media && post.media.length > 0 && (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden mb-3 bg-muted">
                      <Image
                        src={post.media[0].url || post.media[0]}
                        alt="Post media"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap mb-3">
                      {post.tags.slice(0, 3).map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>{post.likes_count || 0} likes</span>
                    <span>{post.comments_count || 0} comments</span>
                    <span>{post.views_count || 0} views</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
