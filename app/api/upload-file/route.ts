import { NextRequest, NextResponse } from "next/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const userId = formData.get("userId") as string
    const bucket = formData.get("bucket") as string

    if (!file || !userId || !bucket) {
      return NextResponse.json(
        { error: "Missing file, userId, or bucket" },
        { status: 400 }
      )
    }

    // Validate file size - max 100MB
    const MAX_FILE_SIZE = 100 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is 100MB (${(file.size / 1024 / 1024).toFixed(1)}MB)` },
        { status: 413 }
      )
    }

    // Get Supabase credentials from environment
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase credentials")
      return NextResponse.json(
        { error: "Server misconfiguration" },
        { status: 500 }
      )
    }

    // Create admin client with service role key (bypasses RLS)
    const supabase = createAdminClient(supabaseUrl, supabaseServiceKey)

    // Convert file to buffer
    const buffer = await file.arrayBuffer()

    // Generate file name
    const fileExt = file.name.split(".").pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `public/${userId}/${fileName}`

    console.log(`[UPLOAD] Starting upload: ${fileName} (${(file.size / 1024 / 1024).toFixed(1)}MB)`)

    // Upload using service role (bypasses RLS)
    // Adding longer timeout for large files
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, buffer, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      console.error(`[UPLOAD] Upload failed for ${fileName}:`, error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`[UPLOAD] Successfully uploaded: ${fileName}`)

    // Get public URL
    const { data: publicData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return NextResponse.json({
      url: publicData.publicUrl,
      path: filePath,
    })
  } catch (error) {
    console.error("[UPLOAD] Upload failed:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    )
  }
}

// Set extended timeout for large file uploads
// Hobby plan: max 300 seconds (5 minutes)
// Pro plan: max 900 seconds (15 minutes)
export const maxDuration = 300 // 5 minutes (Vercel hobby plan limit)
