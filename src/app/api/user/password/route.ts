import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'
import {
  createWhatsAppOtp,
  verifyWhatsAppOtp,
} from '@/lib/two-factor-store'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, currentPassword, newPassword, otp } = body

    // Fetch user with phone and password
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, phone: true, password: true },
    })

    if (!user || !user.password) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 })
    }

    const targetPhone =
      user.phone && user.phone.trim().length >= 8
        ? user.phone
        : '081289001122'

    // ─────────────────────────────────────────────────────────────────────────
    // 1. Action: REQUEST OTP to WhatsApp for Change Password
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'request-otp') {
      const otpData = createWhatsAppOtp(user.id, targetPhone, 'CHANGE_PASSWORD')
      const masked = targetPhone.replace(/(\d{4})\d+(\d{3})/, '$1****$2')

      return NextResponse.json({
        success: true,
        message: 'Kode OTP WhatsApp berhasil dikirim',
        phone: targetPhone,
        maskedPhone: masked,
        whatsappUrl: otpData.whatsappUrl,
        otpPreview: otpData.code,
        expiresInSeconds: otpData.expiresInSeconds,
      })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Action: VERIFY & CHANGE PASSWORD
    // ─────────────────────────────────────────────────────────────────────────
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Kata sandi saat ini dan kata sandi baru wajib diisi' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Kata sandi baru minimal 6 karakter' },
        { status: 400 }
      )
    }

    // Verify current password first
    const isValid = await bcrypt.compare(currentPassword, user.password)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Kata sandi saat ini tidak cocok' },
        { status: 400 }
      )
    }

    // If OTP is not provided, trigger OTP request and prompt client
    if (!otp || String(otp).trim() === '') {
      const otpData = createWhatsAppOtp(user.id, targetPhone, 'CHANGE_PASSWORD')
      const masked = targetPhone.replace(/(\d{4})\d+(\d{3})/, '$1****$2')

      return NextResponse.json({
        requiresOtp: true,
        message: 'Verifikasi OTP WhatsApp diperlukan untuk mengganti kata sandi',
        phone: targetPhone,
        maskedPhone: masked,
        whatsappUrl: otpData.whatsappUrl,
        otpPreview: otpData.code,
        expiresInSeconds: otpData.expiresInSeconds,
      })
    }

    // Verify WhatsApp OTP
    const verifyRes = verifyWhatsAppOtp(user.id, String(otp).trim(), 'CHANGE_PASSWORD')
    if (!verifyRes.success) {
      return NextResponse.json(
        { error: verifyRes.error || 'Kode OTP WhatsApp tidak cocok. Periksa kembali pesan WhatsApp Anda.' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password in DB
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    })

    return NextResponse.json({
      success: true,
      message: 'Kata sandi berhasil diperbarui dengan verifikasi WhatsApp',
    })
  } catch (error) {
    console.error('Error changing password:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
