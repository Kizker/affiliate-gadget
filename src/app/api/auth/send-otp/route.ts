import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  dispatchOtp,
  normalizePhone,
  isValidIndonesianPhone,
} from '@/lib/notifications'
import { OtpPurpose, OtpChannel } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { identifier, purpose = 'LOGIN', channel = 'WHATSAPP', userId } = body

    if (!identifier) {
      return NextResponse.json(
        { error: 'Identifier (nomor HP atau email) wajib diisi' },
        { status: 400 }
      )
    }

    const isEmail = String(identifier).includes('@')
    let normalizedTarget = String(identifier).trim()

    if (isEmail) {
      normalizedTarget = normalizedTarget.toLowerCase()
    } else {
      normalizedTarget = normalizePhone(normalizedTarget)
      if (!isValidIndonesianPhone(normalizedTarget)) {
        return NextResponse.json(
          {
            error:
              'Nomor telepon tidak valid. Gunakan format nomor Indonesia (contoh: 0812xxx).',
          },
          { status: 400 }
        )
      }
    }

    // 1. Rate Limiting: Cooldown 60 detik
    const cooldownSeconds = parseInt(
      process.env.OTP_RESEND_COOLDOWN || '60',
      10
    )
    const latestOtp = await db.otpToken.findFirst({
      where: { identifier: normalizedTarget },
      orderBy: { createdAt: 'desc' },
    })

    if (latestOtp) {
      const elapsedSeconds = Math.floor(
        (Date.now() - latestOtp.createdAt.getTime()) / 1000
      )
      if (elapsedSeconds < cooldownSeconds) {
        return NextResponse.json(
          {
            error: `Mohon tunggu ${cooldownSeconds - elapsedSeconds} detik sebelum meminta OTP kembali.`,
            cooldownLeft: cooldownSeconds - elapsedSeconds,
          },
          { status: 429 }
        )
      }
    }

    // 2. Rate Limiting: Maksimal 5x per nomor per 24 jam
    const maxPerDay = parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const attemptsCount = await db.otpToken.count({
      where: {
        identifier: normalizedTarget,
        createdAt: { gte: oneDayAgo },
      },
    })

    if (attemptsCount >= maxPerDay) {
      return NextResponse.json(
        {
          error:
            'Batas permintaan OTP harian telah tercapai (maksimal 5 kali). Coba lagi besok.',
        },
        { status: 429 }
      )
    }

    // 3. Dispatch OTP
    const otpChannel = channel as OtpChannel
    const otpPurpose = purpose as OtpPurpose

    const result = await dispatchOtp({
      identifier: normalizedTarget,
      purpose: otpPurpose,
      channel: otpChannel,
      userId,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.errorMessage || 'Gagal mengirim kode OTP' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Kode OTP berhasil dikirim melalui ${otpChannel}`,
      expiresIn: parseInt(process.env.OTP_EXPIRE_SECONDS || '300', 10),
      cooldown: cooldownSeconds,
      channel: otpChannel,
    })
  } catch (error) {
    console.error('[API SEND OTP ERROR]:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan internal saat memproses pengiriman OTP' },
      { status: 500 }
    )
  }
}
