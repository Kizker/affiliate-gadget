import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  validateOtpRecord,
  consumeOtpRecord,
  normalizePhone,
} from '@/lib/notifications'
import { OtpPurpose } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { identifier, code, purpose = 'LOGIN' } = body

    if (!identifier || !code) {
      return NextResponse.json(
        { error: 'Identifier dan kode OTP wajib diisi' },
        { status: 400 }
      )
    }

    const isEmail = String(identifier).includes('@')
    const normalizedTarget = isEmail
      ? String(identifier).trim().toLowerCase()
      : normalizePhone(String(identifier))

    const validation = await validateOtpRecord({
      identifier: normalizedTarget,
      code: String(code).trim(),
      purpose: purpose as OtpPurpose,
    })

    if (!validation.valid) {
      switch (validation.error) {
        case 'NOT_FOUND':
          return NextResponse.json(
            {
              error:
                'Kode OTP belum diminta atau sudah tidak berlaku. Silakan minta kode baru.',
            },
            { status: 404 }
          )
        case 'EXPIRED':
          return NextResponse.json(
            {
              error:
                'Kode OTP telah kadaluarsa (melewati 5 menit). Silakan minta kode baru.',
            },
            { status: 400 }
          )
        case 'MAX_ATTEMPTS_EXCEEDED':
          return NextResponse.json(
            {
              error:
                'Terlalu banyak percobaan salah. Kode OTP dibatalkan. Silakan kirim ulang.',
            },
            { status: 400 }
          )
        case 'INVALID_CODE':
          return NextResponse.json(
            {
              error: 'Kode OTP yang dimasukkan salah.',
              attemptsLeft: validation.attemptsLeft,
            },
            { status: 400 }
          )
        default:
          return NextResponse.json(
            { error: 'Verifikasi kode OTP gagal.' },
            { status: 400 }
          )
      }
    }

    // OTP Valid -> Consume OTP
    if (validation.otpToken) {
      await consumeOtpRecord(validation.otpToken.id)

      // Jika verifikasi untuk pendaftaran akun atau verifikasi telepon
      if (purpose === 'REGISTER' || purpose === 'CHANGE_PHONE') {
        await db.user.updateMany({
          where: {
            OR: [
              { phone: normalizedTarget },
              { id: validation.otpToken.userId || undefined },
            ],
          },
          data: {
            phoneVerified: new Date(),
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Kode OTP berhasil diverifikasi',
    })
  } catch (error) {
    console.error('[API VERIFY OTP ERROR]:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan internal saat memverifikasi OTP' },
      { status: 500 }
    )
  }
}
