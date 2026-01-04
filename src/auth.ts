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
        return {
          id: user.id,
          email: user.email,
          name: user.mitra?.businessName || user.name,
          image: user.image,
          role: user.role,
          mitraStatus: user.mitraStatus,
          isTechnician: !!user.technician,
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      // On initial login or sign up - cache all user data in token
      if (user) {
        token.id = user.id
        token.role = user.role
        token.name = user.name
        token.image = user.image
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.mitraStatus = (user as any).mitraStatus
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.isTechnician = (user as any).isTechnician
      }

      // On session update trigger (e.g., after profile update), refresh data
      if (trigger === 'update') {
        try {
          const freshUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            include: {
              mitra: { select: { businessName: true } },
              technician: { select: { id: true } },
            },
          })
          if (freshUser) {
            token.name = freshUser.mitra?.businessName || freshUser.name
            token.image = freshUser.image
            token.role = freshUser.role
            token.mitraStatus = freshUser.mitraStatus
            token.isTechnician = !!freshUser.technician
          }
        } catch {
          // Continue with existing token data if DB query fails
        }
      }

      // Remove unnecessary fields to keep token small
      delete token.picture
      return token
    },
    async session({ session, token }) {
      // Simply read from token - NO DATABASE QUERIES
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        session.user.name = token.name as string
        session.user.image = token.image as string | null
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(session.user as any).mitraStatus = token.mitraStatus
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
