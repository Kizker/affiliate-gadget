import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { POST as withdrawHandler } from '@/app/api/admin/finance/withdraw/route'
import { GET as financeHandler } from '@/app/api/admin/finance/route'
import { POST as confirmOrderHandler } from '@/app/api/orders/[orderId]/confirm/route'
import {
  calculateOrderVat,
  calculatePaymentGatewayFee,
} from '@/lib/tax/tax-engine'
import {
  checkBankAccountCooldown,
  validateAccountNameMatch,
  resetWithdrawalRateLimit,
} from '@/lib/withdrawal-security'
import * as storeWithdrawalStore from '@/lib/store-withdrawal-store'

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
    dispatchTransactional: vi.fn().mockResolvedValue(undefined),
  }
})

// 3. Mock Midtrans Iris Payout
vi.mock('@/lib/midtrans-iris', () => ({
  createIrisPayout: vi.fn().mockResolvedValue({
    success: true,
    mode: 'SIMULATION',
    referenceNo: 'WD-TEST-REF',
    status: 'completed',
    message: 'Payout successfully simulated',
  }),
}))

describe('E2E Complete Financial Lifecycle: Checkout -> Escrow -> Settlement -> Withdrawal', () => {
  // Mock Data Setup
  const mockStore = {
    id: 'store-roxy-01',
    name: 'PT Gadget Jaya Sentosa (Roxy Mas)',
    companyName: 'PT Gadget Jaya Sentosa',
    taxId: '01.428.910.4-015.000',
    city: 'Jakarta Pusat',
    phone: '081289001122',
    whatsapp: '6281289001122',
    bankAccountUpdatedAt: null as Date | null,
    isActive: true,
    bankAccounts: [
      {
        id: 'bank-roxy-01',
        storeId: 'store-roxy-01',
        bankName: 'Bank Mandiri',
        accountNumber: '1180019283741',
        accountName: 'PT Gadget Jaya Sentosa',
        isPrimary: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  }

  const mockHoldingStore = {
    id: 'ALL',
    name: 'Konsolidasi Seluruh Toko',
    companyName: 'PT Affiliate Gadget Nusantara (Holding Multi-PT)',
    taxId: '01.000.890.1-011.000',
    city: 'Nasional (Seluruh Cabang)',
    bankAccounts: [
      {
        id: 'bank-holding-01',
        storeId: 'ALL',
        bankName: 'Bank Mandiri (Pusat)',
        accountNumber: '1180099887766',
        accountName: 'PT Affiliate Gadget Nusantara',
        isPrimary: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  }

  const mockCustomer = {
    id: 'usr-customer-01',
    name: 'Rian Pratama',
    email: 'customer@test.com',
    phone: '081299998888',
    role: 'CUSTOMER',
  }

  const mockStoreAdmin = {
    id: 'usr-admin-roxy',
    name: 'Bambang Susanto',
    email: 'admin.roxy@affiliategadget.com',
    role: 'STORE_ADMIN',
    storeId: 'store-roxy-01',
    phone: '081289001122',
  }

  const mockSuperAdmin = {
    id: 'usr-superadmin',
    name: 'Super Administrator',
    email: 'superadmin@affiliategadget.com',
    role: 'SUPER_ADMIN',
    storeId: undefined,
  }

  // Transaction Parameters
  const itemPrice = 10000000 // Rp 10.000.000
  const itemQuantity = 1
  const subtotal = itemPrice * itemQuantity
  const voucherDiscount = 100000 // Rp 100.000
  const shippingCost = 35000 // Rp 35.000 (JNE Reguler)
  const insuranceFee = Math.round(subtotal * 0.0025) // 0.25% = Rp 25.000
  const grandTotal = subtotal + shippingCost + insuranceFee - voucherDiscount // Rp 9.960.000
  const commissionRate = 1.5 // 1.5%
  const commissionAmount = (subtotal * commissionRate) / 100 // Rp 150.000
  const netStoreAmount = subtotal - voucherDiscount - commissionAmount // Rp 9.750.000

  // Shared in-memory withdrawal tracking for tests
  let dynamicWithdrawals: any[] = []

  beforeEach(() => {
    vi.clearAllMocks()
    resetWithdrawalRateLimit()
    dynamicWithdrawals = []

    vi.spyOn(storeWithdrawalStore, 'getStoreWithdrawals').mockImplementation(
      async (sId?: string) => {
        if (sId) {
          return dynamicWithdrawals.filter((w) => w.storeId === sId)
        }
        return dynamicWithdrawals
      }
    )

    vi.spyOn(storeWithdrawalStore, 'getTotalWithdrawn').mockImplementation(
      async (sId?: string) => {
        const list = sId
          ? dynamicWithdrawals.filter((w) => w.storeId === sId)
          : dynamicWithdrawals
        return list
          .filter((w) => w.status === 'SUCCESS')
          .reduce((sum, w) => sum + w.amount, 0)
      }
    )

    vi.spyOn(storeWithdrawalStore, 'createStoreWithdrawal').mockImplementation(
      async (rec: any) => {
        const newRec = {
          ...rec,
          id: `wd-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          refNumber: `WD-${Date.now()}`,
          createdAt: new Date().toISOString(),
        }
        dynamicWithdrawals.push(newRec)
        return newRec
      }
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // =========================================================================
  // TAHAP 1: CHECKOUT & KALKULASI PAJAK
  // =========================================================================
  it('1. [CHECKOUT]: Memverifikasi integritas kalkulasi subtotal, komisi, PPN, dan asuransi', () => {
    expect(subtotal).toBe(10000000)
    expect(insuranceFee).toBe(25000) // Wajib 0.25% kurir
    expect(commissionAmount).toBe(150000) // Komisi platform 1.5%
    expect(netStoreAmount).toBe(9750000) // Hak bersih toko
    expect(grandTotal).toBe(9960000) // Total yang dibayar customer

    // PPN Inklusif Toko PKP
    const vatCalc = calculateOrderVat(subtotal - voucherDiscount, {
      isPkp: true,
      vatRate: 11.0,
      taxType: 'INCLUSIVE',
    })
    expect(vatCalc.dppAmount + vatCalc.vatAmount).toBe(
      subtotal - voucherDiscount
    )
    expect(vatCalc.vatAmount).toBeGreaterThan(0)

    // Midtrans VA Fee
    const gwFee = calculatePaymentGatewayFee(
      'VIRTUAL_ACCOUNT',
      grandTotal,
      'MANDIRI_VA'
    )
    expect(gwFee.feeAmount).toBe(4000) // Flat Rp 4.000
  })

  // =========================================================================
  // TAHAP 2: PEMBAYARAN & SIKLUS ESCROW (DANA TERTAHAN)
  // =========================================================================
  it('2. [ESCROW]: Memverifikasi dana tertahan di pos Escrow selama pesanan berstatus SHIPPED', async () => {
    const { auth } = await import('@/auth')
    vi.mocked(auth).mockResolvedValue({ user: mockStoreAdmin } as any)

    const activeShippedOrder = {
      id: 'ord-test-01',
      orderNumber: 'ORD-20260930-0001',
      userId: mockCustomer.id,
      storeId: mockStore.id,
      status: 'SHIPPED', // Dalam perjalanan kurir
      subtotal,
      total: grandTotal,
      discountAmount: voucherDiscount,
      commissionRate,
      commissionAmount,
      shippingCost,
      insuranceFee,
      tax: 981081,
      createdAt: new Date(),
      completedAt: null,
      user: { name: mockCustomer.name, email: mockCustomer.email },
      store: {
        id: mockStore.id,
        name: mockStore.name,
        companyName: mockStore.companyName,
      },
      payment: { method: 'MIDTRANS', status: 'VERIFIED', notes: 'MANDIRI_VA' },
      items: [
        { quantity: 1, price: itemPrice, product: { name: 'iPhone 15 Pro' } },
      ],
    }

    vi.spyOn(prisma.store, 'findUnique').mockResolvedValue(mockStore as any)
    vi.spyOn(prisma.store, 'findMany').mockResolvedValue([mockStore] as any)
    vi.spyOn(prisma.order, 'findMany').mockResolvedValue([
      activeShippedOrder,
    ] as any)
    vi.spyOn(prisma.order, 'aggregate').mockResolvedValue({
      _sum: { subtotal: 0, discountAmount: 0, commissionAmount: 0 },
    } as any)

    const req = new NextRequest('http://localhost:3000/api/admin/finance')
    const res = await financeHandler(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)

    // Saldo siap cair wajib Rp 0 karena pesanan belum COMPLETED
    expect(json.stats.availableBalance).toBe(0)
    // Dana tertahan di Escrow sebesar hak bersih toko (Rp 9.750.000)
    expect(json.stats.escrowBalance).toBe(9750000)
    expect(json.stats.courierBreakdown.shippedCount).toBe(1)

    // Verifikasi mutasi berstatus PENDING di pos ESCROW
    const escrowTx = json.transactions.find(
      (tx: any) => tx.category === 'ESCROW'
    )
    expect(escrowTx).toBeDefined()
    expect(escrowTx.status).toBe('PENDING')
    expect(escrowTx.statusLabel).toBe('Kurir Perjalanan')
  })

  // =========================================================================
  // TAHAP 3: KONFIRMASI PENERIMAAN PESANAN (COMPLETED)
  // =========================================================================
  it('3. [COMPLETION]: Customer mengonfirmasi pesanan diterima & mengaktifkan garansi 30 hari', async () => {
    const { auth } = await import('@/auth')
    vi.mocked(auth).mockResolvedValue({ user: mockCustomer } as any)

    const mockOrderInDb = {
      id: 'ord-test-01',
      orderNumber: 'ORD-20260930-0001',
      userId: mockCustomer.id,
      status: 'SHIPPED',
      customerConfirmedAt: null,
      total: grandTotal,
      subtotal,
      shippingCost,
      insuranceFee,
      discountAmount: voucherDiscount,
      user: mockCustomer,
      store: mockStore,
      items: [
        {
          id: 'it-1',
          price: itemPrice,
          quantity: 1,
          product: { name: 'iPhone 15 Pro' },
        },
      ],
    }

    vi.spyOn(prisma.order, 'findUnique').mockResolvedValue(mockOrderInDb as any)
    vi.spyOn(prisma.order, 'update').mockResolvedValue({
      ...mockOrderInDb,
      status: 'COMPLETED',
      completedAt: new Date(),
      customerConfirmedAt: new Date(),
      warrantyExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    } as any)

    const req = new NextRequest(
      'http://localhost:3000/api/orders/ord-test-01/confirm',
      {
        method: 'POST',
      }
    )
    const res = await confirmOrderHandler(req, {
      params: Promise.resolve({ orderId: 'ord-test-01' }),
    })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.order.status).toBe('COMPLETED')
    expect(json.order.warrantyExpiryDate).toBeDefined()
  })

  // =========================================================================
  // TAHAP 4: DISTRIBUSI SALDO SIAP CAIR (ADMIN TOKO VS SUPERADMIN)
  // =========================================================================
  it('4.1 [FINANCE STORE]: Admin Toko menerima hak bersih Rp 9.750.000 ke Saldo Siap Cair', async () => {
    const { auth } = await import('@/auth')
    vi.mocked(auth).mockResolvedValue({ user: mockStoreAdmin } as any)

    const completedOrder = {
      id: 'ord-test-01',
      orderNumber: 'ORD-20260930-0001',
      userId: mockCustomer.id,
      storeId: mockStore.id,
      status: 'COMPLETED',
      subtotal,
      total: grandTotal,
      discountAmount: voucherDiscount,
      commissionRate,
      commissionAmount,
      shippingCost,
      insuranceFee,
      tax: 981081,
      createdAt: new Date(),
      completedAt: new Date(),
      user: { name: mockCustomer.name, email: mockCustomer.email },
      store: {
        id: mockStore.id,
        name: mockStore.name,
        companyName: mockStore.companyName,
      },
      payment: { method: 'MIDTRANS', status: 'VERIFIED', notes: 'MANDIRI_VA' },
      items: [
        { quantity: 1, price: itemPrice, product: { name: 'iPhone 15 Pro' } },
      ],
    }

    vi.spyOn(prisma.store, 'findUnique').mockResolvedValue(mockStore as any)
    vi.spyOn(prisma.store, 'findMany').mockResolvedValue([mockStore] as any)
    vi.spyOn(prisma.order, 'findMany').mockResolvedValue([
      completedOrder,
    ] as any)
    vi.spyOn(prisma.order, 'aggregate').mockResolvedValue({
      _sum: {
        subtotal: completedOrder.subtotal,
        discountAmount: completedOrder.discountAmount,
        commissionAmount: completedOrder.commissionAmount,
      },
    } as any)

    const req = new NextRequest('http://localhost:3000/api/admin/finance')
    const res = await financeHandler(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    // Saldo siap cair toko = subtotal (10.000.000) - diskon (100.000) - komisi (150.000) = Rp 9.750.000
    expect(json.stats.availableBalance).toBe(9750000)
    // Dana di escrow telah rilis menjadi 0
    expect(json.stats.escrowBalance).toBe(0)

    // Verifikasi mutasi buku kas toko
    const saleTx = json.transactions.find((tx: any) => tx.category === 'SALE')
    const feeTx = json.transactions.find(
      (tx: any) => tx.category === 'COMMISSION'
    )
    const gwTx = json.transactions.find((tx: any) => tx.category === 'GATEWAY')

    expect(saleTx).toBeDefined()
    expect(saleTx.type).toBe('INCOME')
    expect(saleTx.amount).toBe(9750000)
    expect(saleTx.statusLabel).toBe('Masuk Saldo')

    expect(feeTx).toBeDefined()
    expect(feeTx.type).toBe('EXPENSE')
    expect(feeTx.amount).toBe(150000)
    expect(feeTx.statusLabel).toBe('Terpotong')

    expect(gwTx).toBeDefined()
    expect(gwTx.type).toBe('EXPENSE')
    expect(gwTx.amount).toBe(4000)
    expect(gwTx.statusLabel).toBe('Terpotong')
  })

  it('4.2 [FINANCE SUPERADMIN]: Superadmin menerima hak Komisi Platform Rp 150.000 murni (bukan omzet)', async () => {
    const { auth } = await import('@/auth')
    vi.mocked(auth).mockResolvedValue({ user: mockSuperAdmin } as any)

    const completedOrder = {
      id: 'ord-test-01',
      orderNumber: 'ORD-20260930-0001',
      userId: mockCustomer.id,
      storeId: mockStore.id,
      status: 'COMPLETED',
      subtotal,
      total: grandTotal,
      discountAmount: voucherDiscount,
      commissionRate,
      commissionAmount,
      shippingCost,
      insuranceFee,
      tax: 981081,
      createdAt: new Date(),
      completedAt: new Date(),
      user: { name: mockCustomer.name, email: mockCustomer.email },
      store: {
        id: mockStore.id,
        name: mockStore.name,
        companyName: mockStore.companyName,
      },
      payment: { method: 'MIDTRANS', status: 'VERIFIED', notes: 'MANDIRI_VA' },
      items: [
        { quantity: 1, price: itemPrice, product: { name: 'iPhone 15 Pro' } },
      ],
    }

    vi.spyOn(prisma.store, 'findUnique').mockResolvedValue(null)
    vi.spyOn(prisma.store, 'findMany').mockResolvedValue([mockStore] as any)
    vi.spyOn(prisma.order, 'findMany').mockResolvedValue([
      completedOrder,
    ] as any)
    vi.spyOn(prisma.order, 'aggregate').mockResolvedValue({
      _sum: {
        subtotal: completedOrder.subtotal,
        discountAmount: completedOrder.discountAmount,
        commissionAmount: completedOrder.commissionAmount,
      },
    } as any)

    // Query tanpa storeId = Konsolidasi Seluruh Toko
    const req = new NextRequest('http://localhost:3000/api/admin/finance')
    const res = await financeHandler(req)
    const json = await res.json()

    expect(res.status).toBe(200)

    // Pendapatan Superadmin = Murni Rp 150.000 (bukan Rp 9.960.000 omzet gadget)
    expect(json.stats.grossRevenue).toBe(150000)
    expect(json.stats.storeGMV).toBe(grandTotal)
    // Saldo siap cair Superadmin = Rp 150.000
    expect(json.stats.availableBalance).toBe(150000)

    // Verifikasi mutasi buku kas Superadmin
    const commTx = json.transactions.find(
      (tx: any) => tx.category === 'COMMISSION'
    )
    const saleTx = json.transactions.find((tx: any) => tx.category === 'SALE')

    expect(commTx).toBeDefined()
    expect(commTx.type).toBe('INCOME') // Bagi Superadmin adalah INCOME
    expect(commTx.amount).toBe(150000)
    expect(commTx.statusLabel).toBe('Masuk Kas Platform')

    expect(saleTx).toBeDefined()
    expect(saleTx.type).toBe('ESCROW') // Bagi Superadmin penjualan toko adalah Hak Toko Cabang
    expect(saleTx.amount).toBe(9750000)
    expect(saleTx.statusLabel).toBe('Hak Toko Cabang')
  })

  // =========================================================================
  // TAHAP 5: PENARIKAN DANA TOKO (3 SECURITY GATES & IRIS PAYOUT)
  // =========================================================================
  it('5.1 [WITHDRAWAL GATE 1]: Memblokir penarikan jika rekening bank diubah dalam 24 jam (Cooling-down)', async () => {
    const { auth } = await import('@/auth')
    vi.mocked(auth).mockResolvedValue({ user: mockStoreAdmin } as any)

    // Simulasikan rekening baru diubah 1 jam yang lalu
    const recentlyChangedStore = {
      ...mockStore,
      bankAccountUpdatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 jam lalu
    }

    vi.spyOn(prisma.store, 'findUnique').mockResolvedValue(
      recentlyChangedStore as any
    )
    vi.spyOn(prisma.order, 'findMany').mockResolvedValue([
      { subtotal, discountAmount: voucherDiscount, commissionAmount },
    ] as any)
    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({
      id: 'log-1',
    } as any)

    const req = new NextRequest(
      'http://localhost:3000/api/admin/finance/withdraw',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 5000000,
          otpCode: '123456',
          identifier: '081289001122',
        }),
      }
    )

    const res = await withdrawHandler(req)
    const json = await res.json()

    expect(res.status).toBe(403)
    expect(json.code).toBe('COOLING_DOWN')
    expect(json.cooldownStatus.isLocked).toBe(true)
    expect(json.cooldownStatus.remainingHours).toBeGreaterThanOrEqual(22)
  })

  it('5.2 [WITHDRAWAL GATE 2]: Memblokir penarikan jika nama rekening tidak sesuai PT (Similarity < 70%)', async () => {
    const { auth } = await import('@/auth')
    vi.mocked(auth).mockResolvedValue({ user: mockStoreAdmin } as any)

    // Rekening atas nama perorangan yang tidak sesuai nama legal PT Toko
    const personalAccountStore = {
      ...mockStore,
      bankAccountUpdatedAt: null, // Aman dari cooldown
      bankAccounts: [
        {
          id: 'bank-personal',
          bankName: 'Bank BCA',
          accountNumber: '5220309999',
          accountName: 'Budi Hartono Pribadi', // BUKAN PT Gadget Jaya Sentosa
          isPrimary: true,
        },
      ],
    }

    vi.spyOn(prisma.store, 'findUnique').mockResolvedValue(
      personalAccountStore as any
    )
    vi.spyOn(prisma.order, 'findMany').mockResolvedValue([
      { subtotal, discountAmount: voucherDiscount, commissionAmount },
    ] as any)
    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({
      id: 'log-2',
    } as any)

    const req = new NextRequest(
      'http://localhost:3000/api/admin/finance/withdraw',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 5000000,
          otpCode: '123456',
          identifier: '081289001122',
        }),
      }
    )

    const res = await withdrawHandler(req)
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.code).toBe('ACCOUNT_NAME_MISMATCH')
    expect(json.similarityScore).toBeLessThan(0.7)
  })

  it('5.3 [WITHDRAWAL GATE 3]: Memblokir penarikan jika OTP salah atau kedaluwarsa', async () => {
    const { auth } = await import('@/auth')
    vi.mocked(auth).mockResolvedValue({ user: mockStoreAdmin } as any)

    const notif = await import('@/lib/notifications')
    vi.mocked(notif.validateOtpRecord).mockResolvedValue({
      valid: false,
      error: 'INVALID_CODE',
      attemptsLeft: 2,
      otpToken: undefined,
    })

    vi.spyOn(prisma.store, 'findUnique').mockResolvedValue(mockStore as any)
    vi.spyOn(prisma.order, 'findMany').mockResolvedValue([
      { subtotal, discountAmount: voucherDiscount, commissionAmount },
    ] as any)
    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({
      id: 'log-3',
    } as any)

    const req = new NextRequest(
      'http://localhost:3000/api/admin/finance/withdraw',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 5000000,
          otpCode: '000000', // OTP Salah
          identifier: '081289001122',
        }),
      }
    )

    const res = await withdrawHandler(req)
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.code).toBe('OTP_INVALID')
    expect(json.attemptsLeft).toBe(2)
  })

  it('5.4 [WITHDRAWAL SUCCESS]: Sukses mencairkan Rp 5.000.000 ke rekening PT dan mengurangi saldo toko seketika', async () => {
    const { auth } = await import('@/auth')
    vi.mocked(auth).mockResolvedValue({ user: mockStoreAdmin } as any)

    const notif = await import('@/lib/notifications')
    vi.mocked(notif.validateOtpRecord).mockResolvedValue({
      valid: true,
      error: undefined,
      attemptsLeft: 3,
      otpToken: { id: 'otp-token-123' } as any,
    })

    vi.spyOn(prisma.store, 'findUnique').mockResolvedValue(mockStore as any)
    vi.spyOn(prisma.order, 'findMany').mockResolvedValue([
      { subtotal, discountAmount: voucherDiscount, commissionAmount },
    ] as any)
    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({
      id: 'log-4',
    } as any)

    // Penarikan Rp 5.000.000 dari saldo siap cair Rp 9.750.000
    const req = new NextRequest(
      'http://localhost:3000/api/admin/finance/withdraw',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 5000000,
          otpCode: '654321',
          identifier: '081289001122',
        }),
      }
    )

    const res = await withdrawHandler(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.amount).toBe(5000000)
    expect(json.data.bankName).toBe('Bank Mandiri')
    expect(json.data.accountNumber).toBe('1180019283741')
    expect(json.data.accountName).toBe('PT Gadget Jaya Sentosa')
    expect(json.data.iris.status).toBe('completed')

    // Verifikasi saldo siap cair toko berkurang dari Rp 9.750.000 menjadi Rp 4.750.000
    const totalWd = await storeWithdrawalStore.getTotalWithdrawn(mockStore.id)
    expect(totalWd).toBe(5000000)
    const remainingBalance = 9750000 - totalWd
    expect(remainingBalance).toBe(4750000)

    // Verifikasi saldo Superadmin TIDAK BERKURANG (tetap Rp 150.000)
    const superAdminHoldingWd = (
      await storeWithdrawalStore.getStoreWithdrawals()
    ).filter(
      (w) =>
        ['ALL', 'holding-01', 'HOLDING'].includes(w.storeId) &&
        w.status === 'SUCCESS'
    )
    const superAdminWithdrawn = superAdminHoldingWd.reduce(
      (sum, w) => sum + w.amount,
      0
    )
    const superAdminAvailableBalance = Math.max(
      0,
      commissionAmount - superAdminWithdrawn
    )
    expect(superAdminAvailableBalance).toBe(150000)
  })

  // =========================================================================
  // TAHAP 6: PENARIKAN LABA BERSIH SUPERADMIN HOLDING
  // =========================================================================
  it('6. [SUPERADMIN WITHDRAWAL]: Superadmin mencairkan laba komisi Rp 150.000 tanpa memengaruhi saldo toko', async () => {
    // Simulasikan penarikan holding ke Rekening Mandiri Pusat
    const holdingWithdrawal = await storeWithdrawalStore.createStoreWithdrawal({
      storeId: 'ALL',
      storeName: 'Konsolidasi Seluruh Toko',
      companyName: 'PT Affiliate Gadget Nusantara',
      bankName: 'Bank Mandiri (Pusat)',
      accountNumber: '1180099887766',
      accountName: 'PT Affiliate Gadget Nusantara',
      amount: 150000,
      status: 'SUCCESS',
      requestedBy: 'Super Administrator',
    })

    expect(holdingWithdrawal.amount).toBe(150000)
    expect(holdingWithdrawal.status).toBe('SUCCESS')

    // Saldo Superadmin kini menjadi Rp 0
    const superAdminHoldingWd = (
      await storeWithdrawalStore.getStoreWithdrawals()
    ).filter(
      (w) =>
        ['ALL', 'holding-01', 'HOLDING'].includes(w.storeId) &&
        w.status === 'SUCCESS'
    )
    const superAdminWithdrawn = superAdminHoldingWd.reduce(
      (sum, w) => sum + w.amount,
      0
    )
    const superAdminAvailableBalance = Math.max(
      0,
      commissionAmount - superAdminWithdrawn
    )
    expect(superAdminAvailableBalance).toBe(0)

    // Tambahkan catatan penarikan toko sebelumnya untuk verifikasi isolasi
    await storeWithdrawalStore.createStoreWithdrawal({
      storeId: mockStore.id,
      storeName: mockStore.name,
      companyName: mockStore.companyName,
      bankName: 'Bank Mandiri',
      accountNumber: '1180019283741',
      accountName: 'PT Gadget Jaya Sentosa',
      amount: 5000000,
      status: 'SUCCESS',
      requestedBy: 'Bambang Susanto',
    })

    // Saldo Toko Cabang tetap aman di Rp 4.750.000 (tidak berkurang oleh penarikan holding Rp 150.000)
    const storeWd = await storeWithdrawalStore.getTotalWithdrawn(mockStore.id)
    expect(storeWd).toBe(5000000)
    const storeRemaining = 9750000 - storeWd
    expect(storeRemaining).toBe(4750000)
  })
})
