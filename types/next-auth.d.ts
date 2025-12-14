import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface User {
    id: string
    isVerified?: boolean
    isPremium?: boolean
    isAdmin?: boolean
    coins?: number
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      image?: string
      isVerified?: boolean
      isPremium?: boolean
      isAdmin?: boolean
      coins?: number
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    isVerified?: boolean
    isPremium?: boolean
    isAdmin?: boolean
    coins?: number
  }
}
