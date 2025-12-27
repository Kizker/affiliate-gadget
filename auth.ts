import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'
import { loginSchema } from '@/lib/validations/auth'
import { UserRole } from '@prisma/client'

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 1 day
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
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
          // Get fresh user data including image and mitraStatus
          const user = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              image: true,
              mitraStatus: true,
            },
          })
          if (user?.image) {
            session.user.image = user.image
          }
          if (user?.mitraStatus) {
            session.user.mitraStatus = user.mitraStatus
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
        } catch (error) {
          // Ignore errors - sessions table might not exist
          console.log('Could not clear old sessions')
        }
      }
    },
  },
})
