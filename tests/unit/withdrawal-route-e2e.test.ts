import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as withdrawHandler } from '@/app/api/admin/finance/withdraw/route'
import prisma from '@/lib/db'
import { resetWithdrawalRateLimit } from '@/lib/withdrawal-security'

// 1. Mock NextAuth
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

// 2. Mock Notifications
vi.mock('@/lib/notifications', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/notifications')>()
  return {
    ...actual,
    validateOtpRecord: vi.fn(),
    consumeOtpRecord: vi.fn().mockResolvedValue(undefined),
    sendEmail: vi.fn().mockResolvedValue({ success: true }),
  }
})

// 3. Mock Store Withdrawal Store (Isolasi totalWithdrawn & createStoreWithdrawal)
vi.mock('@/lib/store-withdrawal-store', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/lib/store-withdrawal-store')>()
  return {
    ...actual,
    getTotalWithdrawn: vi.fn().mockReturnValue(0),
    createStoreWithdrawal: vi.fn().mockImplementation((rec) => ({
      ...rec,
      id: 'wd-mock-test-1',
      refNumber: 'WD-20260925-9999',
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    })),
  }
})

describe('Withdrawal Route Handler E2E Integration (3 Security Gates)', () => {
  const mockStoreAdminSession = {
    user: {
      id: 'usr-admin-roxy',
      email: 'admin.roxy@affiliategadget.com',
      name: 'Bambang Susanto',
      role: 'STORE_ADMIN',
      storeId: 'store-roxy-mas',
    },
  }

  const mockStore = {
    id: 'store-roxy-mas',
    name: 'Affiliate Gadget Roxy Mas',
    companyName: 'PT Gadget Jaya Sentosa',
    bankAccountUpdatedAt: null as Date | null,
    isActive: true,
    bankAccounts: [
      {
        id: 'bank-1',
        storeId: 'store-roxy-mas',
        bankName: 'Bank Mandiri',
        accountNumber: '1180019283741',
        accountName: 'PT Gadget Jaya Sentosa',
        isPrimary: true,
      },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    resetWithdrawalRateLimit()
    vi.unstubAllEnvs()

    // Default mock store & orders
    vi.spyOn(prisma.store, 'findUnique').mockResolvedValue(mockStore as any)
    vi.spyOn(prisma.store, 'findFirst').mockResolvedValue(mockStore as any)
    vi.spyOn(prisma.order, 'findMany').mockResolvedValue([
      {
        subtotal: 50000000,
        discountAmount: 0,
        commissionAmount: 1000000,
      },
    ] as any)
    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({
      id: 'audit-1',
    } as any)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('1. harus menolak jika user belum login / role tidak memiliki otorisasi (401)', async () => {
    const { auth } = await import('@/auth')
    vi.mocked(auth).mockResolvedValue(null as any)

    const req = new NextRequest(
      'http://localhost:3000/api/admin/finance/withdraw',
      {
        method: 'POST',
        body: JSON.stringify({ amount: 5000000 }),
      }
    )

    const res = await withdrawHandler(req)
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json.error).toBe('Unauthorized')
  })

  it('2. harus menolak jika nominal di bawah batas minimum Rp 100.000 (400)', async () => {
    const { auth } = await import('@/auth')
    vi.mocked(auth).mockResolvedValue(mockStoreAdminSession as any)

    const req = new NextRequest(
      'http://localhost:3000/api/admin/finance/withdraw',
      {
        method: 'POST',
        body: JSON.stringify({ amount: 50000 }),
      }
    )

    const res = await withdrawHandler(req)
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toContain('minimal Rp 100.000')
  })

  it('3. GATE 1: harus memblokir 403 jika toko dalam masa Cooling-down 24 jam', async () => {
    const { auth } = await import('@/auth')
    vi.mocked(auth).mockResolvedValue(mockStoreAdminSession as any)

    // Simulasi rekening baru diubah 3 jam lalu
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000)
    vi.spyOn(prisma.store, 'findUnique').mockResolvedValue({
      ...mockStore,
      bankAccountUpdatedAt: threeHoursAgo,
    } as any)

    const req = new NextRequest(
      'http://localhost:3000/api/admin/finance/withdraw',
      {
        method: 'POST',
        body: JSON.stringify({ amount: 5000000, otpCode: '123456' }),
      }
    )

    const res = await withdrawHandler(req)
    const json = await res.json()

    expect(res.status).toBe(403)
    expect(json.code).toBe('COOLING_DOWN')
    expect(json.cooldownStatus.isLocked).toBe(true)
    expect(json.cooldownStatus.remainingHours).toBe(20)
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'WITHDRAWAL_BLOCKED_COOLDOWN',
        }),
      })
    )
  })

  it('4. GATE 2: harus memblokir 400 jika nama pemilik rekening tidak sesuai badan hukum PT', async () => {
    const { auth } = await import('@/auth')
    vi.mocked(auth).mockResolvedValue(mockStoreAdminSession as any)

    // Rekening atas nama pribadi orang lain
    vi.spyOn(prisma.store, 'findUnique').mockResolvedValue({
      ...mockStore,
      bankAccountUpdatedAt: null,
      bankAccounts: [
        {
          id: 'bank-foreign',
          storeId: 'store-roxy-mas',
          bankName: 'BCA',
          accountNumber: '9988776655',
          accountName: 'Doni Salmanan Pribadi',
          isPrimary: true,
        },
      ],
    } as any)

    const req = new NextRequest(
      'http://localhost:3000/api/admin/finance/withdraw',
      {
        method: 'POST',
        body: JSON.stringify({ amount: 5000000, otpCode: '123456' }),
      }
    )

    const res = await withdrawHandler(req)
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.code).toBe('ACCOUNT_NAME_MISMATCH')
    expect(json.error).toContain('tidak sesuai')
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'WITHDRAWAL_BLOCKED_NAME_MISMATCH',
        }),
      })
    )
  })

  it('5. GATE 3: harus meminta kode OTP jika otpCode tidak disertakan (400)', async () => {
    const { auth } = await import('@/auth')
    vi.mocked(auth).mockResolvedValue(mockStoreAdminSession as any)

    const req = new NextRequest(
      'http://localhost:3000/api/admin/finance/withdraw',
      {
        method: 'POST',
        body: JSON.stringify({ amount: 5000000 }),
      }
    )

    const res = await withdrawHandler(req)
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.code).toBe('OTP_REQUIRED')
  })

  it('6. GATE 3: harus menolak jika kode OTP salah (400) dan mencatat sisa percobaan', async () => {
    const { auth } = await import('@/auth')
    const { validateOtpRecord } = await import('@/lib/notifications')
    vi.mocked(auth).mockResolvedValue(mockStoreAdminSession as any)
    vi.mocked(validateOtpRecord).mockResolvedValue({
      valid: false,
      error: 'INVALID_CODE',
      attemptsLeft: 2,
    })

    const req = new NextRequest(
      'http://localhost:3000/api/admin/finance/withdraw',
      {
        method: 'POST',
        body: JSON.stringify({ amount: 5000000, otpCode: '999999' }),
      }
    )

    const res = await withdrawHandler(req)
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.code).toBe('OTP_INVALID')
    expect(json.attemptsLeft).toBe(2)
  })

  it('7. GATE 3: harus memblokir 429 dan mengirim security alert jika OTP salah 3x', async () => {
    const { auth } = await import('@/auth')
    const { validateOtpRecord, sendEmail } = await import('@/lib/notifications')
    vi.mocked(auth).mockResolvedValue(mockStoreAdminSession as any)
    vi.mocked(validateOtpRecord).mockResolvedValue({
      valid: false,
      error: 'MAX_ATTEMPTS_EXCEEDED',
      attemptsLeft: 0,
    })

    const req = new NextRequest(
      'http://localhost:3000/api/admin/finance/withdraw',
      {
        method: 'POST',
        body: JSON.stringify({ amount: 5000000, otpCode: '000000' }),
      }
    )

    const res = await withdrawHandler(req)
    const json = await res.json()

    expect(res.status).toBe(429)
    expect(json.code).toBe('OTP_BLOCKED')
    expect(sendEmail).toHaveBeenCalledWith(
      'admin.roxy@affiliategadget.com',
      expect.stringContaining('Peringatan Keamanan'),
      expect.stringContaining('3 kali berturut-turut')
    )
  })

  it('8. SUKSES: harus berhasil mencairkan saat semua 3 gerbang lolos (200)', async () => {
    const { auth } = await import('@/auth')
    const { validateOtpRecord, consumeOtpRecord, sendEmail } =
      await import('@/lib/notifications')
    vi.mocked(auth).mockResolvedValue(mockStoreAdminSession as any)
    vi.mocked(validateOtpRecord).mockResolvedValue({
      valid: true,
      otpToken: { id: 'otp-token-ok' } as any,
    })

    const req = new NextRequest(
      'http://localhost:3000/api/admin/finance/withdraw',
      {
        method: 'POST',
        body: JSON.stringify({ amount: 10000000, otpCode: '654321' }),
      }
    )

    const res = await withdrawHandler(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.amount).toBe(10000000)
    expect(json.data.refNumber).toMatch(/^WD-/)
    expect(consumeOtpRecord).toHaveBeenCalledWith('otp-token-ok')
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'WITHDRAWAL_SUCCESS',
          details: expect.objectContaining({
            amount: 10000000,
          }),
        }),
      })
    )
    expect(sendEmail).toHaveBeenCalledWith(
      'admin.roxy@affiliategadget.com',
      expect.stringContaining('Bukti Penarikan Saldo'),
      expect.stringContaining('10.000.000')
    )
  })

  it('9. RATE LIMITING: harus memblokir 429 jika melebihi 5 kali penarikan per jam', async () => {
    const { auth } = await import('@/auth')
    const { validateOtpRecord } = await import('@/lib/notifications')
    vi.mocked(auth).mockResolvedValue(mockStoreAdminSession as any)
    vi.mocked(validateOtpRecord).mockResolvedValue({
      valid: true,
      otpToken: { id: 'otp-ok' } as any,
    })

    // 5 request pertama diizinkan
    for (let i = 0; i < 5; i++) {
      const req = new NextRequest(
        'http://localhost:3000/api/admin/finance/withdraw',
        {
          method: 'POST',
          body: JSON.stringify({ amount: 1000000, otpCode: '123456' }),
        }
      )
      const res = await withdrawHandler(req)
      expect(res.status).toBe(200)
    }

    // Request ke-6 ditolak rate limit
    const reqBlocked = new NextRequest(
      'http://localhost:3000/api/admin/finance/withdraw',
      {
        method: 'POST',
        body: JSON.stringify({ amount: 1000000, otpCode: '123456' }),
      }
    )
    const resBlocked = await withdrawHandler(reqBlocked)
    const jsonBlocked = await resBlocked.json()

    expect(resBlocked.status).toBe(429)
    expect(jsonBlocked.code).toBe('RATE_LIMIT_EXCEEDED')
    expect(jsonBlocked.retryAfterSeconds).toBeGreaterThan(0)
  })
})
