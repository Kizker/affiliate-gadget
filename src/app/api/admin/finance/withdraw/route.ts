import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import { isAdminStaffRole } from '@/lib/dashboard-utils'
import {
  createStoreWithdrawal,
  getTotalWithdrawn,
} from '@/lib/store-withdrawal-store'
import {
  checkBankAccountCooldown,
  validateAccountNameMatch,
  checkWithdrawalRateLimit,
  WITHDRAWAL_RATE_LIMIT_PER_HOUR,
} from '@/lib/withdrawal-security'
import {
  validateOtpRecord,
  consumeOtpRecord,
  sendEmail,
  withdrawalConfirmationEmailTemplate,
  withdrawalSecurityAlertEmailTemplate,
} from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || !isAdminStaffRole(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Task 7.1: Rate Limiting Permintaan Penarikan (Maksimal 5x / jam per userId)
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
    const { amount, storeId: requestStoreId, otpCode } = body

    const numericAmount = Number(amount)
    if (!numericAmount || isNaN(numericAmount) || numericAmount < 100000) {
      return NextResponse.json(
        { error: 'Nominal penarikan minimal Rp 100.000' },
        { status: 400 }
      )
    }

    const isStoreAdmin = session.user.role === 'STORE_ADMIN'
    let storeId = isStoreAdmin
      ? (session.user as { storeId?: string }).storeId
      : requestStoreId || undefined

    if (!storeId) {
      // Fallback untuk Superadmin jika tidak kirim storeId
      const firstStore = await prisma.store.findFirst({
        where: { isActive: true },
      })
      storeId = firstStore?.id
    }

    if (!storeId) {
      return NextResponse.json(
        { error: 'Toko cabang tidak ditemukan' },
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
        { error: 'Data toko tidak ditemukan' },
        { status: 404 }
      )
    }

    // Hitung saldo siap cair saat ini
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

    const totalWithdrawn = getTotalWithdrawn(store.id)
    const availableBalance = Math.max(0, completedNetRevenue - totalWithdrawn)

    if (numericAmount > availableBalance) {
      return NextResponse.json(
        {
          error: `Saldo siap cair tidak mencukupi (Tersedia: Rp ${availableBalance.toLocaleString('id-ID')})`,
          code: 'INSUFFICIENT_BALANCE',
        },
        { status: 400 }
      )
    }

    // GATE 1: Cooling-down Period 24 Jam setelah perubahan rekening bank (Task 2.2)
    const storeBankAccountUpdatedAt = (store as any).bankAccountUpdatedAt as
      | Date
      | null
      | undefined
    const cooldownStatus = checkBankAccountCooldown(storeBankAccountUpdatedAt)
    if (cooldownStatus.isLocked) {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'WITHDRAWAL_BLOCKED_COOLDOWN',
          entityType: 'StoreWithdrawal',
          entityId: store.id,
          details: {
            storeId: store.id,
            amount: numericAmount,
            bankAccountUpdatedAt: storeBankAccountUpdatedAt
              ? new Date(storeBankAccountUpdatedAt).toISOString()
              : null,
            cooldownStatus: { ...cooldownStatus },
          } as any,
        },
      })

      return NextResponse.json(
        {
          error: `Penarikan saldo dikunci sementara demi keamanan karena terdeteksi perubahan rekening bank dalam kurun waktu 24 jam terakhir. Sisa waktu penguncian: ${cooldownStatus.remainingHours} jam ${cooldownStatus.remainingMinutes} menit.`,
          code: 'COOLING_DOWN',
          cooldownStatus,
        },
        { status: 403 }
      )
    }

    const primaryBank = store.bankAccounts.find((b) => b.isPrimary) ||
      store.bankAccounts[0] || {
        bankName: 'Bank Mandiri',
        accountNumber: '1180019283741',
        accountName: store.companyName,
      }

    // GATE 2: Validasi Kesesuaian Nama Pemilik Rekening vs Badan Hukum PT (Task 3.1 & 3.2)
    const nameValidation = validateAccountNameMatch(
      primaryBank.accountName,
      store.companyName
    )

    if (!nameValidation.isValid) {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'WITHDRAWAL_BLOCKED_NAME_MISMATCH',
          entityType: 'StoreWithdrawal',
          entityId: store.id,
          details: {
            storeId: store.id,
            amount: numericAmount,
            bankName: primaryBank.bankName,
            accountNumber: primaryBank.accountNumber,
            accountName: primaryBank.accountName,
            companyName: store.companyName,
            similarityScore: nameValidation.similarityScore,
            reason: nameValidation.reason,
          },
        },
      })

      return NextResponse.json(
        {
          error: nameValidation.reason,
          code: 'ACCOUNT_NAME_MISMATCH',
          similarityScore: nameValidation.similarityScore,
        },
        { status: 400 }
      )
    }

    // GATE 3: Tantangan Verifikasi OTP / 2FA (Task 4.2)
    if (
      !otpCode ||
      typeof otpCode !== 'string' ||
      otpCode.trim().length !== 6
    ) {
      return NextResponse.json(
        {
          error:
            'Kode OTP 6 digit wajib disertakan untuk verifikasi penarikan dana.',
          code: 'OTP_REQUIRED',
        },
        { status: 400 }
      )
    }

    const userIdentifier =
      session.user.email || (session.user as { phone?: string }).phone

    if (!userIdentifier) {
      return NextResponse.json(
        {
          error:
            'Kontak pengguna (email/nomor HP) tidak ditemukan untuk validasi OTP.',
          code: 'IDENTIFIER_NOT_FOUND',
        },
        { status: 400 }
      )
    }

    const otpValidation = await validateOtpRecord({
      identifier: userIdentifier,
      code: otpCode.trim(),
      purpose: 'WITHDRAWAL' as any,
    })

    if (!otpValidation.valid) {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'WITHDRAWAL_FAILED_OTP',
          entityType: 'StoreWithdrawal',
          entityId: store.id,
          details: {
            storeId: store.id,
            amount: numericAmount,
            error: otpValidation.error,
            attemptsLeft: otpValidation.attemptsLeft,
          },
        },
      })

      if (otpValidation.error === 'MAX_ATTEMPTS_EXCEEDED') {
        // Task 7.4: Kirim email peringatan keamanan jika OTP salah 3 kali
        if (session.user.email) {
          sendEmail(
            session.user.email,
            `⚠️ Peringatan Keamanan: Percobaan Penarikan Saldo Diblokir — ${store.name}`,
            withdrawalSecurityAlertEmailTemplate({
              storeName: store.name,
              userName: session.user.name || session.user.email,
              reason:
                'Batas percobaan salah kode OTP penarikan terlampaui (3 kali berturut-turut). Akun dikunci dari pengajuan penarikan dana.',
              attempts: 3,
              time: new Date().toLocaleString('id-ID'),
            })
          ).catch((err) =>
            console.error('[WITHDRAWAL_ALERT_EMAIL_ERROR]:', err)
          )
        }

        return NextResponse.json(
          {
            error:
              'Kode OTP diblokir karena melebihi 3 kali batas kesalahan. Silakan minta kode OTP baru.',
            code: 'OTP_BLOCKED',
          },
          { status: 429 }
        )
      }

      if (otpValidation.error === 'EXPIRED') {
        return NextResponse.json(
          {
            error:
              'Kode OTP telah kedaluwarsa (berlaku 5 menit). Silakan minta kode OTP baru.',
            code: 'OTP_EXPIRED',
          },
          { status: 400 }
        )
      }

      if (otpValidation.error === 'NOT_FOUND') {
        return NextResponse.json(
          {
            error:
              'Kode OTP tidak ditemukan atau sudah digunakan. Silakan minta kode OTP baru.',
            code: 'OTP_NOT_FOUND',
          },
          { status: 400 }
        )
      }

      return NextResponse.json(
        {
          error: `Kode OTP salah. Sisa kesempatan percobaan: ${otpValidation.attemptsLeft ?? 0} kali.`,
          code: 'OTP_INVALID',
          attemptsLeft: otpValidation.attemptsLeft,
        },
        { status: 400 }
      )
    }

    // Tandai OTP telah digunakan
    if (otpValidation.otpToken) {
      await consumeOtpRecord(otpValidation.otpToken.id)
    }

    // Buat record withdrawal setelah semua gerbang keamanan lolos
    const withdrawal = createStoreWithdrawal({
      storeId: store.id,
      storeName: store.name,
      companyName: store.companyName,
      bankName: primaryBank.bankName,
      accountNumber: primaryBank.accountNumber,
      accountName: primaryBank.accountName,
      amount: numericAmount,
      status: 'SUCCESS',
      requestedBy: session.user.name || session.user.email || 'Admin Toko',
    })

    // Audit log sukses (Task 7.2)
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'WITHDRAWAL_SUCCESS',
        entityType: 'StoreWithdrawal',
        entityId: withdrawal.id,
        details: {
          storeId: store.id,
          amount: numericAmount,
          bankName: primaryBank.bankName,
          accountNumber: primaryBank.accountNumber,
          accountName: primaryBank.accountName,
          refNumber: withdrawal.refNumber,
        },
      },
    })

    // Task 7.3: Kirim email konfirmasi pencairan dana non-blocking
    if (session.user.email) {
      sendEmail(
        session.user.email,
        `Bukti Penarikan Saldo — Ref #${withdrawal.refNumber}`,
        withdrawalConfirmationEmailTemplate({
          storeName: store.name,
          companyName: store.companyName,
          amount: numericAmount,
          bankName: primaryBank.bankName,
          accountNumber: primaryBank.accountNumber,
          accountName: primaryBank.accountName,
          refNumber: withdrawal.refNumber,
          date: new Date().toLocaleString('id-ID'),
        })
      ).catch((err) => console.error('[WITHDRAWAL_CONFIRM_EMAIL_ERROR]:', err))
    }

    return NextResponse.json({
      success: true,
      data: withdrawal,
      message: `Pencairan dana sebesar Rp ${numericAmount.toLocaleString('id-ID')} berhasil diproses ke ${primaryBank.bankName} ${primaryBank.accountNumber}.`,
    })
  } catch (error) {
    console.error('Error processing withdrawal:', error)
    return NextResponse.json(
      { error: 'Internal server error while processing withdrawal' },
      { status: 500 }
    )
  }
}
