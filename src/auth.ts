import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'
import { loginSchema, LOGIN_ERROR_CODES } from '@/lib/validations/auth'
import {
  extractClientIp,
  checkLoginRateLimit,
  checkAccountLockout,
  getLoginFailCount,
  incrementLoginFailCounter,
  resetLoginFailCounter,
  calculateProgressiveDelay,
} from '@/lib/login-security'
import { UserRole } from '@prisma/client'

import { authConfig } from './auth.config'

// Pre-computed valid bcrypt hash used for anti-enumeration timing attack mitigation
const DUMMY_HASH =
  '$2a$10$wT8K8J5p8z9V6d.2k4xO/.ySGe7fF7KkW2Qj5m1nI0t4eQx0fJtKy'

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(prisma) as any, // Type assertion to bypass @auth/core version conflict
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }) as any,

    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        const validatedFields = loginSchema.safeParse(credentials)

        if (!validatedFields.success) {
          throw new Error(LOGIN_ERROR_CODES.INVALID_CREDENTIALS)
        }

        const { email, password } = validatedFields.data
        const clientIp = extractClientIp(req)

        // 1. Dual-layer rate limiting check (IP & Email)
        const rateLimit = await checkLoginRateLimit(clientIp, email)
        if (rateLimit.blocked) {
          if (rateLimit.reason === 'ip') {
            throw new Error(LOGIN_ERROR_CODES.RATE_LIMIT_IP)
          }
          throw new Error(LOGIN_ERROR_CODES.RATE_LIMIT_EMAIL)
        }

        // 2. Account Lockout check (5 failed attempts)
        const lockout = await checkAccountLockout(email)
        if (lockout.locked) {
          throw new Error(LOGIN_ERROR_CODES.ACCOUNT_LOCKED)
        }

        // 3. Progressive delay based on consecutive fail count (anti-brute-force timing)
        const previousFails = await getLoginFailCount(email)
        const delayMs = calculateProgressiveDelay(previousFails)
        if (delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs))
        }

        // 4. Query user record from database
        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            password: true,
            role: true,
            image: true,
            storeId: true,
            mitraStatus: true,
            isActive: true,
            emailVerified: true,
            mitra: { select: { businessName: true } },
            technician: { select: { id: true } },
          },
        })

        // 5. Anti-Enumeration: Run dummy compare if user or password does not exist
        if (!user || !user.password) {
          await bcrypt.compare(password, DUMMY_HASH)
          await incrementLoginFailCounter(email)
          throw new Error(LOGIN_ERROR_CODES.INVALID_CREDENTIALS)
        }

        // 6. Check Email Verification status (temporarily bypassed for development mode)
        // if (!user.emailVerified) {
        //   throw new Error(LOGIN_ERROR_CODES.EMAIL_NOT_VERIFIED)
        // }

        // 7. Check Active status (admin disable check)
        if (!user.isActive) {
          throw new Error(LOGIN_ERROR_CODES.ACCOUNT_DISABLED)
        }

        // 8. Verify Password
        const passwordsMatch = await bcrypt.compare(password, user.password)
        if (!passwordsMatch) {
          await incrementLoginFailCounter(email)
          throw new Error(LOGIN_ERROR_CODES.INVALID_CREDENTIALS)
        }

        // 9. Login Successful: Reset fail counter
        await resetLoginFailCounter(email)

        // Return user data including cached fields to store in JWT
        const safeImage =
          user.image &&
          !user.image.startsWith('data:') &&
          user.image.length < 500
            ? user.image
            : null
        return {
          id: user.id,
          email: user.email,
          name: user.mitra?.businessName || user.name,
          image: safeImage,
          role: user.role,
          storeId: user.storeId,
          mitraStatus: user.mitraStatus,
          isTechnician: !!user.technician,
        }
      },
    }),
  ],
  callbacks: {
    // Only include authorized callback from authConfig
    authorized: authConfig.callbacks?.authorized,
    async jwt({ token, user, trigger, session }: any) {
      // Handle client-side session update (e.g. after status change, role upgrade, or profile edit)
      if (trigger === 'update') {
        if (token.id) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { id: token.id },
              select: {
                name: true,
                image: true,
                role: true,
                storeId: true,
                mitraStatus: true,
                technician: { select: { id: true } },
              },
            })
            if (dbUser) {
              token.name = dbUser.name
              token.role = dbUser.role
              token.storeId = dbUser.storeId
              token.mitraStatus = dbUser.mitraStatus
              token.isTechnician = !!dbUser.technician
              if (
                dbUser.image &&
                !dbUser.image.startsWith('data:') &&
                dbUser.image.length < 500
              ) {
                token.image = dbUser.image
              }
            }
          } catch (e) {
            console.error(
              'Error refreshing token from DB on update trigger:',
              e
            )
          }
        }

        if (session) {
          const updateData = session.user || session
          if (updateData.image !== undefined) token.image = updateData.image
          if (updateData.name !== undefined) token.name = updateData.name
          if (updateData.role !== undefined) token.role = updateData.role
          if (updateData.mitraStatus !== undefined)
            token.mitraStatus = updateData.mitraStatus
          if (updateData.storeId !== undefined)
            token.storeId = updateData.storeId
        }
      }

      // Store essential user data in token
      if (user) {
        token.id = user.id
        token.role = user.role
        token.name = user.name
        token.email = user.email

        token.image =
          user.image &&
          !user.image.startsWith('data:') &&
          user.image.length < 500
            ? user.image
            : null
        token.storeId = user.storeId || null
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.isTechnician = (user as any).isTechnician || false
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.mitraStatus = (user as any).mitraStatus || null
      }

      // If token is missing storeId, check if database now has storeId linked
      if (token.id && !token.storeId) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { storeId: true, role: true },
          })
          if (dbUser?.storeId) {
            token.storeId = dbUser.storeId
            token.role = dbUser.role
          }
        } catch {
          // ignore error to avoid blocking jwt
        }
      }

      // Remove raw huge picture to prevent bloat
      delete token.picture

      return token
    },
    async session({ session, token }) {
      // Include essential user data in session
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        session.user.name = token.name as string
        session.user.email = token.email as string
        session.user.image = (token.image as string) || null
        session.user.storeId = token.storeId as string | null
        session.user.isTechnician = token.isTechnician as boolean
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(session.user as any).mitraStatus = token.mitraStatus as string | null
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
