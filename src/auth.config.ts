import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
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
    authorized({ auth }) {
      const isLoggedIn = !!auth?.user
      return isLoggedIn
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        session.user.role = token.role as any
        // Note: Full user data fetching (name, image, mitraStatus)
        // is handled in the Node.js runtime auth.ts
      }
      return session
    },
  },
  providers: [], // Providers are configured in auth.ts
} satisfies NextAuthConfig
