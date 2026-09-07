import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'
import { registerSchema } from '@/lib/validations/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { sendVerificationEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))

    // 1. Honeypot check: If bot filled the hidden honeypot field, return fake success quietly
    if (
      body.honeypotField &&
      typeof body.honeypotField === 'string' &&
      body.honeypotField.trim().length > 0
    ) {
      return NextResponse.json(
        {
          message:
            'Registrasi berhasil. Silakan periksa kotak masuk email Anda untuk verifikasi akun.',
        },
        { status: 201 }
      )
    }

    // 2. Client IP Extraction
    const forwardedFor = req.headers.get('x-forwarded-for')
    const realIp = req.headers.get('x-real-ip')
    const clientIp = forwardedFor
      ? forwardedFor.split(',')[0].trim()
      : realIp || '127.0.0.1'

    // 3. Rate Limit per IP: Max 5 registration attempts per 1 hour (3600 seconds)
    const ipRateLimit = await checkRateLimit(`register:ip:${clientIp}`, 5, 3600)
    if (!ipRateLimit.success) {
      return NextResponse.json(
        {
          error:
            'Terlalu banyak percobaan pendaftaran dari perangkat/jaringan ini. Silakan coba lagi nanti.',
          retryAfter: ipRateLimit.resetInSeconds,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(ipRateLimit.resetInSeconds) },
        }
      )
    }

    // 4. Server-Side Input Validation via Zod
    const validatedFields = registerSchema.safeParse(body)
    if (!validatedFields.success) {
      const firstErrorMessage =
        validatedFields.error.errors[0]?.message ||
        'Data pendaftaran tidak valid.'
      return NextResponse.json({ error: firstErrorMessage }, { status: 400 })
    }

    const { name, email, password, phone, role } = validatedFields.data

    // 5. Data Normalization & Sanitization
    const normalizedEmail = email.trim().toLowerCase()
    const sanitizedName = name.trim()
    const formattedPhone =
      phone && phone.trim().length > 0 ? phone.trim() : null

    // 6. Rate Limit per Email: Max 3 registration attempts per email per 1 hour
    const emailRateLimit = await checkRateLimit(
      `register:email:${normalizedEmail}`,
      3,
      3600
    )
    if (!emailRateLimit.success) {
      return NextResponse.json(
        {
          error:
            'Terlalu banyak permintaan pendaftaran untuk alamat email ini. Silakan coba lagi nanti.',
          retryAfter: emailRateLimit.resetInSeconds,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(emailRateLimit.resetInSeconds) },
        }
      )
    }

    // 7. Strict Role Whitelist Hardening (Defense-in-depth)
    const allowedPublicRoles = ['CUSTOMER', 'MITRA']
    if (!allowedPublicRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Jenis akun yang dipilih tidak diizinkan.' },
        { status: 400 }
      )
    }

    // 8. Duplicate Email Check
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, emailVerified: true },
    })

    if (existingUserByEmail) {
      return NextResponse.json(
        {
          error:
            'Email ini sudah terdaftar. Silakan gunakan email lain atau masuk ke akun Anda.',
        },
        { status: 400 }
      )
    }

    // 9. Duplicate Phone Check (if provided)
    if (formattedPhone) {
      const existingUserByPhone = await prisma.user.findFirst({
        where: { phone: formattedPhone },
        select: { id: true },
      })

      if (existingUserByPhone) {
        return NextResponse.json(
          {
            error:
              'Nomor telepon ini sudah terdaftar. Silakan gunakan nomor lain.',
          },
          { status: 400 }
        )
      }
    }

    // 10. Password Hashing with Bcrypt (Cost Factor 12)
    const hashedPassword = await bcrypt.hash(password, 12)

    // 11. Create User (isActive: true & emailVerified auto-set for development mode)
    const newUser = await prisma.user.create({
      data: {
        name: sanitizedName,
        email: normalizedEmail,
        password: hashedPassword,
        phone: formattedPhone,
        role: role as 'CUSTOMER' | 'MITRA',
        isActive: true, // [DEV-MODE] Active immediately (original: false pending email verification)
        emailVerified: new Date(), // [DEV-MODE] Auto-verified (original: null)
        mitraStatus: role === 'MITRA' ? 'PENDING' : null,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    /* ─── [DEV-MODE] Email verification dispatch temporarily disabled ───
    // 12. Generate Secure Random Verification Token (64 hex characters)
    const plainVerificationToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(plainVerificationToken).digest('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Invalidate any previous verification tokens for this user if any exist
    await prisma.emailVerificationToken.deleteMany({
      where: { userId: newUser.id },
    })

    // Store token hash in database
    await prisma.emailVerificationToken.create({
      data: {
        userId: newUser.id,
        tokenHash,
        expiresAt,
      },
    })

    // 13. Dispatch Email Verification
    await sendVerificationEmail({
      to: normalizedEmail,
      name: sanitizedName,
      token: plainVerificationToken,
    })
    ───────────────────────────────────────────────────────────────────── */

    return NextResponse.json(
      {
        message: 'Registrasi berhasil! Akun Anda telah siap digunakan.',
      },
      { status: 201 }
    )
  } catch (error) {
    // Shield internal details in production, log full error on server
    console.error('[Registration Error]', error)
    const errorMessage =
      process.env.NODE_ENV === 'development' && error instanceof Error
        ? `Terjadi kendala pada sistem: ${error.message}`
        : 'Terjadi kendala pada sistem. Silakan coba beberapa saat lagi.'

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
