import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.redirect(
        new URL('/login', process.env.NEXTAUTH_URL || 'http://localhost:3000')
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    })

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

    if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/dashboard/admin', baseUrl))
    } else if (user?.role === 'MITRA') {
      return NextResponse.redirect(new URL('/dashboard/mitra', baseUrl))
    } else {
      return NextResponse.redirect(new URL('/dashboard/customer', baseUrl))
    }
  } catch (error) {
    console.error('Error in redirect:', error)
    return NextResponse.redirect(
      new URL(
        '/dashboard/customer',
        process.env.NEXTAUTH_URL || 'http://localhost:3000'
      )
    )
  }
}
