import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

export async function GET(req: NextRequest) {
  const origin = req.nextUrl?.origin || process.env.NEXTAUTH_URL || 'http://localhost:3002'

  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.redirect(new URL('/login', origin))
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    })

    const adminStaffRoles = [
      'SUPER_ADMIN',
      'ADMIN',
      'STORE_ADMIN',
      'STORE_SALES',
      'FINANCE_ADMIN',
      'CONTENT_EDITOR',
    ]

    if (user?.role && adminStaffRoles.includes(user.role)) {
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
