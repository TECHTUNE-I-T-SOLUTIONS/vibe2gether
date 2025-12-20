import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { createClient as createServerClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const type = formData.get("type") as string // 'profile' or 'cover'
    const userId = formData.get("userId") as string

    if (!file || !type || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Create Supabase client with service role key (for bypassing RLS)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const fileExt = file.name.split(".").pop()
    const fileName = `${userId}-${type}-${Date.now()}.${fileExt}`
    const bucketName = type === "profile" ? "profile_pictures" : "cover_image"

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(`public/${userId}/${fileName}`, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: true,
      })

    if (error) {
      console.error("Upload error:", error)
      return NextResponse.json(
        { error: "Upload failed", details: error.message },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: publicData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(`public/${userId}/${fileName}`)

    return NextResponse.json({
      success: true,
      url: publicData.publicUrl,
    })
  } catch (error) {
    console.error("Upload handler error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: "Upload failed", details: message },
      { status: 500 }
    )
  }
}
