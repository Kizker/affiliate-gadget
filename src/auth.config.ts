import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  basePath: '/api/auth',
  trustHost: true,
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 1 day
  },
  callbacks: {
    authorized({ auth, request }) {
      // Always return true - let middleware handle redirects manually
      // Returning false here triggers automatic redirect to login page
      // which can cause redirect loops with custom middleware logic
      const isLoggedIn = !!auth?.user
      const { pathname } = request.nextUrl

      // Only block non-authenticated users on protected routes
      // Let the request through and middleware will handle the rest
      const protectedRoutes = [
        '/dashboard/admin',
        '/dashboard/mitra',
        '/dashboard/teknisi',
        '/checkout',
      ]
      const isProtectedRoute = protectedRoutes.some((route) =>
        pathname.startsWith(route)
      )

      if (isProtectedRoute && !isLoggedIn) {
        return false // This will redirect to login
      }

      return true // Allow all other requests
    },
    // JWT callback - needed for middleware to read role
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.name = user.name
        token.email = user.email
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.image = (user.image && !user.image.startsWith('data:') && user.image.length < 500) ? user.image : null
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.isTechnician = (user as any).isTechnician || false
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.mitraStatus = (user as any).mitraStatus || null
      }
      // Remove raw huge pictures to prevent bloat
      delete token.picture
      return token
    },
    // Session callback - needed for middleware to access user data
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        session.user.role = token.role as any
        session.user.name = token.name as string
        session.user.email = token.email as string
        session.user.image = (token.image as string) || null
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(session.user as any).isTechnician = token.isTechnician as boolean
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(session.user as any).mitraStatus = token.mitraStatus as string | null
      }
      return session
    },
  },
  providers: [], // Providers are configured in auth.ts
} satisfies NextAuthConfig
