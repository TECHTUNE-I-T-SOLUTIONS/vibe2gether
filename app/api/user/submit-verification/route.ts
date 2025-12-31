import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

const UPLOAD_TIMEOUT = 30000 // 30 seconds
const UPLOAD_RETRIES = 2
const FALLBACK_BUCKETS = ["user-verifications", "posts", "profile_pictures"] // Fallback buckets that definitely exist

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      console.log("[POST /api/user/submit-verification] User not authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`[POST /api/user/submit-verification] Processing verification for user ${session.user.id}`)

    const formData = await request.formData()
    const idType = formData.get("idType") as string
    const idNumber = formData.get("idNumber") as string
    const idDocument = formData.get("idDocument") as File
    const selfie = formData.get("selfie") as File

    if (!idType || !idNumber || !idDocument || !selfie) {
      console.error("[POST /api/user/submit-verification] Missing required fields")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Use service role key to bypass RLS policies
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Keep regular supabase client for database queries
    const { createClient: createUserClient } = await import("@/lib/supabase/server")
    const supabase = await createUserClient()

    // Helper function to upload file with timeout and retry logic
    async function uploadFileWithRetry(
      file: File,
      fileType: string,
      bucketName: string = "verifications",
      retries = UPLOAD_RETRIES
    ): Promise<{ url: string | null; bucket: string }> {
      const fileName = `${session.user.id}/${fileType}-${Date.now()}.jpg`

      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          console.log(`[POST /api/user/submit-verification] Uploading ${fileType} (attempt ${attempt + 1}/${retries + 1}) to bucket: ${bucketName}`)

          // Create upload promise with timeout - using admin client to bypass RLS
          const uploadPromise = (async () => {
            const { error, data } = await supabaseAdmin.storage.from(bucketName).upload(fileName, file, {
              contentType: file.type,
              upsert: false,
            })

            if (error) {
              console.error(`[Upload ${fileType}] Error from ${bucketName}:`, error)
              throw error
            }

            console.log(`[Upload ${fileType}] Successfully uploaded to ${bucketName}`)
            return { bucket: bucketName, path: fileName }
          })()

          // Add timeout wrapper
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Upload timeout")), UPLOAD_TIMEOUT)
          )

          const result = await Promise.race([uploadPromise, timeoutPromise])
          const { data: publicData } = supabaseAdmin.storage.from(bucketName).getPublicUrl(result.path)

          return { url: publicData.publicUrl, bucket: bucketName }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error)
          console.warn(`[Upload ${fileType}] Attempt ${attempt + 1} failed on ${bucketName}: ${errorMsg}`)

          // If this bucket failed and we have fallbacks, try the next one
          if (attempt < retries && bucketName === "verifications" && FALLBACK_BUCKETS.length > 0) {
            console.log(`[Upload ${fileType}] Falling back to alternate bucket`)
            return uploadFileWithRetry(file, fileType, FALLBACK_BUCKETS[0], 0) // Try fallback with no more retries
          }

          // If this was the last attempt, return null
          if (attempt === retries) {
            console.error(`[Upload ${fileType}] All attempts failed for ${bucketName}`)
            return { url: null, bucket: bucketName }
          }

          // Wait before retrying (exponential backoff)
          const waitTime = Math.pow(2, attempt) * 1000
          console.log(`[Upload ${fileType}] Waiting ${waitTime}ms before retry...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
        }
      }

      return { url: null, bucket: bucketName }
    }

    // Upload files
    console.log("[POST /api/user/submit-verification] Starting file uploads...")
    const idDocResult = await uploadFileWithRetry(idDocument, "id-document")
    const selfieResult = await uploadFileWithRetry(selfie, "selfie")

    // Check if at least one file uploaded
    if (!idDocResult.url && !selfieResult.url) {
      console.error("[POST /api/user/submit-verification] All file uploads failed")
      return NextResponse.json(
        {
          error: "Failed to upload verification documents. Please check your internet connection and try again.",
          code: "UPLOAD_FAILED",
        },
        { status: 500 }
      )
    }

    console.log(`[POST /api/user/submit-verification] File uploads completed. ID Doc: ${idDocResult.url ? "OK" : "SKIPPED"}, Selfie: ${selfieResult.url ? "OK" : "SKIPPED"}`)

    // Check if user already has a verification record
    const { data: existingVerification, error: checkError } = await supabase
      .from("user_verifications")
      .select("id")
      .eq("user_id", session.user.id)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      console.error("[POST /api/user/submit-verification] Error checking existing verification:", checkError)
      throw checkError
    }

    let verificationId: string
    let status = "pending"

    if (existingVerification) {
      // Update existing verification record
      console.log(`[POST /api/user/submit-verification] Updating existing verification record`)

      const { data: updated, error: updateError } = await supabase
        .from("user_verifications")
        .update({
          id_type: idType,
          id_number: idNumber,
          id_document_url: idDocResult.url,
          selfie_url: selfieResult.url,
          status: status,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", session.user.id)
        .select("id")
        .single()

      if (updateError) {
        console.error("[POST /api/user/submit-verification] Error updating verification:", updateError)
        throw updateError
      }

      verificationId = updated.id
    } else {
      // Create new verification record
      console.log(`[POST /api/user/submit-verification] Creating new verification record`)

      const { data: created, error: createError } = await supabase
        .from("user_verifications")
        .insert({
          user_id: session.user.id,
          id_type: idType,
          id_number: idNumber,
          id_document_url: idDocResult.url,
          selfie_url: selfieResult.url,
          status: status,
        })
        .select("id")
        .single()

      if (createError) {
        console.error("[POST /api/user/submit-verification] Error creating verification:", createError)
        throw createError
      }

      verificationId = created.id
    }

    console.log(`[POST /api/user/submit-verification] Verification record saved: ${verificationId}`)

    return NextResponse.json({
      success: true,
      verificationId,
      status: status,
      message: "Verification request submitted successfully. Pending admin review.",
    })
  } catch (error) {
    console.error("[POST /api/user/submit-verification] Unexpected error:", error)
    const errorMsg = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json(
      {
        error: "Verification submission failed. Please try again.",
        details: errorMsg,
      },
      { status: 500 }
    )
  }
}
