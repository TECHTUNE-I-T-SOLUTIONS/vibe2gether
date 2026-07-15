"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { uploadPostMedia } from "@/lib/supabase/storage"
import { createPost } from "@/lib/supabase/queries"
import { Card, CardContent } from "@/components/ui/card"
import { useUserProfile } from "@/hooks/use-user-profile"
import { usePremiumCheck } from "@/hooks/use-premium-check"
import { LocationPicker } from "@/components/location-picker"
import { Crown } from "lucide-react"

export default function CreatePostPage() {
  const { data: session, status } = useSession()
  const { user } = useUserProfile()
  const { isPremium } = usePremiumCheck()
  const router = useRouter()
  const [content, setContent] = useState("")
  const [isPremiumPost, setIsPremiumPost] = useState(false)

  // Auth check
  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])
  const [files, setFiles] = useState<File[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [location, setLocation] = useState<{
    name: string
    latitude: number
    longitude: number
  } | null>(null)
  const [isPublic, setIsPublic] = useState(true)
  const [allowComments, setAllowComments] = useState(true)
  const [loading, setLoading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleAddTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) {
      setTags((prev) => [...prev, t])
    }
    setTagInput("")
  }

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    
    // Validate file sizes
    const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
    const invalidFiles = selected.filter(f => f.size > MAX_FILE_SIZE)
    
    if (invalidFiles.length > 0) {
      setUploadError(`${invalidFiles.length} file(s) exceed 100MB limit`)
      return
    }
    
    // Warn about large files
    const largeFiles = selected.filter(f => f.size > 20 * 1024 * 1024)
    if (largeFiles.length > 0) {
      console.log(`⚠️ ${largeFiles.length} large file(s) detected - upload may take 1-5 minutes`)
    }
    
    setUploadError(null)
    setFiles((prev) => [...prev, ...selected].slice(0, 6))
  }

  const handleSubmit = async () => {
    if (!user) return alert('Please sign in to post')
    if (!content.trim()) return alert('Please add some content')
    setLoading(true)
    setUploadError(null)
    try {
      const mediaUrls: any[] = []
      for (const f of files) {
        const { url, error } = await uploadPostMedia(user.id, f)
        if (error) throw error
        mediaUrls.push({ url })
      }

      const { data, error } = await createPost(
        user.id,
        content,
        mediaUrls,
        tags,
        location?.name,
        location?.latitude,
        location?.longitude,
        isPublic,
        allowComments,
        isPremiumPost
      )
      if (error) throw error

      router.push('/dashboard/feed')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create post'
      setUploadError(errorMessage)
      console.error('Failed to create post', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <Card className="border-border/50 mb-6">
        <CardContent className="pt-6">
          {/* Error Display */}
          {uploadError && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive font-medium">{uploadError}</p>
              <p className="text-xs text-destructive/70 mt-1">Max file size: 100MB. Large files (20MB+) may take 1-5 minutes to upload.</p>
            </div>
          )}
          
          {/* Content Section */}
          <div className="space-y-4 mb-6">
            <div>
              <Label htmlFor="content" className="text-base font-semibold">What's on your mind?</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your thoughts, experiences, or stories..."
                className="w-full min-h-[120px] mt-2 rounded-lg border border-border/50"
              />
              <p className="text-xs text-muted-foreground mt-1">{content.length} characters</p>
            </div>
          </div>

          {/* Media Section */}
          <div className="space-y-4 mb-6">
            <div>
              <Label htmlFor="media" className="text-base font-semibold">Media (up to 6 files, max 100MB each)</Label>
              <input
                id="media"
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFiles}
                className="mt-2 w-full p-2 border border-border/50 rounded-lg cursor-pointer"
              />
              <p className="text-xs text-muted-foreground mt-1">Large videos (20MB+) may take a few minutes to upload</p>
              {files.length > 0 && (
                <>
                  <p className="text-xs text-muted-foreground mt-3 mb-3">
                    {files.length} file(s) - Total: {(files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(1)}MB
                  </p>
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {files.map((f, i) => (
                      <div key={i} className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted border border-border/50 group">
                        <Image src={URL.createObjectURL(f)} alt={f.name} fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                          <p className="text-white text-xs font-medium text-center px-1 truncate">{f.name}</p>
                          <p className="text-white/80 text-xs">{(f.size / 1024 / 1024).toFixed(1)}MB</p>
                        </div>
                        <button
                          onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Location Section */}
          <div className="space-y-4 mb-6">
            <LocationPicker
              currentLocation={location}
              onLocationSelect={(selectedLocation) => setLocation(selectedLocation)}
            />
          </div>

          {/* Tags Section */}
          <div className="space-y-4 mb-6">
            <div>
              <Label htmlFor="tags" className="text-base font-semibold">Tags</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add tag and press Enter"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                />
                <Button onClick={handleAddTag} variant="outline">Add</Button>
              </div>
              {tags.length > 0 && (
                <div className="mt-3 flex gap-2 flex-wrap">
                  {tags.map((t, i) => (
                    <div key={i} className="px-3 py-1 rounded-full bg-muted text-sm flex items-center gap-2">
                      #{t}
                      <button
                        onClick={() => setTags(prev => prev.filter((_, idx) => idx !== i))}
                        className="text-xs hover:text-red-500"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Settings Section */}
          <div className="space-y-4 mb-6 p-4 rounded-lg bg-muted/30 border border-border/50">
            <Label className="text-base font-semibold">Post Settings</Label>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isPublic"
                  checked={isPublic}
                  onCheckedChange={(checked) => setIsPublic(checked as boolean)}
                />
                <Label htmlFor="isPublic" className="text-sm cursor-pointer">Make this post public</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="allowComments"
                  checked={allowComments}
                  onCheckedChange={(checked) => setAllowComments(checked as boolean)}
                />
                <Label htmlFor="allowComments" className="text-sm cursor-pointer">Allow comments on this post</Label>
              </div>
              {isPremium && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isPremiumPost"
                    checked={isPremiumPost}
                    onCheckedChange={(checked) => setIsPremiumPost(checked as boolean)}
                  />
                  <Label htmlFor="isPremiumPost" className="text-sm cursor-pointer flex items-center gap-1">
                    <Crown className="w-4 h-4 text-amber-500" />
                    Make this a premium post
                  </Label>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-border/50">
            <Button
              className="rounded-full gradient-bg"
              onClick={handleSubmit}
              disabled={loading || !content.trim()}
            >
              {loading ? 'Posting...' : 'Post'}
            </Button>
            <Button variant="outline" onClick={() => router.push('/dashboard/feed')}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
