import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import prisma from '@/lib/db'

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'
  const token = req.nextUrl.searchParams.get('token')

  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    return NextResponse.redirect(`${appUrl}/login?error=invalid_token`)
  }

  try {
    // Hash token to compare with database
    const tokenHash = crypto
      .createHash('sha256')
      .update(token.trim())
      .digest('hex')

    const verificationRecord = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    })

    if (!verificationRecord) {
      return NextResponse.redirect(`${appUrl}/login?error=invalid_token`)
    }

    // Check expiration
    if (verificationRecord.expiresAt < new Date()) {
      // Clean up expired token
      await prisma.emailVerificationToken.delete({
        where: { id: verificationRecord.id },
      })
      return NextResponse.redirect(`${appUrl}/login?error=token_expired`)
    }

    // Activate user and mark email as verified
    await prisma.$transaction([
      prisma.user.update({
        where: { id: verificationRecord.userId },
        data: {
          emailVerified: new Date(),
          isActive: true,
        },
      }),
      // Delete token once consumed (one-time use)
      prisma.emailVerificationToken.delete({
        where: { id: verificationRecord.id },
      }),
    ])

    return NextResponse.redirect(`${appUrl}/login?verified=true`)
  } catch (error) {
    console.error(
      '[Verify Email Error]',
      error instanceof Error ? error.message : 'Unknown error'
    )
    return NextResponse.redirect(`${appUrl}/login?error=verification_failed`)
  }
}
