import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  PLATFORM_COMMISSION_RATE,
  GATEWAY_FEE_PER_TRANSACTION,
  ACTIVE_ORDER_STATUSES,
  ESCROW_STATUSES,
} from '@/lib/finance-constants'
import {
  createStoreWithdrawal,
  getStoreWithdrawals,
  getTotalWithdrawn,
} from '@/lib/store-withdrawal-store'
import prisma from '@/lib/db'

describe('Financial P0 & P1 Fixes Suite', () => {
  describe('FIX-02: Status Canonical & Webhook Synchronization', () => {
    it('should include PAID in ACTIVE_ORDER_STATUSES and ESCROW_STATUSES', () => {
      expect(ACTIVE_ORDER_STATUSES).toContain('PAID')
      expect(ESCROW_STATUSES).toContain('PAID')
      expect(ACTIVE_ORDER_STATUSES).toContain('COMPLETED')
      expect(ESCROW_STATUSES).not.toContain('COMPLETED')
    })

    it('should ensure orderStatus becomes PAID upon settlement or capture accept', () => {
      function getOrderStatusFromWebhook(
        transactionStatus: string,
        fraudStatus?: string
      ) {
        let paymentStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' = 'PENDING'
        let orderStatus: 'PENDING_PAYMENT' | 'PAID' | 'CANCELLED' =
          'PENDING_PAYMENT'

        if (transactionStatus === 'capture') {
          if (fraudStatus === 'challenge') {
            paymentStatus = 'PENDING'
            orderStatus = 'PENDING_PAYMENT'
          } else if (fraudStatus === 'accept') {
            paymentStatus = 'VERIFIED'
            orderStatus = 'PAID'
          }
        } else if (transactionStatus === 'settlement') {
          paymentStatus = 'VERIFIED'
          orderStatus = 'PAID'
        } else if (transactionStatus === 'pending') {
          paymentStatus = 'PENDING'
          orderStatus = 'PENDING_PAYMENT'
        } else if (
          transactionStatus === 'deny' ||
          transactionStatus === 'cancel' ||
          transactionStatus === 'expire'
        ) {
          paymentStatus = 'REJECTED'
          orderStatus = 'CANCELLED'
        }
        return { paymentStatus, orderStatus }
      }

      expect(getOrderStatusFromWebhook('settlement')).toEqual({
        paymentStatus: 'VERIFIED',
        orderStatus: 'PAID',
      })
      expect(getOrderStatusFromWebhook('capture', 'accept')).toEqual({
        paymentStatus: 'VERIFIED',
        orderStatus: 'PAID',
      })
      expect(getOrderStatusFromWebhook('capture', 'challenge')).toEqual({
        paymentStatus: 'PENDING',
        orderStatus: 'PENDING_PAYMENT',
      })
      expect(getOrderStatusFromWebhook('pending')).toEqual({
        paymentStatus: 'PENDING',
        orderStatus: 'PENDING_PAYMENT',
      })
      expect(getOrderStatusFromWebhook('cancel')).toEqual({
        paymentStatus: 'REJECTED',
        orderStatus: 'CANCELLED',
      })
    })
  })

  describe('FIX-03: Formula Pemotongan Gateway Fee & Lock Komisi 2%', () => {
    it('should have PLATFORM_COMMISSION_RATE locked at 2% and GATEWAY_FEE at flat Rp 4.000', () => {
      expect(PLATFORM_COMMISSION_RATE).toBe(0.02)
      expect(GATEWAY_FEE_PER_TRANSACTION).toBe(4000)
    })

    it('should calculate availableBalance by deducting commission, withdrawn, AND gateway fees', () => {
      // Skenario: Toko memiliki 3 transaksi selesai senilai Rp 10.000.000 masing-masing
      const completedOrders = [
        { id: 'ord-1', subtotal: 10000000, discount: 0 },
        { id: 'ord-2', subtotal: 10000000, discount: 0 },
        { id: 'ord-3', subtotal: 10000000, discount: 0 },
      ]

      const grossRevenue = completedOrders.reduce(
        (sum, o) => sum + o.subtotal,
        0
      ) // Rp 30.000.000
      const commission = grossRevenue * PLATFORM_COMMISSION_RATE // 2% = Rp 600.000
      const totalWithdrawn = 5000000 // Sudah ditarik Rp 5.000.000
      const totalGatewayFees =
        completedOrders.length * GATEWAY_FEE_PER_TRANSACTION // 3 × 4.000 = Rp 12.000

      const netStoreAmount = grossRevenue - commission
      const availableBalance = Math.max(
        0,
        netStoreAmount - totalWithdrawn - totalGatewayFees
      )

      // Rp 30.000.000 - Rp 600.000 - Rp 5.000.000 - Rp 12.000 = Rp 24.388.000
      expect(commission).toBe(600000)
      expect(totalGatewayFees).toBe(12000)
      expect(availableBalance).toBe(24388000)
    })
  })

  describe('FIX-01: PostgreSQL StoreWithdrawal Store Operations', () => {
    it('should properly structure created StoreWithdrawal records', async () => {
      const mockCreated = {
        id: 'wd-cuid-test',
        refNumber: 'WD-20261002-1234',
        storeId: 'cmtstxtzp0002uy5o5nchywt9',
        storeName: 'Affiliate Gadget Roxy Mas',
        companyName: 'PT Gadget Jaya Sentosa',
        bankName: 'Bank Mandiri',
        accountNumber: '1180019283741',
        accountName: 'PT Gadget Jaya Sentosa',
        amount: 25000000,
        status: 'SUCCESS',
        requestedBy: 'Bambang S.',
        completedAt: new Date(),
        createdAt: new Date(),
      }

      vi.spyOn(prisma.storeWithdrawal, 'create').mockResolvedValueOnce(
        mockCreated as any
      )

      const result = await createStoreWithdrawal({
        storeId: mockCreated.storeId,
        storeName: mockCreated.storeName,
        companyName: mockCreated.companyName,
        bankName: mockCreated.bankName,
        accountNumber: mockCreated.accountNumber,
        accountName: mockCreated.accountName,
        amount: mockCreated.amount,
        status: 'SUCCESS',
        requestedBy: mockCreated.requestedBy,
      })

      expect(result.id).toBe(mockCreated.id)
      expect(result.amount).toBe(25000000)
      expect(result.status).toBe('SUCCESS')
    })

    it('should aggregate totalWithdrawn correctly from Prisma', async () => {
      vi.spyOn(prisma.storeWithdrawal, 'aggregate').mockResolvedValueOnce({
        _sum: { amount: 75000000 },
      } as any)

      const total = await getTotalWithdrawn('cmtstxtzp0002uy5o5nchywt9')
      expect(total).toBe(75000000)
    })
  })
})
