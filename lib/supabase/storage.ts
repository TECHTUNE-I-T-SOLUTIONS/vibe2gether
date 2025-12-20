import { createClient } from './client'

// ============================================================
// STORAGE OPERATIONS
// ============================================================

export async function uploadProfilePicture(userId: string, file: File) {
  try {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("type", "profile")
    formData.append("userId", userId)

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      return { url: null, error: data.error || "Upload failed" }
    }

    return { url: data.url, error: null }
  } catch (error) {
    return { url: null, error: error instanceof Error ? error.message : "Upload failed" }
  }
}

export async function uploadCoverPicture(userId: string, file: File) {
  try {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("type", "cover")
    formData.append("userId", userId)

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      return { url: null, error: data.error || "Upload failed" }
    }

    return { url: data.url, error: null }
  } catch (error) {
    return { url: null, error: error instanceof Error ? error.message : "Upload failed" }
  }
}

export async function uploadPostMedia(userId: string, file: File) {
  const supabase = createClient()
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}-post-${Date.now()}.${fileExt}`

  const { data, error } = await supabase.storage
    .from('post-media')
    .upload(`public/${userId}/${fileName}`, file, {
      cacheControl: '3600',
    })

  if (error) return { url: null, error }

  // Get public URL
  const { data: publicData } = supabase.storage
    .from('post-media')
    .getPublicUrl(`public/${userId}/${fileName}`)

  return { url: publicData.publicUrl, error: null }
}

export async function uploadMarketplaceMedia(userId: string, file: File) {
  const supabase = createClient()
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}-marketplace-${Date.now()}.${fileExt}`

  const { data, error } = await supabase.storage
    .from('marketplace-media')
    .upload(`public/${userId}/${fileName}`, file, {
      cacheControl: '3600',
    })

  if (error) return { url: null, error }

  // Get public URL
  const { data: publicData } = supabase.storage
    .from('marketplace-media')
    .getPublicUrl(`public/${userId}/${fileName}`)

  return { url: publicData.publicUrl, error: null }
}

export async function uploadEventMedia(userId: string, file: File) {
  const supabase = createClient()
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}-event-${Date.now()}.${fileExt}`

  const { data, error } = await supabase.storage
    .from('event-media')
    .upload(`public/${userId}/${fileName}`, file, {
      cacheControl: '3600',
    })

  if (error) return { url: null, error }

  // Get public URL
  const { data: publicData } = supabase.storage
    .from('event-media')
    .getPublicUrl(`public/${userId}/${fileName}`)

  return { url: publicData.publicUrl, error: null }
}

export async function uploadBlogThumbnail(userId: string, file: File) {
  const supabase = createClient()
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}-blog-thumbnail-${Date.now()}.${fileExt}`

  const { data, error } = await supabase.storage
    .from('blog-thumbnails')
    .upload(`public/${userId}/${fileName}`, file, {
      cacheControl: '3600',
    })

  if (error) return { url: null, error }

  // Get public URL
  const { data: publicData } = supabase.storage
    .from('blog-thumbnails')
    .getPublicUrl(`public/${userId}/${fileName}`)

  return { url: publicData.publicUrl, error: null }
}

export async function deleteFile(bucket: string, path: string) {
  const supabase = createClient()
  const { error } = await supabase.storage.from(bucket).remove([path])
  return { error }
}
