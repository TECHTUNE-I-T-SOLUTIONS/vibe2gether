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
  try {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("userId", userId)
    formData.append("bucket", "posts")

    const response = await fetch("/api/upload-file", {
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

export async function uploadMarketplaceMedia(userId: string, file: File) {
  try {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("userId", userId)
    formData.append("bucket", "marketplace-images")

    const response = await fetch("/api/upload-file", {
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

export async function uploadEventMedia(userId: string, file: File) {
  try {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("userId", userId)
    formData.append("bucket", "event-images")

    const response = await fetch("/api/upload-file", {
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

export async function uploadBlogThumbnail(userId: string, file: File) {
  try {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("userId", userId)
    formData.append("bucket", "blog-images")

    const response = await fetch("/api/upload-file", {
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

export async function deleteFile(bucket: string, path: string) {
  const supabase = createClient()
  const { error } = await supabase.storage.from(bucket).remove([path])
  return { error }
}
