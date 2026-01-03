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
        })

        if (!user || !user.password) {
          return null
        }

        const passwordsMatch = await bcrypt.compare(password, user.password)

        if (!passwordsMatch) {
          return null
        }

        // Return minimal user data to keep JWT small
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        // Only store essential data in JWT to keep it small
        token.id = user.id
        token.role = user.role
      }
      // Remove unnecessary fields that might bloat the token
      delete token.picture
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole

        try {
          // Get fresh user data including name, image and mitraStatus
          const user = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              name: true,
              image: true,
              mitraStatus: true,
              role: true,
            },
          })

          // Update session with fresh data from database
          if (user?.name) {
            session.user.name = user.name
          }
          if (user?.image) {
            session.user.image = user.image
          }
          if (user?.mitraStatus) {
            session.user.mitraStatus = user.mitraStatus
          }

          // If user is MITRA, get businessName from Mitra table
          if (user?.role === 'MITRA') {
            const mitra = await prisma.mitra.findUnique({
              where: { userId: token.id as string },
              select: { businessName: true },
            })
            if (mitra?.businessName) {
              session.user.name = mitra.businessName
            }
          }

          // Check if user is a technician
          const technician = await prisma.technician.findUnique({
            where: { userId: token.id as string },
            select: { id: true },
          })
          session.user.isTechnician = !!technician
        } catch (error) {
          console.error('Error fetching user data in session:', error)
          // Continue with session even if database query fails
        }
      }
      return session
    },
  },
  events: {
    // Clear old sessions when user signs in
    async signIn({ user }) {
      if (user?.id) {
        try {
          // Delete old database sessions for this user
          await prisma.session.deleteMany({
            where: { userId: user.id },
          })
        } catch {
          // Ignore errors - sessions table might not exist
        }
      }
    },
  },
})
