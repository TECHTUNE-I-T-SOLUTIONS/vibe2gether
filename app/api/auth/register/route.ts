import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServerClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"
import { getCountryCode, COUNTRY_COORDINATES } from "@/lib/countries"

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || ""
    let body: any = {}
    let profilePictureFile: File | null = null

    if (contentType.includes("multipart/form-data")) {
      // Handle FormData with file upload
      const formData = await request.formData()
      body = {
        email: formData.get("email"),
        password: formData.get("password"),
        fullName: formData.get("fullName"),
        displayName: formData.get("displayName"),
        dateOfBirth: formData.get("dateOfBirth"),
        gender: formData.get("gender"),
        bio: formData.get("bio"),
        city: formData.get("city"),
        mobileNumber: formData.get("mobileNumber"),
        country: formData.get("country"),
        interests: formData.get("interests"),
        lookingFor: formData.get("lookingFor"),
        referralCode: formData.get("referralCode"),
      }
      profilePictureFile = formData.get("profilePicture") as File | null
    } else {
      // Handle JSON body
      body = await request.json()
    }

    const {
      email,
      password,
      fullName,
      displayName,
      dateOfBirth,
      gender,
      bio,
      city,
      mobileNumber,
      country,
      interests,
      lookingFor,
      referralCode,
    } = body

    // Validate required fields
    if (!email || !password || !fullName) {
      return NextResponse.json({ error: "Email, password, and full name are required" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    const supabase = await createClient()

    // Create clients for storage operations
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

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .single()

    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 })
    }

    // Only log unexpected errors
    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking existing user:", checkError)
    }

    // Verify referral code if provided
    let referrerId: string | null = null
    if (referralCode && referralCode.trim()) {
      const { data: referrer } = await supabase
        .from("users")
        .select("id")
        .eq("referral_code", referralCode.toUpperCase())
        .single()
      
      if (referrer) {
        referrerId = referrer.id
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create display name from full name or use provided one
    const finalDisplayName = displayName || fullName.split(" ")[0]

    // Get country code from country name
    console.log("Country received:", country)
    const countryCode = getCountryCode(country) || ""
    console.log("Country code resolved to:", countryCode)

    // Get coordinates from country code
    const coordinates = COUNTRY_COORDINATES[countryCode] || { latitude: 0, longitude: 0 }
    console.log("Coordinates for country:", coordinates)

    // Parse interests if it's a string
    let parsedInterests: string[] = []
    if (typeof interests === "string" && interests) {
      try {
        parsedInterests = JSON.parse(interests)
      } catch {
        parsedInterests = interests.split(",").map((i: string) => i.trim())
      }
    } else if (Array.isArray(interests)) {
      parsedInterests = interests
    }

    let profilePictureUrl: string | null = null

    // Upload profile picture if provided
    if (profilePictureFile && profilePictureFile.size > 0) {
      try {
        const fileName = `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.jpg`
        const arrayBuffer = await profilePictureFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Use storage client for uploads (works with or without RLS depending on bucket config)
        const { data: uploadData, error: uploadError } = await supabaseStorage.storage
          .from("profile_pictures")
          .upload(fileName, buffer, {
            contentType: profilePictureFile.type,
            upsert: false,
          })

        if (uploadError) {
          console.error("Profile picture upload error:", uploadError)
          // Continue without profile picture if upload fails
        } else if (uploadData) {
          // Get public URL for the uploaded file
          const { data: publicData } = supabaseStorage.storage.from("profile_pictures").getPublicUrl(fileName)
          profilePictureUrl = publicData?.publicUrl || null
        }
      } catch (error) {
        console.error("Error uploading profile picture:", error)
        // Continue without profile picture if upload fails
      }
    }

    // Insert new user with all fields
    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        full_name: fullName,
        display_name: finalDisplayName,
        date_of_birth: dateOfBirth || null,
        gender: gender || null,
        bio: bio || null,
        city: city || null,
        country_code: countryCode || null,
        mobile_number: mobileNumber || null,
        country: country || null,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        profile_picture: profilePictureUrl,
        email_verified_at: new Date().toISOString(),
        is_verified: true,
        coins_balance: 50,
        total_coins_earned: 50,
        language: "en",
        is_active: true,
        is_premium: false,
        is_admin: false,
        last_login_at: new Date().toISOString(),
        looking_for: lookingFor || null,
        interests: parsedInterests.length > 0 ? parsedInterests : null,
        referred_by: referrerId,
      })
      .select()
      .single()

    if (error) {
      console.error("Registration error:", error)
      if (error.code === "23505") {
        return NextResponse.json({ error: "Email already in use" }, { status: 400 })
      }
      return NextResponse.json(
        {
          error: "Failed to create account",
          details: error.message,
        },
        { status: 500 }
      )
    }

    // Create welcome coin transaction
    try {
      await supabase.from("coin_transactions").insert({
        user_id: newUser.id,
        amount: 50,
        transaction_type: "welcome_bonus",
        description: "Welcome bonus for joining Vibe2Gether!",
        balance_after: 50,
      })
    } catch (txError) {
      console.error("Error creating coin transaction:", txError)
      // Don't fail the registration if transaction fails
    }

    // Create welcome notification
    try {
      await supabase.from("notifications").insert({
        user_id: newUser.id,
        type: "system",
        title: "Welcome to Vibe2Gether!",
        message: "Your account has been created successfully. Start exploring and finding your perfect match!",
        action_url: "/dashboard",
      })
    } catch (notifError) {
      console.error("Error creating notification:", notifError)
      // Don't fail the registration if notification fails
    }

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.full_name,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json(
      {
        error: "Failed to create account",
        details: message,
      },
      { status: 500 }
    )
  }
}
