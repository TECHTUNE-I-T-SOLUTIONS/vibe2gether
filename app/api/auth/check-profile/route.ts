import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()

    // Get user data
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", session.user.email)
      .single()

    if (error) {
      console.error("Error fetching user:", error)
      return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
    }

    // Define fields to check for completion with their metadata
    const fieldsToCheck = {
      display_name: { label: "Display Name", type: "text", required: false },
      date_of_birth: { label: "Date of Birth", type: "date", required: false },
      gender: { label: "Gender", type: "select", required: false },
      bio: { label: "Bio", type: "textarea", required: false },
      profile_picture: { label: "Profile Picture", type: "file", required: false },
      cover_picture: { label: "Cover Picture", type: "file", required: false },
      country: { label: "Country", type: "select", required: false },
      city: { label: "City", type: "text", required: false },
      mobile_number: { label: "Mobile Number", type: "tel", required: false },
      looking_for: { label: "Looking For", type: "select", required: false },
      interests: { label: "Interests", type: "multiselect", required: false },
    }

    // Find missing fields (null, undefined, empty string, or empty array)
    const missingFields = Object.entries(fieldsToCheck).reduce(
      (acc, [fieldName, fieldConfig]) => {
        const value = user[fieldName as keyof typeof user]
        const isEmpty =
          value === null ||
          value === undefined ||
          value === "" ||
          (Array.isArray(value) && value.length === 0)

        if (isEmpty) {
          acc.push({
            name: fieldName,
            label: fieldConfig.label,
            type: fieldConfig.type,
            required: fieldConfig.required,
          })
        }
        return acc
      },
      [] as Array<{ name: string; label: string; type: string; required: boolean }>,
    )

    // Only require completion if there are missing fields to fill
    const missingCount = missingFields.length
    const totalFields = Object.keys(fieldsToCheck).length
    const needsCompletion = missingCount > 0 // Show modal if there are any missing optional fields

    const completionPercentage = Math.round(
      ((totalFields - missingCount) / totalFields) * 100,
    )

    return NextResponse.json({
      needsCompletion,
      missingFields,
      user,
      completionPercentage,
    })
  } catch (error) {
    console.error("Profile check error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
