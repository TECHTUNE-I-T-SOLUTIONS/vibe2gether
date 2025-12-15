import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServerClient } from "@supabase/supabase-js"
import { getCountryCode, COUNTRY_COORDINATES } from "@/lib/countries"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const contentType = request.headers.get("content-type") || ""
    let body: any = {}
    let profilePictureFile: File | null = null
    let coverPictureFile: File | null = null

    if (contentType.includes("multipart/form-data")) {
      // Handle FormData with file uploads
      const formData = await request.formData()
      body = {
        date_of_birth: formData.get("date_of_birth"),
        gender: formData.get("gender"),
        bio: formData.get("bio"),
        display_name: formData.get("display_name"),
        city: formData.get("city"),
        mobile_number: formData.get("mobile_number"),
        country: formData.get("country"),
        looking_for: formData.get("looking_for"),
        interests: formData.get("interests"),
      }
      profilePictureFile = formData.get("profile_picture") as File | null
      coverPictureFile = formData.get("cover_picture") as File | null
    } else {
      // Handle JSON body
      body = await request.json()
    }

    const {
      date_of_birth: dateOfBirth,
      gender,
      bio,
      display_name: displayName,
      city,
      mobile_number: mobileNumber,
      country,
      looking_for: lookingFor,
      interests,
    } = body

    console.log("Complete profile data received:", {
      country,
      dateOfBirth,
      gender,
      bio,
      displayName,
      city,
      mobileNumber,
      lookingFor,
      interests,
    })

    const supabase = await createClient()

    // Create storage client for file uploads
    // Try service role first (if available), then fall back to anon key for public buckets
    const supabaseStorage = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    let profilePictureUrl: string | null = null
    let coverPictureUrl: string | null = null

    // Upload profile picture if provided
    if (profilePictureFile && profilePictureFile.size > 0) {
      try {
        const fileName = `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.jpg`
        const arrayBuffer = await profilePictureFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const { data: uploadData, error: uploadError } = await supabaseStorage.storage
          .from("profile_pictures")
          .upload(fileName, buffer, {
            contentType: profilePictureFile.type,
            upsert: false,
          })

        if (uploadError) {
          console.error("Profile picture upload error:", uploadError)
        } else if (uploadData) {
          const { data: publicData } = supabaseStorage.storage.from("profile_pictures").getPublicUrl(fileName)
          profilePictureUrl = publicData?.publicUrl || null
        }
      } catch (error) {
        console.error("Error uploading profile picture:", error)
      }
    }

    // Upload cover picture if provided
    if (coverPictureFile && coverPictureFile.size > 0) {
      try {
        const fileName = `user-cover-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.jpg`
        const arrayBuffer = await coverPictureFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const { data: uploadData, error: uploadError } = await supabaseStorage.storage
          .from("cover_image")
          .upload(fileName, buffer, {
            contentType: coverPictureFile.type,
            upsert: false,
          })

        if (uploadError) {
          console.error("Cover picture upload error:", uploadError)
        } else if (uploadData) {
          const { data: publicData } = supabaseStorage.storage.from("cover_image").getPublicUrl(fileName)
          coverPictureUrl = publicData?.publicUrl || null
        }
      } catch (error) {
        console.error("Error uploading cover picture:", error)
      }
    }

    // Build update object - only include fields that are provided (not empty)
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    // Get country code and coordinates from country name
    let latitude = null
    let longitude = null

    if (country && country.trim()) {
      const resolvedCountryCode = getCountryCode(country.trim())
      console.log("Country resolution:", { input: country.trim(), resolved: resolvedCountryCode })
      if (resolvedCountryCode) {
        const coordinates = COUNTRY_COORDINATES[resolvedCountryCode]
        console.log("Coordinates found:", { countryCode: resolvedCountryCode, coordinates })
        if (coordinates) {
          latitude = coordinates.latitude
          longitude = coordinates.longitude
        }
      }
    }

    console.log("Final update values:", { latitude, longitude })

    // Add fields only if they have values
    if (displayName && displayName.trim()) {
      updateData.display_name = displayName.trim()
    }
    if (dateOfBirth) {
      updateData.date_of_birth = dateOfBirth
    }
    if (gender && gender.trim()) {
      updateData.gender = gender.trim()
    }
    if (bio && bio.trim()) {
      updateData.bio = bio.trim()
    }
    if (city && city.trim()) {
      updateData.city = city.trim()
    }
    if (mobileNumber && mobileNumber.trim()) {
      updateData.mobile_number = mobileNumber.trim()
    }
    if (country && country.trim()) {
      updateData.country = country.trim()
      // Also set country code based on country name
      const countryCode = getCountryCode(country.trim())
      if (countryCode) {
        updateData.country_code = countryCode
      }
    }
    if (latitude !== null) {
      updateData.latitude = latitude
    }
    if (longitude !== null) {
      updateData.longitude = longitude
    }
    if (lookingFor && lookingFor.trim()) {
      updateData.looking_for = lookingFor.trim()
    }
    if (interests) {
      if (typeof interests === "string" && interests.trim()) {
        updateData.interests = interests.split(",").map((i) => i.trim()).filter(i => i.length > 0)
      } else if (Array.isArray(interests) && interests.length > 0) {
        updateData.interests = interests.filter(i => i && i.trim && i.trim().length > 0)
      }
    }

    // Set verification timestamps
    updateData.email_verified_at = new Date().toISOString()
    updateData.last_login_at = new Date().toISOString()

    // Add uploaded file URLs to update
    if (profilePictureUrl) {
      updateData.profile_picture = profilePictureUrl
    }
    if (coverPictureUrl) {
      updateData.cover_picture = coverPictureUrl
    }

    // Update user profile
    const { data: updatedUser, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("email", session.user.email)
      .select()
      .single()

    if (error) {
      console.error("Profile update error:", error)
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    })
  } catch (error) {
    console.error("Profile completion error:", error)
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json(
      {
        error: "Failed to update profile",
        details: message,
      },
      { status: 500 }
    )
  }
}
