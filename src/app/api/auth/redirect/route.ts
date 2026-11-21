import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

function resolvePublicOrigin(req: NextRequest): string {
  // 1. Check X-Forwarded-Host and Host headers
  const forwardedHost =
    req.headers.get('x-forwarded-host') || req.headers.get('host')
  const forwardedProto = req.headers.get('x-forwarded-proto') || 'https'

  if (
    forwardedHost &&
    !forwardedHost.includes('0.0.0.0') &&
    !forwardedHost.startsWith('app:')
  ) {
    const cleanHost = forwardedHost
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '')
    return `${forwardedProto}://${cleanHost}`
  }

  // 2. Check environment variables
  const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL
  if (configured && !configured.includes('0.0.0.0')) {
    return configured.replace(/\/$/, '')
  }

  return 'https://affiliategadget.id'
}

export async function GET(req: NextRequest) {
  const origin = resolvePublicOrigin(req)

  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.redirect(new URL('/login', origin))
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true, isActive: true, storeId: true, mitraStatus: true },
    })

    const adminStaffRoles = [
      'SUPER_ADMIN',
      'ADMIN',
      'STORE_ADMIN',
      'STORE_SALES',
      'FINANCE_ADMIN',
      'CONTENT_EDITOR',
    ]

    if (user?.role === 'AFTER_SALES') {
      return NextResponse.redirect(new URL('/dashboard/after-sales', origin))
    } else if (user?.role === 'STORE_ADMIN') {
      if (!user.isActive || !user.storeId) {
        return NextResponse.redirect(
          new URL('/dashboard/admin/onboarding', origin)
        )
      }
      return NextResponse.redirect(new URL('/dashboard/admin', origin))
    } else if (user?.role && adminStaffRoles.includes(user.role)) {
      return NextResponse.redirect(new URL('/dashboard/admin', origin))
    } else if (user?.role === 'TECHNICIAN') {
      return NextResponse.redirect(new URL('/dashboard/teknisi', origin))
    } else if (user?.role === 'MITRA') {
      return NextResponse.redirect(new URL('/dashboard/mitra', origin))
    } else {
      return NextResponse.redirect(new URL('/', origin))
    }
  } catch (error) {
    console.error('Error in redirect:', error)
    return NextResponse.redirect(new URL('/', origin))
  }
}
