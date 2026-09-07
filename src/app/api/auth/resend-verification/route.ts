import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import prisma from '@/lib/db'
import { resendVerificationSchema } from '@/lib/validations/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { sendVerificationEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))

    // 1. Client IP Extraction
    const forwardedFor = req.headers.get('x-forwarded-for')
    const realIp = req.headers.get('x-real-ip')
    const clientIp = forwardedFor
      ? forwardedFor.split(',')[0].trim()
      : realIp || '127.0.0.1'

    // 2. Rate Limit per IP: Max 5 resend attempts per hour
    const ipRateLimit = await checkRateLimit(
      `resend-verif:ip:${clientIp}`,
      5,
      3600
    )
    if (!ipRateLimit.success) {
      return NextResponse.json(
        {
          error:
            'Terlalu banyak permintaan kirim ulang dari perangkat ini. Silakan coba lagi nanti.',
          retryAfter: ipRateLimit.resetInSeconds,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(ipRateLimit.resetInSeconds) },
        }
      )
    }

    // 3. Validation via Zod
    const validatedFields = resendVerificationSchema.safeParse(body)
    if (!validatedFields.success) {
      return NextResponse.json(
        { error: 'Format email tidak valid.' },
        { status: 400 }
      )
    }

    const normalizedEmail = validatedFields.data.email.trim().toLowerCase()

    // 4. Rate Limit per Email: Max 3 resend attempts per hour
    const emailRateLimit = await checkRateLimit(
      `resend-verif:email:${normalizedEmail}`,
      3,
      3600
    )
    if (!emailRateLimit.success) {
      return NextResponse.json(
        {
          error:
            'Terlalu banyak permintaan untuk email ini. Silakan periksa kotak masuk atau coba lagi nanti.',
          retryAfter: emailRateLimit.resetInSeconds,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(emailRateLimit.resetInSeconds) },
        }
      )
    }

    // 5. Lookup user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
      },
    })

    // Anti-enumeration: If user doesn't exist or already verified, return generic success without revealing state
    if (!user || user.emailVerified) {
      return NextResponse.json({
        message:
          'Jika alamat email terdaftar dan belum diverifikasi, tautan verifikasi baru telah dikirimkan ke kotak masuk Anda.',
      })
    }

    // 6. Invalidate old tokens & generate new one
    await prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id },
    })

    const plainVerificationToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto
      .createHash('sha256')
      .update(plainVerificationToken)
      .digest('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    })

    // 7. Dispatch verification email
    await sendVerificationEmail({
      to: user.email,
      name: user.name || 'Pelanggan',
      token: plainVerificationToken,
    })

    return NextResponse.json({
      message:
        'Jika alamat email terdaftar dan belum diverifikasi, tautan verifikasi baru telah dikirimkan ke kotak masuk Anda.',
    })
  } catch (error) {
    console.error(
      '[Resend Verification Error]',
      error instanceof Error ? error.message : 'Unknown error'
    )
    return NextResponse.json(
      {
        error: 'Terjadi kendala pada sistem. Silakan coba beberapa saat lagi.',
      },
      { status: 500 }
    )
  }
}
