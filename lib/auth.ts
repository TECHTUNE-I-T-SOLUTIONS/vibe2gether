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
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email and password required")
          }

          const supabase = await createClient()

          // Get user from database - handle case where user doesn't exist
          const { data: users, error } = await supabase
            .from("users")
            .select("*")
            .eq("email", credentials.email.toLowerCase())

          if (error) {
            console.error("Database error:", error)
            throw new Error("Invalid email or password")
          }

          const user = users && users.length > 0 ? users[0] : null

          if (!user) {
            // User not found - throw specific error
            throw new Error("User not found")
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
          await supabase
            .from("users")
            .update({ last_login_at: new Date().toISOString() })
            .eq("id", user.id)

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
        } catch (error) {
          console.error("Authorization error:", error)
          throw error
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

        // Check if user exists - handle case where user doesn't exist
        const { data: existingUsers } = await supabase.from("users").select("*").eq("email", user.email)

        const existingUser = existingUsers && existingUsers.length > 0 ? existingUsers[0] : null

        if (!existingUser) {
          // Create new user
          const { data: newUsers, error } = await supabase
            .from("users")
            .insert({
              email: user.email?.toLowerCase(),
              full_name: user.name || "",
              display_name: user.name || "",
              profile_picture: user.image || "",
              is_verified: true,
              email_verified_at: new Date().toISOString(),
              last_login_at: new Date().toISOString(),
              password_hash: await bcrypt.hash(Math.random().toString(36), 10), // Random password for OAuth users
              coins_balance: 50, // Welcome bonus
              total_coins_earned: 50,
            })
            .select()

          if (error) {
            console.error("Error creating OAuth user:", error)
            return false
          }

          // Store the database UUID in the user object for session
          if (newUsers && newUsers.length > 0) {
            user.id = newUsers[0].id
          }
        } else {
          // Update last login and store database UUID
          await supabase.from("users").update({ last_login_at: new Date().toISOString() }).eq("id", existingUser.id)
          user.id = existingUser.id
        }
      }
      return true
    },
    async jwt({ token, user, trigger, session }) {
      // When user first logs in (credentials or OAuth)
      if (user) {
        // If user.id looks like a Google ID (all numbers), query database for UUID
        if (/^\d+$/.test(user.id as string)) {
          const supabase = await createClient()
          const { data: dbUsers, error } = await supabase
            .from("users")
            .select("id")
            .eq("email", user.email)
            .limit(1)

          if (!error && dbUsers?.[0]) {
            token.id = dbUsers[0].id
          } else {
            token.id = user.id
          }
        } else {
          // Already a UUID, use it directly
          token.id = user.id
        }

        token.email = user.email
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
