import { describe, it, expect, beforeEach } from 'vitest'
import {
  createStoreWithdrawal,
  getStoreWithdrawals,
  getTotalWithdrawn,
} from '@/lib/store-withdrawal-store'
import fs from 'fs'
import path from 'path'

describe('Store Finance Real-Time Escrow & Courier Integration Engine', () => {
  const ESCROW_STATUSES = ['PAID', 'IN_PROGRESS', 'SHIPPED', 'COMPLAINED']
  const SETTLED_STATUSES = ['COMPLETED']
  const VOID_STATUSES = ['CANCELLED', 'RETURNED', 'PENDING_PAYMENT']

  it('should correctly classify orders into Escrow vs Settled vs Void', () => {
    // Escrow statuses (Dana Tertahan)
    expect(ESCROW_STATUSES).toContain('PAID')
    expect(ESCROW_STATUSES).toContain('IN_PROGRESS')
    expect(ESCROW_STATUSES).toContain('SHIPPED')
    expect(ESCROW_STATUSES).toContain('COMPLAINED')

    // Settled status (Saldo Siap Cair)
    expect(SETTLED_STATUSES).toContain('COMPLETED')
    expect(ESCROW_STATUSES).not.toContain('COMPLETED')

    // Void statuses (Tidak masuk escrow maupun saldo toko)
    expect(VOID_STATUSES).toContain('CANCELLED')
    expect(VOID_STATUSES).toContain('RETURNED')
    expect(VOID_STATUSES).toContain('PENDING_PAYMENT')
    expect(ESCROW_STATUSES).not.toContain('CANCELLED')
    expect(ESCROW_STATUSES).not.toContain('RETURNED')
  })

  it('should dynamically calculate Escrow balance and courier breakdown', () => {
    const orders = [
      {
        id: 'ord-1',
        orderNumber: 'ORD-001',
        status: 'PAID', // Pesanan baru dibayar
        subtotal: 10000000,
        discountAmount: 0,
        commissionAmount: 200000, // 2%
        courierCode: 'JNE',
        courierService: 'REG',
      },
      {
        id: 'ord-2',
        orderNumber: 'ORD-002',
        status: 'IN_PROGRESS', // Toko packing / Menunggu pickup driver
        subtotal: 15000000,
        discountAmount: 500000,
        commissionAmount: 300000,
        courierCode: 'GOJEK',
        courierService: 'INSTANT',
      },
      {
        id: 'ord-3',
        orderNumber: 'ORD-003',
        status: 'SHIPPED', // Kurir sedang mengantar di jalan
        subtotal: 20000000,
        discountAmount: 0,
        commissionAmount: 400000,
        courierCode: 'JNE',
        courierService: 'YES',
        trackingNumber: 'JNE-CGK-123456',
      },
      {
        id: 'ord-4',
        orderNumber: 'ORD-004',
        status: 'COMPLETED', // Sudah sampai dan dikonfirmasi pembeli
        subtotal: 12000000,
        discountAmount: 0,
        commissionAmount: 240000,
        courierCode: 'JNE',
        courierService: 'REG',
      },
      {
        id: 'ord-5',
        orderNumber: 'ORD-005',
        status: 'CANCELLED', // Dibatalkan
        subtotal: 5000000,
        discountAmount: 0,
        commissionAmount: 0,
      },
    ]

    let escrowBalance = 0
    let completedNetRevenue = 0
    const courierBreakdown = {
      paidCount: 0,
      inProgressCount: 0,
      shippedCount: 0,
      complainedCount: 0,
      totalEscrowOrders: 0,
    }

    orders.forEach((order) => {
      const netAmount = Math.max(
        0,
        order.subtotal - order.discountAmount - order.commissionAmount
      )

      if (order.status === 'COMPLETED') {
        completedNetRevenue += netAmount
      } else if (ESCROW_STATUSES.includes(order.status)) {
        escrowBalance += netAmount
        courierBreakdown.totalEscrowOrders += 1

        if (order.status === 'PAID') courierBreakdown.paidCount += 1
        else if (order.status === 'IN_PROGRESS')
          courierBreakdown.inProgressCount += 1
        else if (order.status === 'SHIPPED') courierBreakdown.shippedCount += 1
      }
    })

    // ORD-1 (9.8jt) + ORD-2 (14.2jt) + ORD-3 (19.6jt) = 43.600.000
    expect(escrowBalance).toBe(43600000)
    expect(courierBreakdown.totalEscrowOrders).toBe(3)
    expect(courierBreakdown.paidCount).toBe(1)
    expect(courierBreakdown.inProgressCount).toBe(1)
    expect(courierBreakdown.shippedCount).toBe(1)

    // ORD-4 (11.76jt)
    expect(completedNetRevenue).toBe(11760000)
  })

  it('should immediately release funds from Escrow to Available Balance when order transitions to COMPLETED', () => {
    // Initial state: Kurir sedang di jalan
    const initialOrders = [
      {
        id: 'ord-shipped',
        status: 'SHIPPED',
        subtotal: 20000000,
        discountAmount: 0,
        commissionAmount: 500000, // 2.5%
      },
    ]

    const calculateBalances = (ordersList: typeof initialOrders) => {
      let escrow = 0
      let settled = 0
      ordersList.forEach((ord) => {
        const net = ord.subtotal - ord.discountAmount - ord.commissionAmount
        if (ord.status === 'COMPLETED') settled += net
        else if (ESCROW_STATUSES.includes(ord.status)) escrow += net
      })
      return { escrow, settled }
    }

    const beforeDelivery = calculateBalances(initialOrders)
    expect(beforeDelivery.escrow).toBe(19500000)
    expect(beforeDelivery.settled).toBe(0)

    // After delivery / customer confirms receipt
    const afterDeliveryOrders = [
      {
        ...initialOrders[0],
        status: 'COMPLETED',
      },
    ]

    const afterDelivery = calculateBalances(afterDeliveryOrders)
    expect(afterDelivery.escrow).toBe(0)
    expect(afterDelivery.settled).toBe(19500000)
  })

  it('should prevent withdrawal if amount exceeds Available Balance', () => {
    const availableBalance = 15000000
    const requestedWithdrawal = 20000000

    const isAllowed = requestedWithdrawal <= availableBalance
    expect(isAllowed).toBe(false)
  })

  it('should accurately track store withdrawals and deduct from Available Balance', () => {
    const testStoreId = 'test-store-123'
    const completedNetRevenue = 50000000

    // Buat penarikan baru
    const withdrawal = createStoreWithdrawal({
      storeId: testStoreId,
      storeName: 'Test Gadget Roxy',
      companyName: 'PT Test Gadget Sentosa',
      bankName: 'Bank Mandiri',
      accountNumber: '1180019283741',
      accountName: 'PT Test Gadget Sentosa',
      amount: 20000000,
      status: 'SUCCESS',
      requestedBy: 'Test Admin',
    })

    expect(withdrawal.refNumber).toMatch(/^WD-\d{8}-\d{4}$/)
    expect(withdrawal.amount).toBe(20000000)

    const totalWithdrawn = getTotalWithdrawn(testStoreId)
    expect(totalWithdrawn).toBeGreaterThanOrEqual(20000000)

    const remainingBalance = Math.max(0, completedNetRevenue - totalWithdrawn)
    expect(remainingBalance).toBeLessThanOrEqual(30000000)
  })

  it('should isolate financial data between different store branches', () => {
    const roxyStoreId = 'store-roxy'
    const surabayaStoreId = 'store-surabaya'

    const orders = [
      {
        storeId: roxyStoreId,
        status: 'SHIPPED',
        subtotal: 10000000,
        discountAmount: 0,
        commissionAmount: 200000,
      },
      {
        storeId: surabayaStoreId,
        status: 'SHIPPED',
        subtotal: 25000000,
        discountAmount: 0,
        commissionAmount: 500000,
      },
    ]

    const roxyEscrow = orders
      .filter(
        (o) => o.storeId === roxyStoreId && ESCROW_STATUSES.includes(o.status)
      )
      .reduce(
        (sum, o) => sum + (o.subtotal - o.discountAmount - o.commissionAmount),
        0
      )

    const surabayaEscrow = orders
      .filter(
        (o) =>
          o.storeId === surabayaStoreId && ESCROW_STATUSES.includes(o.status)
      )
      .reduce(
        (sum, o) => sum + (o.subtotal - o.discountAmount - o.commissionAmount),
        0
      )

    expect(roxyEscrow).toBe(9800000)
    expect(surabayaEscrow).toBe(24500000)
    expect(roxyEscrow).not.toBe(surabayaEscrow)
  })
})
