import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'
import { loginSchema } from '@/lib/validations/auth'
import { UserRole } from '@prisma/client'

import { authConfig } from './auth.config'

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(prisma) as any, // Type assertion to bypass @auth/core version conflict
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const validatedFields = loginSchema.safeParse(credentials)

        if (!validatedFields.success) {
          return null
        }

        const { email, password } = validatedFields.data

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            mitra: { select: { businessName: true } },
            technician: { select: { id: true } },
          },
        })

        if (!user || !user.password) {
          return null
        }

        const passwordsMatch = await bcrypt.compare(password, user.password)

        if (!passwordsMatch) {
          return null
        }

        // Return user data including cached fields to store in JWT
        // DO NOT include image here - it can be a huge base64 that bloats the JWT
        return {
          id: user.id,
          email: user.email,
          name: user.mitra?.businessName || user.name,
          // image excluded intentionally - causes 431 error if base64
          role: user.role,
          mitraStatus: user.mitraStatus,
          isTechnician: !!user.technician,
        }
      },
    }),
  ],
  callbacks: {
    // Only include authorized callback from authConfig
    authorized: authConfig.callbacks?.authorized,
    async jwt({ token, user }) {
      // Store essential user data in token
      if (user) {
        token.id = user.id
        token.role = user.role
        token.name = user.name
        token.email = user.email
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.isTechnician = (user as any).isTechnician || false
      }

      // Remove only picture/image to prevent bloat
      delete token.picture
      delete token.image

      return token
    },
    async session({ session, token }) {
      // Include essential user data in session
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        session.user.name = token.name as string
        session.user.email = token.email as string
        session.user.isTechnician = token.isTechnician as boolean
      }
      return session
    },
  },
  events: {
    // Clear old sessions when user signs in (for Google OAuth)
    async signIn({ user, account }) {
      if (user?.id && account?.provider === 'google') {
        try {
          // For Google OAuth, fetch additional data to cache
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
              mitra: { select: { businessName: true } },
              technician: { select: { id: true } },
            },
          })
          if (dbUser) {
            // Update the user object with cached data for JWT
            user.name = dbUser.mitra?.businessName || dbUser.name
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(user as any).mitraStatus = dbUser.mitraStatus
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(user as any).isTechnician = !!dbUser.technician
          }
        } catch {
          // Continue even if query fails
        }
      }
    },
  },
})
