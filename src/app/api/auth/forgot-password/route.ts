import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { dispatchOtp } from '@/lib/notifications'
import {
  validateOtpRecord,
  consumeOtpRecord,
} from '@/lib/notifications/otp-generator'
import {
  forgotPasswordRequestSchema,
  forgotPasswordVerifySchema,
  forgotPasswordResetSchema,
} from '@/lib/validations/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    // ─────────────────────────────────────────────────────────────────────────
    // 1. ACTION: REQUEST OTP VIA EMAIL (RESEND)
    // ─────────────────────────────────────────────────────────────────────────
    if (!action || action === 'request-otp') {
      const parsed = forgotPasswordRequestSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          {
            error:
              parsed.error.issues[0]?.message || 'Alamat email tidak valid',
          },
          { status: 400 }
        )
      }

      const email = parsed.data.email.toLowerCase().trim()

      const user = await db.user.findUnique({
        where: { email },
        select: { id: true, email: true, name: true, isActive: true },
      })

      if (!user) {
        return NextResponse.json(
          { error: 'Alamat email tidak terdaftar di sistem kami' },
          { status: 404 }
        )
      }

      if (!user.isActive) {
        return NextResponse.json(
          {
            error: 'Akun Anda dinonaktifkan. Silakan hubungi layanan bantuan.',
          },
          { status: 403 }
        )
      }

      const dispatchResult = await dispatchOtp({
        identifier: user.email,
        purpose: 'CHANGE_PASSWORD',
        channel: 'EMAIL',
        userId: user.id,
      })

      if (!dispatchResult.success) {
        return NextResponse.json(
          {
            error:
              dispatchResult.errorMessage ||
              'Gagal mengirim kode OTP ke email Anda via Resend. Silakan coba lagi.',
          },
          { status: 500 }
        )
      }

      // Mask email for privacy display (e.g., cu****r@test.com)
      const atIndex = user.email.indexOf('@')
      const namePart = user.email.slice(0, atIndex)
      const domainPart = user.email.slice(atIndex)
      const maskedName =
        namePart.length <= 2
          ? namePart + '***'
          : `${namePart.slice(0, 2)}${'*'.repeat(Math.max(1, namePart.length - 3))}${namePart.slice(-1)}`
      const maskedEmail = `${maskedName}${domainPart}`

      return NextResponse.json({
        success: true,
        message:
          'Kode OTP 6-digit berhasil dikirimkan ke email Anda melalui Resend.',
        maskedEmail,
        expiresInSeconds: 300,
        cooldownSeconds: 60,
        otpPreview: dispatchResult.code,
      })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. ACTION: VERIFY OTP
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'verify-otp') {
      const parsed = forgotPasswordVerifySchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          {
            error:
              parsed.error.issues[0]?.message || 'Data verifikasi tidak valid',
          },
          { status: 400 }
        )
      }

      const email = parsed.data.email.toLowerCase().trim()
      const otp = parsed.data.otp.trim()

      const validation = await validateOtpRecord({
        identifier: email,
        code: otp,
        purpose: 'CHANGE_PASSWORD',
      })

      if (!validation.valid) {
        let errorMsg = 'Kode OTP tidak valid'
        if (validation.error === 'NOT_FOUND') {
          errorMsg =
            'Kode OTP tidak ditemukan atau belum diminta. Silakan minta kode baru.'
        } else if (validation.error === 'EXPIRED') {
          errorMsg =
            'Kode OTP telah kedaluwarsa. Silakan klik kirim ulang kode OTP.'
        } else if (validation.error === 'MAX_ATTEMPTS_EXCEEDED') {
          errorMsg =
            'Batas maksimal percobaan OTP tercapai. Silakan minta kode baru.'
        } else if (validation.error === 'INVALID_CODE') {
          errorMsg = `Kode OTP salah. Sisa kesempatan: ${validation.attemptsLeft ?? 0} kali.`
        }
        return NextResponse.json({ error: errorMsg }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        message:
          'Kode OTP berhasil diverifikasi. Silakan atur kata sandi baru Anda.',
      })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. ACTION: RESET PASSWORD
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'reset-password') {
      const parsed = forgotPasswordResetSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          {
            error:
              parsed.error.issues[0]?.message ||
              'Formulir kata sandi baru tidak valid',
          },
          { status: 400 }
        )
      }

      const email = parsed.data.email.toLowerCase().trim()
      const otp = parsed.data.otp.trim()
      const newPassword = parsed.data.newPassword

      // Validasi OTP kembali sebelum commit kata sandi baru
      const validation = await validateOtpRecord({
        identifier: email,
        code: otp,
        purpose: 'CHANGE_PASSWORD',
      })

      if (!validation.valid || !validation.otpToken) {
        return NextResponse.json(
          {
            error:
              'Sesi verifikasi OTP tidak valid atau telah kedaluwarsa. Minta OTP baru.',
          },
          { status: 400 }
        )
      }

      // Hash password baru dengan Bcrypt (salt round 10)
      const hashedPassword = await bcrypt.hash(newPassword, 10)

      // Update password pengguna
      await db.user.update({
        where: { email },
        data: {
          password: hashedPassword,
        },
      })

      // Tandai OTP sebagai sudah digunakan (consumed)
      await consumeOtpRecord(validation.otpToken.id)

      return NextResponse.json({
        success: true,
        message:
          'Kata sandi Anda berhasil diperbarui! Silakan masuk dengan kata sandi baru Anda.',
      })
    }

    return NextResponse.json(
      { error: 'Aksi permintaan tidak dikenali' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[FORGOT PASSWORD API ERROR]:', error)
    return NextResponse.json(
      {
        error:
          'Terjadi kesalahan sistem internal. Silakan coba beberapa saat lagi.',
      },
      { status: 500 }
    )
  }
}
