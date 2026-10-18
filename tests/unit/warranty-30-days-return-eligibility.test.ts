import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import {
  isWarrantyExpired,
  isReturnEligible,
  OrderWarrantyInfo,
} from '@/lib/order-return-utils'

describe('30-Day Warranty Expiration & Return Eligibility', () => {
  describe('isWarrantyExpired', () => {
    it('mengembalikan true jika warrantyExpiryDate sudah lewat (kadaluarsa)', () => {
      const expiredOrder: OrderWarrantyInfo = {
        status: 'COMPLETED',
        warrantyExpiryDate: new Date('2026-09-01T00:00:00.000Z'), // Past date
      }
      expect(isWarrantyExpired(expiredOrder)).toBe(true)
    })

    it('mengembalikan false jika warrantyExpiryDate masih berlaku (masa depan)', () => {
      const activeOrder: OrderWarrantyInfo = {
        status: 'COMPLETED',
        warrantyExpiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days in future
      }
      expect(isWarrantyExpired(activeOrder)).toBe(false)
    })

    it('mengembalikan true jika completedAt lebih dari 30 hari yang lalu (tanpa warrantyExpiryDate)', () => {
      const fortyDaysAgo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000)
      const order: OrderWarrantyInfo = {
        status: 'COMPLETED',
        completedAt: fortyDaysAgo,
      }
      expect(isWarrantyExpired(order)).toBe(true)
    })

    it('mengembalikan false jika completedAt kurang dari 30 hari yang lalu (tanpa warrantyExpiryDate)', () => {
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      const order: OrderWarrantyInfo = {
        status: 'COMPLETED',
        completedAt: fiveDaysAgo,
      }
      expect(isWarrantyExpired(order)).toBe(false)
    })

    it('mengembalikan false jika tidak ada data tanggal yang tersedia', () => {
      const order: OrderWarrantyInfo = {
        status: 'COMPLETED',
      }
      expect(isWarrantyExpired(order)).toBe(false)
    })
  })

  describe('isReturnEligible', () => {
    it('mengembalikan false jika pesanan belum COMPLETED (misal SHIPPED atau PENDING_PAYMENT)', () => {
      const shippedOrder: OrderWarrantyInfo = {
        status: 'SHIPPED',
        warrantyExpiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      }
      expect(isReturnEligible(shippedOrder)).toBe(false)

      const pendingOrder: OrderWarrantyInfo = {
        status: 'PENDING_PAYMENT',
      }
      expect(isReturnEligible(pendingOrder)).toBe(false)
    })

    it('mengembalikan false jika garansi 30 hari sudah kadaluarsa (walaupun status COMPLETED)', () => {
      const expiredCompletedOrder: OrderWarrantyInfo = {
        status: 'COMPLETED',
        warrantyExpiryDate: new Date('2026-09-01T00:00:00.000Z'),
      }
      expect(isReturnEligible(expiredCompletedOrder)).toBe(false)
    })

    it('mengembalikan true jika pesanan COMPLETED dan garansi 30 hari masih aktif tanpa klaim aktif', () => {
      const activeCompletedOrder: OrderWarrantyInfo = {
        status: 'COMPLETED',
        warrantyExpiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        returnRequests: [],
      }
      expect(isReturnEligible(activeCompletedOrder)).toBe(true)
    })

    it('mengembalikan false jika sudah ada return request yang pending atau disetujui', () => {
      const orderWithPendingReturn: OrderWarrantyInfo = {
        status: 'COMPLETED',
        warrantyExpiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        returnRequests: [{ status: 'PENDING' }],
      }
      expect(isReturnEligible(orderWithPendingReturn)).toBe(false)

      const orderWithApprovedReturn: OrderWarrantyInfo = {
        status: 'COMPLETED',
        warrantyExpiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        returnRequests: [{ status: 'APPROVED' }],
      }
      expect(isReturnEligible(orderWithApprovedReturn)).toBe(false)
    })

    it('mengembalikan true jika return request sebelumnya REJECTED dan garansi masih aktif', () => {
      const orderWithRejectedReturn: OrderWarrantyInfo = {
        status: 'COMPLETED',
        warrantyExpiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        returnRequests: [{ status: 'REJECTED' }],
      }
      expect(isReturnEligible(orderWithRejectedReturn)).toBe(true)
    })
  })

  describe('UI Component Guards Validation', () => {
    it('memvalidasi mobile-orders-view.tsx menyembunyikan tombol Retur ketika garansi habis', () => {
      const filePath = path.resolve(
        process.cwd(),
        'src/components/customer/mobile-orders-view.tsx'
      )
      const content = fs.readFileSync(filePath, 'utf-8')

      expect(content).toContain('isReturnEligible')
      expect(content).toContain(
        '{isReturnEligible(order) && onOpenReturnModal && ('
      )
      expect(content).toContain('Retur')
    })

    it('memvalidasi orders-client.tsx menyembunyikan tombol Ajukan Pengembalian ketika garansi habis', () => {
      const filePath = path.resolve(
        process.cwd(),
        'src/app/dashboard/customer/orders/orders-client.tsx'
      )
      const content = fs.readFileSync(filePath, 'utf-8')

      expect(content).toContain('isReturnEligible')
      expect(content).toContain('{isReturnEligible(order) && (')
      expect(content).toContain('Ajukan Pengembalian')
    })

    it('memvalidasi order-detail-client.tsx memblokir tombol retur dan klaim garansi jika garansi lewat', () => {
      const filePath = path.resolve(
        process.cwd(),
        'src/app/dashboard/customer/orders/[orderId]/order-detail-client.tsx'
      )
      const content = fs.readFileSync(filePath, 'utf-8')

      expect(content).toContain('isWarrantyExpired')
      expect(content).toContain(
        'const isWarrantyOver = isWarrantyExpired(order)'
      )
      expect(content).toContain('!isWarrantyOver')
    })

    it('memvalidasi API POST /api/returns menolak pengajuan pengembalian jika garansi 30 hari lewat', () => {
      const filePath = path.resolve(
        process.cwd(),
        'src/app/api/returns/route.ts'
      )
      const content = fs.readFileSync(filePath, 'utf-8')

      expect(content).toContain('isWarrantyOver')
      expect(content).toContain(
        'Batas waktu pengajuan pengembalian (30 hari garansi ganti unit) telah berakhir'
      )
    })
  })
})
