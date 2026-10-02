import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as requestOtpHandler } from '@/app/api/admin/finance/withdraw/request-otp/route'
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
    dispatchOtp: vi
      .fn()
      .mockResolvedValue({ success: true, message: 'OTP sent' }),
  }
})

// 3. Mock Store Withdrawal Store
vi.mock('@/lib/store-withdrawal-store', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/lib/store-withdrawal-store')>()
  return {
    ...actual,
    getTotalWithdrawn: vi.fn().mockResolvedValue(0),
  }
})

describe('Withdrawal Request-OTP Route Handler E2E Unit', () => {
  const mockStoreAdminSession = {
    user: {
      id: 'usr-admin-roxy',
      email: 'admin.roxy@affiliategadget.com',
      name: 'Bambang Susanto',
      role: 'STORE_ADMIN',
      storeId: 'store-roxy-mas',
      phone: '081299887766',
    },
  }

  const mockStore = {
    id: 'store-roxy-mas',
    name: 'Affiliate Gadget Roxy Mas',
    companyName: 'PT Gadget Jaya Sentosa',
    phone: '081299887766',
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

    vi.spyOn(prisma.store, 'findUnique').mockResolvedValue(mockStore as any)
    vi.spyOn(prisma.store, 'findFirst').mockResolvedValue(mockStore as any)
    vi.spyOn(prisma.order, 'findMany').mockResolvedValue([
      {
        subtotal: 50000000,
        discountAmount: 0,
        commissionAmount: 1000000,
      },
    ] as any)
    vi.spyOn(prisma.otpToken, 'count').mockResolvedValue(0)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('1. harus menolak jika user belum login / role tidak memiliki otorisasi (401)', async () => {
    const { auth } = await import('@/auth')
    vi.mocked(auth).mockResolvedValue(null as any)

    const req = new NextRequest(
      'http://localhost:3000/api/admin/finance/withdraw/request-otp',
      {
        method: 'POST',
        body: JSON.stringify({ amount: 5000000 }),
      }
    )

    const res = await requestOtpHandler(req)
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json.error).toBe('Unauthorized')
  })

  it('2. harus menolak jika nominal di bawah batas minimum Rp 100.000 (400)', async () => {
    const { auth } = await import('@/auth')
    vi.mocked(auth).mockResolvedValue(mockStoreAdminSession as any)

    const req = new NextRequest(
      'http://localhost:3000/api/admin/finance/withdraw/request-otp',
      {
        method: 'POST',
        body: JSON.stringify({ amount: 50000 }),
      }
    )

    const res = await requestOtpHandler(req)
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.code).toBe('INVALID_AMOUNT')
  })

  it('3. GERBANG 1: harus menolak jika rekening toko dalam masa cooling-down 24 jam (403)', async () => {
    const { auth } = await import('@/auth')
    vi.mocked(auth).mockResolvedValue(mockStoreAdminSession as any)

    // Set bankAccountUpdatedAt 2 jam yang lalu
    const lockedStore = {
      ...mockStore,
      bankAccountUpdatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    }
    vi.spyOn(prisma.store, 'findUnique').mockResolvedValue(lockedStore as any)

    const req = new NextRequest(
      'http://localhost:3000/api/admin/finance/withdraw/request-otp',
      {
        method: 'POST',
        body: JSON.stringify({ amount: 5000000 }),
      }
    )

    const res = await requestOtpHandler(req)
    const json = await res.json()

    expect(res.status).toBe(403)
    expect(json.code).toBe('COOLING_DOWN')
    expect(json.remainingHours).toBeGreaterThan(0)
  })

  it('4. GERBANG 2: harus menolak jika nama pemilik rekening tidak cocok dengan nama PT (403)', async () => {
    const { auth } = await import('@/auth')
    vi.mocked(auth).mockResolvedValue(mockStoreAdminSession as any)

    const mismatchStore = {
      ...mockStore,
      bankAccounts: [
        {
          id: 'bank-1',
          storeId: 'store-roxy-mas',
          bankName: 'Bank Mandiri',
          accountNumber: '1180019283741',
          accountName: 'Budi Santoso Pribadi', // Beda jauh dari PT Gadget Jaya Sentosa
          isPrimary: true,
        },
      ],
    }
    vi.spyOn(prisma.store, 'findUnique').mockResolvedValue(mismatchStore as any)

    const req = new NextRequest(
      'http://localhost:3000/api/admin/finance/withdraw/request-otp',
      {
        method: 'POST',
        body: JSON.stringify({ amount: 5000000 }),
      }
    )

    const res = await requestOtpHandler(req)
    const json = await res.json()

    expect(res.status).toBe(403)
    expect(json.code).toBe('ACCOUNT_NAME_MISMATCH')
  })

  it('5. harus menolak jika nominal penarikan melebihi saldo siap cair (400)', async () => {
    const { auth } = await import('@/auth')
    vi.mocked(auth).mockResolvedValue(mockStoreAdminSession as any)

    const req = new NextRequest(
      'http://localhost:3000/api/admin/finance/withdraw/request-otp',
      {
        method: 'POST',
        body: JSON.stringify({ amount: 100000000 }), // 100 jt > 48.996 jt
      }
    )

    const res = await requestOtpHandler(req)
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.code).toBe('INSUFFICIENT_BALANCE')
  })

  it('6. SUKSES: harus berhasil mengirimkan OTP saat semua validasi lolos (200)', async () => {
    const { auth } = await import('@/auth')
    vi.mocked(auth).mockResolvedValue(mockStoreAdminSession as any)

    const req = new NextRequest(
      'http://localhost:3000/api/admin/finance/withdraw/request-otp',
      {
        method: 'POST',
        body: JSON.stringify({
          amount: 5000000,
          identifier: '081299887766',
        }),
      }
    )

    const res = await requestOtpHandler(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.expiresIn).toBe(300)
    expect(json.cooldown).toBe(60)
  })
})
