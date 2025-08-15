import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import EmailProvider from "next-auth/providers/email"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
    // Anonymous/Guest provider for temporary sessions
    {
      id: "anonymous",
      name: "Anonymous",
      type: "credentials",
      credentials: {},
      async authorize() {
        // Create anonymous user session
        return {
          id: "anonymous",
          name: "Anonymous User",
          email: null,
          image: null,
        }
      },
    },
  ],
  callbacks: {
    async session({ session, user, token }) {
      if (session.user) {
        session.user.id = user?.id || token?.sub || ""
        
        // Check if user is admin
        if (user?.id) {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
          })
          session.user.isAdmin = dbUser?.isAdmin || false
        }
        
        // Handle anonymous sessions
        if (session.user.id === "anonymous") {
          session.user.isAnonymous = true
          session.user.isAdmin = false
        }
      }
      return session
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        if (account?.provider === "anonymous") {
          token.isAnonymous = true
        }
      }
      return token
    },
    async signIn({ user, account, profile }) {
      // Allow anonymous sign in
      if (account?.provider === "anonymous") {
        return true
      }
      
      // Default sign in for other providers
      return true
    },
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
  },
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  events: {
    async createUser({ user }) {
      // Set admin status for specific email
      if (user.email === process.env.ADMIN_EMAIL) {
        await prisma.user.update({
          where: { id: user.id },
          data: { isAdmin: true },
        })
      }
    },
  },
  debug: process.env.NODE_ENV === "development",
}

// Types for NextAuth session
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      isAdmin?: boolean
      isAnonymous?: boolean
    }
  }

  interface User {
    isAdmin?: boolean
    isAnonymous?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    isAdmin?: boolean
    isAnonymous?: boolean
  }
}