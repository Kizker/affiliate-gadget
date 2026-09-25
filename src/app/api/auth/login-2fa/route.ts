import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'
import { maskEmail } from '@/lib/utils'
import { createLoginOtp, verifyLoginOtp } from '@/lib/two-factor-store'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, email, password, otp, identifierUsed } = body

    const cleanEmail = String(email || '')
      .trim()
      .toLowerCase()

    if (!cleanEmail) {
      return NextResponse.json({ error: 'Email wajib diisi' }, { status: 400 })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. Action: CHECK credentials & send default Email OTP
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'check') {
      if (!password) {
        return NextResponse.json(
          { error: 'Kata sandi wajib diisi' },
          { status: 400 }
        )
      }

      const user = await prisma.user.findUnique({
        where: { email: cleanEmail },
        select: {
          id: true,
          email: true,
          password: true,
          phone: true,
          role: true,
          isActive: true,
          twoFactorEnabled: true,
        },
      })

      if (!user || !user.password) {
        return NextResponse.json(
          {
            error:
              'Email atau kata sandi tidak cocok. Silakan periksa kembali.',
          },
          { status: 401 }
        )
      }

      if (!user.isActive) {
        return NextResponse.json(
          { error: 'Akun Anda sedang dinonaktifkan oleh administrator.' },
          { status: 403 }
        )
      }

      const passwordsMatch = await bcrypt.compare(password, user.password)
      if (!passwordsMatch) {
        return NextResponse.json(
          {
            error:
              'Email atau kata sandi tidak cocok. Silakan periksa kembali.',
          },
          { status: 401 }
        )
      }

      // ───────────────────────────────────────────────────────────────────────
      // Evaluasi Kebutuhan 2FA:
      // 1. Akun Toko & Staf (STORE_ADMIN, ADMIN, SUPER_ADMIN, TECHNICIAN, dll): Bebas 2FA
      // 2. Akun Dummy Database (@affiliategadget.com, @test.com): Bebas 2FA
      // 3. Akun Customer biasa: Hanya wajib 2FA jika twoFactorEnabled aktif di pengaturan
      // ───────────────────────────────────────────────────────────────────────
      const isStoreOrStaff = [
        'STORE_ADMIN',
        'ADMIN',
        'SUPER_ADMIN',
        'STORE_SALES',
        'FINANCE_ADMIN',
        'CONTENT_EDITOR',
        'TECHNICIAN',
      ].includes(user.role)

      const isDummyDomain =
        cleanEmail.endsWith('@affiliategadget.com') ||
        cleanEmail.endsWith('@test.com')

      const { is2FaEnabled } = await import('@/lib/two-factor-store')
      const is2FaActive =
        Boolean(user.twoFactorEnabled) ||
        is2FaEnabled(user.id) ||
        is2FaEnabled(user.email)

      const requires2FA = is2FaActive && !isStoreOrStaff && !isDummyDomain

      if (!requires2FA) {
        return NextResponse.json({
          requires2FA: false,
          email: user.email,
        })
      }

      // Default: Dispatch OTP ke Email pengguna (jika 2FA aktif)
      const { dispatchOtp } = await import('@/lib/notifications')
      await dispatchOtp({
        identifier: user.email,
        purpose: 'LOGIN',
        channel: 'EMAIL',
        userId: user.id,
      }).catch((err) => console.error('[LOGIN 2FA DISPATCH EMAIL ERROR]:', err))

      const targetPhone =
        user.phone && user.phone.trim().length >= 8 ? user.phone.trim() : null
      const maskedPhone = targetPhone
        ? targetPhone.replace(/(\d{4})\d+(\d{3})/, '$1****$2')
        : undefined

      return NextResponse.json({
        requires2FA: true,
        email: user.email,
        maskedEmail: maskEmail(user.email),
        hasPhone: !!targetPhone,
        phone: targetPhone || undefined,
        maskedPhone: maskedPhone || undefined,
        expiresInSeconds: 300,
      })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Action: VERIFY login OTP
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'verify') {
      if (!otp) {
        return NextResponse.json(
          { error: 'Kode OTP wajib dimasukkan' },
          { status: 400 }
        )
      }

      const targetIdentifier = identifierUsed
        ? String(identifierUsed).trim()
        : cleanEmail

      // 1. Cek validasi OTP di database via validateOtpRecord
      const { validateOtpRecord, consumeOtpRecord } =
        await import('@/lib/notifications')
      const validation = await validateOtpRecord({
        identifier: targetIdentifier,
        code: String(otp).trim(),
        purpose: 'LOGIN',
      })

      if (validation.valid && validation.otpToken) {
        await consumeOtpRecord(validation.otpToken.id)
        try {
          const { clearOtp } = await import('@/lib/two-factor-store')
          clearOtp(cleanEmail, 'LOGIN')
        } catch {}

        return NextResponse.json({
          success: true,
          message: 'Verifikasi OTP berhasil',
        })
      }

      // 2. Fallback to legacy two-factor-store for backwards compatibility
      const legacyResult = verifyLoginOtp(cleanEmail, otp)
      if (legacyResult.success) {
        return NextResponse.json({
          success: true,
          message: 'Verifikasi OTP berhasil',
        })
      }

      const errMsg =
        validation.error === 'EXPIRED'
          ? 'Kode OTP telah kadaluarsa. Silakan minta kode baru.'
          : validation.error === 'MAX_ATTEMPTS_EXCEEDED'
            ? 'Terlalu banyak percobaan salah. Silakan kirim ulang kode OTP baru.'
            : legacyResult.error || 'Kode OTP tidak cocok'

      return NextResponse.json({ error: errMsg }, { status: 400 })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. Action: RESEND login OTP (Email, WhatsApp, or SMS)
    // ─────────────────────────────────────────────────────────────────────────
    if (
      action === 'resend' ||
      action === 'resend-email' ||
      action === 'resend-wa' ||
      action === 'resend-sms'
    ) {
      const user = await prisma.user.findUnique({
        where: { email: cleanEmail },
        select: { id: true, email: true, phone: true },
      })

      if (!user) {
        return NextResponse.json(
          { error: 'Pengguna tidak ditemukan' },
          { status: 404 }
        )
      }

      const { dispatchOtp } = await import('@/lib/notifications')

      // Case: WhatsApp Fallback
      if (
        action === 'resend-wa' ||
        (action === 'resend' && body.channel === 'WHATSAPP')
      ) {
        if (!user.phone) {
          return NextResponse.json(
            { error: 'Nomor WhatsApp pengguna tidak ditemukan' },
            { status: 400 }
          )
        }

        await dispatchOtp({
          identifier: user.phone,
          purpose: 'LOGIN',
          channel: 'WHATSAPP',
          userId: user.id,
        })
        const otpData = createLoginOtp(user.email, user.phone)
        const masked = user.phone.replace(/(\d{4})\d+(\d{3})/, '$1****$2')

        return NextResponse.json({
          success: true,
          channel: 'WHATSAPP',
          maskedPhone: masked,
          phone: user.phone,
          whatsappUrl: otpData.whatsappUrl,
          otpPreview: otpData.code,
          expiresInSeconds: 300,
        })
      }

      // Case: SMS Fallback
      if (
        action === 'resend-sms' ||
        (action === 'resend' && body.channel === 'SMS')
      ) {
        if (!user.phone) {
          return NextResponse.json(
            { error: 'Nomor telepon pengguna tidak ditemukan' },
            { status: 400 }
          )
        }

        await dispatchOtp({
          identifier: user.phone,
          purpose: 'LOGIN',
          channel: 'SMS',
          userId: user.id,
        })
        const masked = user.phone.replace(/(\d{4})\d+(\d{3})/, '$1****$2')

        return NextResponse.json({
          success: true,
          channel: 'SMS',
          maskedPhone: masked,
          phone: user.phone,
          expiresInSeconds: 300,
        })
      }

      // Case: Default Email
      await dispatchOtp({
        identifier: user.email,
        purpose: 'LOGIN',
        channel: 'EMAIL',
        userId: user.id,
      })

      return NextResponse.json({
        success: true,
        channel: 'EMAIL',
        maskedEmail: maskEmail(user.email),
        expiresInSeconds: 300,
      })
    }

    return NextResponse.json(
      { error: 'Action tidak dikenali' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in login-2fa API:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat memproses verifikasi login' },
      { status: 500 }
    )
  }
}
