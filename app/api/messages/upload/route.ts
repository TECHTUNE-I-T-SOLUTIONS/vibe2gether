import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const type = formData.get("type") as string // "image" or "audio"

    if (!file || !type) {
      return NextResponse.json(
        { error: "File and type are required" },
        { status: 400 }
      )
    }

    // Validate file size (5MB max)
    const MAX_SIZE = 5 * 1024 * 1024 // 5MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit" },
        { status: 400 }
      )
    }

    // Use service role key to bypass RLS - CRITICAL for file uploads
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Determine bucket based on type
    const bucket = type === "audio" ? "message-recording" : "message-attachments"

    // Generate unique filename
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const ext = file.name.split(".").pop()
    const filename = `${session.user.id}/${timestamp}-${random}.${ext}`

    // Convert file to buffer
    const buffer = await file.arrayBuffer()

    // Upload file with service role (bypasses RLS)
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
        duplex: "half",
      })

    if (error) {
      console.error("Upload error:", error)
      return NextResponse.json(
        { error: error.message || "Failed to upload file" },
        { status: 500 }
      )
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(bucket).getPublicUrl(filename)

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: data.path,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
