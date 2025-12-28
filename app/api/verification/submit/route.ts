import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { createClient as createServerClient } from '@supabase/supabase-js'

const UPLOAD_TIMEOUT = 30000 // 30 seconds
const UPLOAD_RETRIES = 2

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const idType = formData.get('id_type') as string
    const idNumber = formData.get('id_number') as string
    const idDocument = formData.get('id_document') as File
    const selfie = formData.get('selfie') as File

    if (!idType || !idNumber || !idDocument || !selfie) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const userId = session.user.id as string

    // Supabase server client with service role key
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        auth: { autoRefreshToken: false, persistSession: false },
      }
    )

    // Helper to upload a file buffer to verifications bucket with retry logic
    async function uploadToBucket(file: File, suffix: string, retries = UPLOAD_RETRIES): Promise<string | null> {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-verification-${suffix}-${Date.now()}.${fileExt}`

      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          // Create upload promise with timeout
          const uploadPromise = (async () => {
            const arrayBuffer = await file.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)

            const { data, error } = await supabase.storage
              .from('verifications')
              .upload(`public/${userId}/${fileName}`, buffer, {
                contentType: file.type,
                cacheControl: '3600',
                upsert: true,
              })

            if (error) {
              console.error(`[Upload ${suffix}] Supabase error:`, error)
              throw error
            }

            const { data: publicData } = supabase.storage
              .from('verifications')
              .getPublicUrl(`public/${userId}/${fileName}`)

            return publicData.publicUrl
          })()

          // Add timeout wrapper
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Upload timeout')), UPLOAD_TIMEOUT)
          )

          return await Promise.race([uploadPromise, timeoutPromise])
        } catch (error) {
          console.warn(`[Upload ${suffix}] Attempt ${attempt + 1} failed:`, error instanceof Error ? error.message : error)

          // If this was the last attempt, return null (allow submission without files)
          if (attempt === retries) {
            console.error(`[Upload ${suffix}] All ${retries + 1} attempts failed, allowing verification without file`)
            return null
          }

          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        }
      }

      return null
    }

    // Upload files with timeout and retry
    console.log(`[Verification] Starting file uploads for user ${userId}`)
    const idDocumentUrl = await uploadToBucket(idDocument, 'id')
    const selfieUrl = await uploadToBucket(selfie, 'selfie')

    // If at least one file uploaded, continue; if both failed, return error
    if (!idDocumentUrl && !selfieUrl) {
      console.error('[Verification] Both file uploads failed')
      return NextResponse.json(
        {
          error: 'Failed to upload verification documents. Please check your internet connection and try again.',
          code: 'UPLOAD_FAILED',
        },
        { status: 500 }
      )
    }

    console.log(`[Verification] File uploads completed. ID Doc: ${idDocumentUrl ? 'OK' : 'FAILED'}, Selfie: ${selfieUrl ? 'OK' : 'FAILED'}`)

    // Insert verification record with whatever files uploaded
    const { data: insertData, error: insertError } = await supabase
      .from('user_verifications')
      .insert([
        {
          user_id: userId,
          id_type: idType,
          id_number: idNumber,
          id_document_url: idDocumentUrl,
          selfie_url: selfieUrl,
          status: 'pending',
        },
      ])
      .select()

    if (insertError) {
      console.error('Insert verification error:', insertError)
      return NextResponse.json({ error: 'Failed to create verification record' }, { status: 500 })
    }

    const created = insertData?.[0]

    // Basic automatic verification algorithm (simple heuristics)
    let autoStatus: 'verified' | 'rejected' | 'pending' = 'pending'
    let reason = null

    // Basic sanity checks - require at least one file and valid ID
    const idNumberSanity = typeof idNumber === 'string' && /[0-9]{5,}/.test(idNumber)
    const hasAtLeastOneFile = !!(idDocumentUrl || selfieUrl)

    if (idNumberSanity && hasAtLeastOneFile) {
      // For MVP: accept as pending (requires admin review due to limited documents)
      autoStatus = 'pending'
      reason = idDocumentUrl && selfieUrl ? 'Awaiting admin review' : 'Partial documents received - awaiting admin review'
    } else {
      autoStatus = 'rejected'
      reason = !idNumberSanity ? 'Invalid ID number format' : 'No documents received'
    }

    // Update record with status
    const { error: updateError } = await supabase
      .from('user_verifications')
      .update({ status: autoStatus, decision_reason: reason, reviewed_at: autoStatus === 'verified' ? new Date().toISOString() : null })
      .eq('id', created.id)

    if (updateError) console.error('Update verification status error:', updateError)

    // Only auto-verify if both documents present and valid
    if (autoStatus === 'verified') {
      await supabase.from('users').update({ is_verified: true, updated_at: new Date().toISOString() }).eq('id', userId)
    }

    console.log(`[Verification] Submission complete. Status: ${autoStatus}, Reason: ${reason}`)

    return NextResponse.json({
      success: true,
      status: autoStatus,
      message: autoStatus === 'pending' ? 'Verification submitted for admin review' : autoStatus === 'verified' ? 'Verification successful!' : 'Verification rejected',
    })
  } catch (error) {
    console.error('Verification submission error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Submission failed'
    return NextResponse.json(
      {
        error: 'Verification submission failed. Please try again.',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}
