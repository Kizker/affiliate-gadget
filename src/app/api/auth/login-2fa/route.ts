import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'
import {
  is2FaEnabled,
  createLoginOtp,
  verifyLoginOtp,
} from '@/lib/two-factor-store'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, email, password, otp } = body

    const cleanEmail = String(email || '')
      .trim()
      .toLowerCase()

    if (!cleanEmail) {
      return NextResponse.json({ error: 'Email wajib diisi' }, { status: 400 })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. Action: CHECK credentials & whether 2FA is required
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
          isActive: true,
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

      // Check if user has 2FA enabled
      const enabled = is2FaEnabled(user.id) || is2FaEnabled(user.email)

      // If user has 2FA enabled AND has registered phone number:
      if (enabled && user.phone && user.phone.trim().length >= 8) {
        const otpData = createLoginOtp(user.email, user.phone)
        const masked = user.phone.replace(/(\d{4})\d+(\d{3})/, '$1****$2')

        return NextResponse.json({
          requires2FA: true,
          email: user.email,
          phone: user.phone,
          maskedPhone: masked,
          whatsappUrl: otpData.whatsappUrl,
          otpPreview: otpData.code,
          expiresInSeconds: otpData.expiresInSeconds,
        })
      }

      // If 2FA is not enabled, user can log in directly with credentials
      return NextResponse.json({
        requires2FA: false,
        email: user.email,
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

      const result = verifyLoginOtp(cleanEmail, otp)
      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Kode OTP tidak cocok' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Verifikasi OTP WhatsApp berhasil',
      })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. Action: RESEND login OTP
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'resend') {
      const user = await prisma.user.findUnique({
        where: { email: cleanEmail },
        select: { email: true, phone: true },
      })

      if (!user || !user.phone) {
        return NextResponse.json(
          { error: 'Nomor WhatsApp pengguna tidak ditemukan' },
          { status: 404 }
        )
      }

      const otpData = createLoginOtp(user.email, user.phone)
      const masked = user.phone.replace(/(\d{4})\d+(\d{3})/, '$1****$2')

      return NextResponse.json({
        success: true,
        maskedPhone: masked,
        whatsappUrl: otpData.whatsappUrl,
        otpPreview: otpData.code,
        expiresInSeconds: otpData.expiresInSeconds,
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
