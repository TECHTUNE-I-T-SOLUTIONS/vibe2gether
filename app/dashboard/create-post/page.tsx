"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { uploadPostMedia } from "@/lib/supabase/storage"
import { createPost } from "@/lib/supabase/queries"
import { Card, CardContent } from "@/components/ui/card"
import { useUserProfile } from "@/hooks/use-user-profile"

export default function CreatePostPage() {
  const { user } = useUserProfile()
  const router = useRouter()
  const [content, setContent] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [loading, setLoading] = useState(false)

  const handleAddTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) {
      setTags((prev) => [...prev, t])
    }
    setTagInput("")
  }

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    setFiles((prev) => [...prev, ...selected].slice(0, 6))
  }

  const handleSubmit = async () => {
    if (!user) return alert('Please sign in to post')
    setLoading(true)
    try {
      const mediaUrls: any[] = []
      for (const f of files) {
        const { url, error } = await uploadPostMedia(user.id, f)
        if (error) throw error
        mediaUrls.push({ url })
      }

      const { data, error } = await createPost(user.id, content, mediaUrls, tags)
      if (error) throw error

      router.push('/dashboard/feed')
    } catch (err) {
      console.error('Failed to create post', err)
      alert('Failed to create post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <Card className="border-border/50 mb-6">
        <CardContent>
          <div>
            <Label>What's on your mind?</Label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} className="w-full min-h-[120px] mt-1 p-3 rounded-md border" />
          </div>

          <div className="mt-4">
            <Label>Media</Label>
            <input type="file" accept="image/*,video/*" multiple onChange={handleFiles} className="mt-1" />
            <div className="mt-3 flex gap-2 flex-wrap">
              {files.map((f, i) => (
                <div key={i} className="relative w-24 h-24 rounded-md overflow-hidden bg-muted">
                  <Image src={URL.createObjectURL(f)} alt={f.name} fill className="object-cover" />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <Label>Tags</Label>
            <div className="flex gap-2 mt-2">
              <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Add tag and press Enter" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag() } }} />
              <Button onClick={handleAddTag}>Add</Button>
            </div>
            <div className="mt-2 flex gap-2 flex-wrap">
              {tags.map((t, i) => (
                <span key={i} className="px-3 py-1 rounded-full bg-muted text-sm">#{t}</span>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <Button className="rounded-full gradient-bg" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Posting...' : 'Post'}
            </Button>
            <Button variant="outline" onClick={() => router.push('/dashboard/feed')}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
