import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { createClient as createServerClient } from '@supabase/supabase-js'

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

    // Helper to upload a file buffer to verifications bucket
    async function uploadToBucket(file: File, suffix: string) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-verification-${suffix}-${Date.now()}.${fileExt}`
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const { data, error } = await supabase.storage
        .from('verifications')
        .upload(`public/${userId}/${fileName}`, buffer, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: true,
        })

      if (error) throw error

      const { data: publicData } = supabase.storage
        .from('verifications')
        .getPublicUrl(`public/${userId}/${fileName}`)

      return publicData.publicUrl
    }

    // Upload files
    const idDocumentUrl = await uploadToBucket(idDocument, 'id')
    const selfieUrl = await uploadToBucket(selfie, 'selfie')

    // Insert verification record
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

    // Basic sanity checks
    const idNumberSanity = typeof idNumber === 'string' && /[0-9]{5,}/.test(idNumber)
    const idDocOk = !!idDocumentUrl
    const selfieOk = !!selfieUrl

    if (idNumberSanity && idDocOk && selfieOk) {
      // For MVP: accept as verified when basic checks pass
      autoStatus = 'verified'
    } else {
      autoStatus = 'rejected'
      reason = 'Basic checks failed: invalid id number or missing images'
    }

    // Update record with auto decision
    const { error: updateError } = await supabase
      .from('user_verifications')
      .update({ status: autoStatus, decision_reason: reason, reviewed_at: new Date().toISOString() })
      .eq('id', created.id)

    if (updateError) console.error('Update verification status error:', updateError)

    // If autoStatus is verified, set users.is_verified (trigger will do it but do a safety update too)
    if (autoStatus === 'verified') {
      await supabase.from('users').update({ is_verified: true, updated_at: new Date().toISOString() }).eq('id', userId)
    }

    return NextResponse.json({ success: true, status: autoStatus })
  } catch (error) {
    console.error('Verification submission error:', error)
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 })
  }
}
