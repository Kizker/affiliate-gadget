import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// API endpoint to forcefully clear all auth cookies
// This helps recover from corrupted cookie state
export async function POST() {
  const cookieStore = await cookies()

  // List all auth-related cookie prefixes to clear
  const authCookiePrefixes = [
    'authjs.session-token',
    'authjs.callback-url',
    'authjs.csrf-token',
    '__Secure-authjs.session-token',
    '__Host-authjs.session-token',
    'next-auth.session-token',
    'next-auth.callback-url',
    'next-auth.csrf-token',
  ]

  const clearedCookies: string[] = []

  // Get all cookies and clear auth-related ones
  const allCookies = cookieStore.getAll()

  for (const cookie of allCookies) {
    const shouldClear = authCookiePrefixes.some((prefix) =>
      cookie.name.startsWith(prefix)
    )

    if (shouldClear) {
      cookieStore.delete(cookie.name)
      clearedCookies.push(cookie.name)
    }
  }

  return NextResponse.json({
    message: 'Auth cookies cleared',
    cleared: clearedCookies,
    count: clearedCookies.length,
  })
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to clear auth cookies',
    usage: 'POST /api/auth/clear-cookies',
  })
}
