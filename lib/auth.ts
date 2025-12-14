import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import FacebookProvider from "next-auth/providers/facebook"
import { createClient } from "@/lib/supabase/server"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required")
        }

        const supabase = await createClient()

        // Get user from database
        const { data: user, error } = await supabase
          .from("users")
          .select("*")
          .eq("email", credentials.email.toLowerCase())
          .single()

        if (error || !user) {
          throw new Error("Invalid email or password")
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash)

        if (!isValidPassword) {
          throw new Error("Invalid email or password")
        }

        // Check if user is active
        if (!user.is_active) {
          throw new Error("Account is deactivated")
        }

        // Update last login
        await supabase.from("users").update({ last_login_at: new Date().toISOString() }).eq("id", user.id)

        return {
          id: user.id,
          email: user.email,
          name: user.display_name || user.full_name,
          image: user.profile_picture,
          isVerified: user.is_verified,
          isPremium: user.is_premium,
          isAdmin: user.is_admin,
          coins: user.coins_balance,
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" || account?.provider === "facebook") {
        const supabase = await createClient()

        // Check if user exists
        const { data: existingUser } = await supabase.from("users").select("*").eq("email", user.email).single()

        if (!existingUser) {
          // Create new user
          const { error } = await supabase.from("users").insert({
            email: user.email?.toLowerCase(),
            full_name: user.name || "",
            display_name: user.name || "",
            profile_picture: user.image || "",
            is_verified: true,
            email_verified_at: new Date().toISOString(),
            password_hash: await bcrypt.hash(Math.random().toString(36), 10), // Random password for OAuth users
          })

          if (error) {
            console.error("Error creating OAuth user:", error)
            return false
          }
        }
      }
      return true
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.isVerified = user.isVerified
        token.isPremium = user.isPremium
        token.isAdmin = user.isAdmin
        token.coins = user.coins
      }

      // Handle session updates
      if (trigger === "update" && session) {
        return { ...token, ...session }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.isVerified = token.isVerified as boolean
        session.user.isPremium = token.isPremium as boolean
        session.user.isAdmin = token.isAdmin as boolean
        session.user.coins = token.coins as number
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}
