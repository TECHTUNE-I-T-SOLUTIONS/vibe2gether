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
    // Check file size - Max 100MB for safety
    const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
    if (file.size > MAX_FILE_SIZE) {
      return { url: null, error: `File too large. Maximum size is 100MB (${(file.size / 1024 / 1024).toFixed(1)}MB)` }
    }

    // Warn if large (over 20MB)
    const isLargeFile = file.size > 20 * 1024 * 1024
    if (isLargeFile) {
      console.log(`⚠️ Uploading large file: ${(file.size / 1024 / 1024).toFixed(1)}MB - This may take a minute`)
    }

    const formData = new FormData()
    formData.append("file", file)
    formData.append("userId", userId)
    formData.append("bucket", "posts")

    // Use longer timeout for large files (5 minutes for files over 20MB)
    const timeout = isLargeFile ? 5 * 60 * 1000 : 2 * 60 * 1000 // 5min or 2min
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch("/api/upload-file", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      })

      const data = await response.json()

      if (!response.ok) {
        return { url: null, error: data.error || "Upload failed" }
      }

      return { url: data.url, error: null }
    } finally {
      clearTimeout(timeoutId)
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { url: null, error: "Upload timeout - file is too large or connection is slow" }
    }
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
