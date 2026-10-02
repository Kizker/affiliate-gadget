import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import { isAdminStaffRole } from '@/lib/dashboard-utils'
import { getTotalWithdrawn } from '@/lib/store-withdrawal-store'
import { GATEWAY_FEE_PER_TRANSACTION } from '@/lib/finance-constants'
import {
  checkBankAccountCooldown,
  validateAccountNameMatch,
  checkWithdrawalRateLimit,
  WITHDRAWAL_RATE_LIMIT_PER_HOUR,
} from '@/lib/withdrawal-security'
import {
  dispatchOtp,
  normalizePhone,
  isValidIndonesianPhone,
} from '@/lib/notifications'
import { OtpPurpose, OtpChannel } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || !isAdminStaffRole(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Rate Limiting Permintaan Penarikan
    const rateLimitCheck = checkWithdrawalRateLimit(session.user.id)
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: `Batas pengajuan penarikan dana tercapai (maksimal ${WITHDRAWAL_RATE_LIMIT_PER_HOUR} kali per jam). Silakan coba lagi dalam ${rateLimitCheck.retryAfterSeconds} detik.`,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfterSeconds: rateLimitCheck.retryAfterSeconds,
        },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { amount, storeId: requestStoreId, identifier } = body

    const numericAmount = Number(amount)
    if (!numericAmount || isNaN(numericAmount) || numericAmount < 100000) {
      return NextResponse.json(
        {
          error: 'Nominal penarikan minimal Rp 100.000',
          code: 'INVALID_AMOUNT',
        },
        { status: 400 }
      )
    }

    const isStoreAdmin = session.user.role === 'STORE_ADMIN'
    let storeId = isStoreAdmin
      ? (session.user as { storeId?: string }).storeId
      : requestStoreId || undefined

    if (!storeId) {
      const firstStore = await prisma.store.findFirst({
        where: { isActive: true },
      })
      storeId = firstStore?.id
    }

    if (!storeId) {
      return NextResponse.json(
        { error: 'Toko cabang tidak ditemukan', code: 'STORE_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Ambil info toko dan rekening bank
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        bankAccounts: {
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        },
      },
    })

    if (!store) {
      return NextResponse.json(
        { error: 'Data toko tidak ditemukan', code: 'STORE_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Gerbang 1: Cooling-down Period 24 Jam
    const cooldownCheck = checkBankAccountCooldown(store.bankAccountUpdatedAt)
    if (cooldownCheck.isLocked) {
      return NextResponse.json(
        {
          error: `Penarikan terkunci cooling-down 24 jam. Sisa waktu: ${cooldownCheck.remainingHours} jam ${cooldownCheck.remainingMinutes} menit.`,
          code: 'COOLING_DOWN',
          remainingHours: cooldownCheck.remainingHours,
          remainingMinutes: cooldownCheck.remainingMinutes,
        },
        { status: 403 }
      )
    }

    // Gerbang 2: Validasi Rekening Bank PT
    const primaryBank =
      store.bankAccounts.find((b) => b.isPrimary) || store.bankAccounts[0]
    if (!primaryBank) {
      return NextResponse.json(
        {
          error:
            'Rekening bank penampungan PT belum didaftarkan pada profil cabang.',
          code: 'NO_BANK_ACCOUNT',
        },
        { status: 400 }
      )
    }

    const nameMatchCheck = validateAccountNameMatch(
      primaryBank.accountName,
      store.companyName || store.name
    )
    if (!nameMatchCheck.isValid) {
      return NextResponse.json(
        {
          error: `Nama pemilik rekening (${primaryBank.accountName}) tidak sesuai dengan nama badan usaha PT (${store.companyName || store.name}). Pencairan diblokir demi keamanan finansial.`,
          code: 'ACCOUNT_NAME_MISMATCH',
          similarityScore: nameMatchCheck.similarityScore,
        },
        { status: 403 }
      )
    }

    // Pengecekan Kecukupan Saldo Siap Cair
    const completedOrders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        OR: [
          { storeId: store.id },
          { items: { some: { product: { storeId: store.id } } } },
        ],
      },
      select: {
        subtotal: true,
        discountAmount: true,
        commissionAmount: true,
      },
    })

    const completedNetRevenue = completedOrders.reduce((sum, ord) => {
      const net = Math.max(
        0,
        (ord.subtotal || 0) -
          (ord.discountAmount || 0) -
          (ord.commissionAmount || 0)
      )
      return sum + net
    }, 0)

    const totalGatewayFee = completedOrders.length * GATEWAY_FEE_PER_TRANSACTION
    const totalWithdrawn = await getTotalWithdrawn(store.id)
    const availableBalance = Math.max(
      0,
      completedNetRevenue - totalGatewayFee - totalWithdrawn
    )

    if (numericAmount > availableBalance) {
      return NextResponse.json(
        {
          error: `Saldo siap cair tidak mencukupi (Tersedia: Rp ${availableBalance.toLocaleString('id-ID')}).`,
          code: 'INSUFFICIENT_BALANCE',
          availableBalance,
        },
        { status: 400 }
      )
    }

    // Resolusi Target Pengiriman OTP
    let targetPhone = identifier ? String(identifier).trim() : ''
    if (!targetPhone) {
      targetPhone = (session.user as any).phone || store.phone || ''
    }

    let normalizedTarget = ''
    let chosenChannel: OtpChannel = 'WHATSAPP'

    if (targetPhone && !targetPhone.includes('@')) {
      normalizedTarget = normalizePhone(targetPhone)
      if (!isValidIndonesianPhone(normalizedTarget)) {
        normalizedTarget = ''
      }
    }

    // Fallback ke email jika nomor telepon tidak valid
    if (!normalizedTarget) {
      if (session.user.email) {
        normalizedTarget = session.user.email.toLowerCase()
        chosenChannel = 'EMAIL'
      } else {
        return NextResponse.json(
          {
            error:
              'Nomor WhatsApp atau email resmi tidak valid untuk pengiriman OTP 2FA.',
            code: 'INVALID_TARGET',
          },
          { status: 400 }
        )
      }
    }

    // Rate Limiting Pengiriman OTP (Maks 3x penarikan per hari)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const attemptsCount = await prisma.otpToken.count({
      where: {
        identifier: normalizedTarget,
        createdAt: { gte: oneDayAgo },
        purpose: 'WITHDRAWAL' as any,
      },
    })

    if (attemptsCount >= 3) {
      return NextResponse.json(
        {
          error:
            'Batas permintaan OTP penarikan harian telah tercapai (maksimal 3 kali). Silakan coba lagi besok.',
          code: 'OTP_MAX_ATTEMPTS',
        },
        { status: 429 }
      )
    }

    // Kirimkan OTP Penarikan Resmi
    const dispatchResult = await dispatchOtp({
      identifier: normalizedTarget,
      purpose: 'WITHDRAWAL' as OtpPurpose,
      channel: chosenChannel,
      userId: session.user.id,
    })

    if (!dispatchResult.success) {
      return NextResponse.json(
        {
          error:
            dispatchResult.errorMessage ||
            'Gagal mengirim kode OTP verifikasi penarikan.',
          code: 'OTP_DISPATCH_FAILED',
        },
        { status: 500 }
      )
    }

    const expiresIn = parseInt(process.env.OTP_EXPIRE_SECONDS || '300', 10)
    const cooldownSeconds = parseInt(
      process.env.OTP_RESEND_COOLDOWN || '60',
      10
    )

    return NextResponse.json({
      success: true,
      message: `Kode OTP verifikasi penarikan berhasil dikirim ke ${chosenChannel === 'WHATSAPP' ? 'WhatsApp' : 'Email'}.`,
      expiresIn,
      cooldown: cooldownSeconds,
      channel: chosenChannel,
      target: normalizedTarget,
      devCode:
        process.env.NODE_ENV !== 'production' ? dispatchResult.code : undefined,
    })
  } catch (error: any) {
    console.error('[WITHDRAW_REQUEST_OTP_ERROR]:', error)
    return NextResponse.json(
      {
        error:
          error?.message ||
          'Terjadi kesalahan internal saat memproses permintaan OTP penarikan.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}
