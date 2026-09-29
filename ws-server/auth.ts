import { decode } from 'next-auth/jwt'

export interface DecodedAuthToken {
  id?: string
  name?: string
  email?: string
  role?: string
  image?: string
  isTechnician?: boolean
  mitraStatus?: string | null
  [key: string]: any
}

/**
 * Verifies NextAuth session token from either explicit token parameter
 * or request cookies during WebSocket handshake.
 */
export async function parseAuthSession(
  cookieHeader?: string,
  tokenParam?: string
): Promise<DecodedAuthToken | null> {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) {
    return null
  }

  // 1. Check explicit token query param if provided
  if (tokenParam && tokenParam.trim() !== '') {
    const salts = [
      'authjs.session-token',
      '__Secure-authjs.session-token',
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
    ]

    for (const salt of salts) {
      try {
        const decoded = await decode({
          token: tokenParam,
          secret,
          salt,
        })
        if (decoded) {
          return decoded as DecodedAuthToken
        }
      } catch {
        // Continue trying alternate salts
      }
    }
  }

  // 2. Check cookies passed in the HTTP handshake request
  if (cookieHeader && cookieHeader.trim() !== '') {
    const cookies: Record<string, string> = {}
    for (const pair of cookieHeader.split(';')) {
      const parts = pair.trim().split('=')
      if (parts.length >= 2) {
        const key = parts[0].trim()
        const val = parts.slice(1).join('=').trim()
        cookies[key] = decodeURIComponent(val)
      }
    }

    const candidateCookieNames = [
      'authjs.session-token',
      '__Secure-authjs.session-token',
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
    ]

    for (const cookieName of candidateCookieNames) {
      const rawCookieVal = cookies[cookieName]
      if (rawCookieVal) {
        try {
          const decoded = await decode({
            token: rawCookieVal,
            secret,
            salt: cookieName,
          })
          if (decoded) {
            return decoded as DecodedAuthToken
          }
        } catch {
          // Continue trying alternate cookie names
        }
      }
    }
  }

  return null
}
