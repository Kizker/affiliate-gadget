import { describe, it, expect } from 'vitest'
import {
  calculateVoucherDiscountAmount,
  VoucherValidationResult,
} from '../../src/lib/constants/voucher'
import {
  checkoutSchema,
  CHECKOUT_ERROR_CODES,
  CheckoutError,
} from '../../src/lib/validations/checkout'

describe('Voucher & Promo Code System Unit Tests', () => {
  describe('1. calculateVoucherDiscountAmount Helper', () => {
    it('should calculate correct percentage discount without cap', () => {
      // 10% of 1.000.000 = 100.000
      const discount = calculateVoucherDiscountAmount(1_000_000, 10, null)
      expect(discount).toBe(100_000)
    })

    it('should apply maximum discount amount cap when raw discount exceeds cap', () => {
      // 20% of 1.000.000 = 200.000, but cap is 50.000 -> result 50.000
      const discount = calculateVoucherDiscountAmount(1_000_000, 20, 50_000)
      expect(discount).toBe(50_000)
    })

    it('should not cap when raw discount is below maximum discount amount', () => {
      // 10% of 200.000 = 20.000, cap is 50.000 -> result 20.000
      const discount = calculateVoucherDiscountAmount(200_000, 10, 50_000)
      expect(discount).toBe(20_000)
    })

    it('should return 0 if subtotal is 0 or negative', () => {
      expect(calculateVoucherDiscountAmount(0, 20, 50_000)).toBe(0)
      expect(calculateVoucherDiscountAmount(-100_000, 20, 50_000)).toBe(0)
    })

    it('should return 0 if discountPercent is 0 or negative', () => {
      expect(calculateVoucherDiscountAmount(500_000, 0, 50_000)).toBe(0)
      expect(calculateVoucherDiscountAmount(500_000, -10, 50_000)).toBe(0)
    })

    it('should not allow discount to exceed subtotal', () => {
      // 99% of 10.000 = 9.900, but cap is 50.000 -> 9.900 (<= 10.000)
      const discount = calculateVoucherDiscountAmount(10_000, 99, 50_000)
      expect(discount).toBe(9_900)
      expect(discount).toBeLessThanOrEqual(10_000)
    })

    it('should round discount to nearest integer', () => {
      // 15% of 333.333 = 49.999,95 -> 50.000
      const discount = calculateVoucherDiscountAmount(333_333, 15, null)
      expect(discount).toBe(50_000)
      expect(Number.isInteger(discount)).toBe(true)
    })
  })

  describe('2. Voucher Validation Logic Simulation', () => {
    interface MockVoucher {
      id: string
      code: string
      isActive: boolean
      discountPercent: number
      maxDiscountAmount: number | null
      minimumPurchase: number
      totalQuota: number
      usedCount: number
      usagePerUser: number
      applicableOrderType: string
      validFrom: Date
      validUntil: Date
    }

    function validateVoucher(
      voucher: MockVoucher | null,
      subtotal: number,
      userId: string,
      userUsageCount: number,
      orderType: string,
      currentDate: Date = new Date()
    ): VoucherValidationResult {
      if (!voucher) {
        return { valid: false, reason: 'Kode voucher tidak ditemukan' }
      }

      if (!voucher.isActive) {
        return { valid: false, reason: 'Voucher saat ini sedang tidak aktif' }
      }

      if (currentDate < voucher.validFrom) {
        return { valid: false, reason: 'Voucher belum berlaku' }
      }

      if (currentDate > voucher.validUntil) {
        return {
          valid: false,
          reason: 'Masa berlaku voucher telah berakhir',
        }
      }

      if (voucher.usedCount >= voucher.totalQuota) {
        return {
          valid: false,
          reason: 'Kuota penukaran voucher telah habis',
        }
      }

      if (voucher.applicableOrderType !== orderType) {
        return {
          valid: false,
          reason: 'Voucher tidak berlaku untuk jenis pesanan ini',
        }
      }

      if (subtotal < voucher.minimumPurchase) {
        return {
          valid: false,
          reason: `Minimum belanja Rp ${voucher.minimumPurchase.toLocaleString('id-ID')} untuk menggunakan voucher ini`,
        }
      }

      if (userUsageCount >= voucher.usagePerUser) {
        return {
          valid: false,
          reason: `Anda telah mencapai batas maksimal (${voucher.usagePerUser}x) pemakaian voucher ini`,
        }
      }

      const discountAmount = calculateVoucherDiscountAmount(
        subtotal,
        voucher.discountPercent,
        voucher.maxDiscountAmount
      )

      return {
        valid: true,
        voucherId: voucher.id,
        voucherCode: voucher.code,
        discountPercent: voucher.discountPercent,
        discountAmount,
        maxDiscountAmount: voucher.maxDiscountAmount,
        minimumPurchase: voucher.minimumPurchase,
      }
    }

    const baseVoucher: MockVoucher = {
      id: 'v-123',
      code: 'PROMOHEMAT',
      isActive: true,
      discountPercent: 15,
      maxDiscountAmount: 100_000,
      minimumPurchase: 500_000,
      totalQuota: 50,
      usedCount: 10,
      usagePerUser: 1,
      applicableOrderType: 'PRODUCT',
      validFrom: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // in 7 days
    }

    it('should validate successfully and return calculated discount', () => {
      const res = validateVoucher(
        baseVoucher,
        1_000_000,
        'user-1',
        0,
        'PRODUCT'
      )
      expect(res.valid).toBe(true)
      expect(res.voucherCode).toBe('PROMOHEMAT')
      expect(res.discountAmount).toBe(100_000) // 15% of 1M is 150k, capped at 100k
    })

    it('should reject if voucher is not found', () => {
      const res = validateVoucher(null, 1_000_000, 'user-1', 0, 'PRODUCT')
      expect(res.valid).toBe(false)
      expect(res.reason).toContain('tidak ditemukan')
    })

    it('should reject inactive voucher', () => {
      const inactiveVoucher = { ...baseVoucher, isActive: false }
      const res = validateVoucher(
        inactiveVoucher,
        1_000_000,
        'user-1',
        0,
        'PRODUCT'
      )
      expect(res.valid).toBe(false)
      expect(res.reason).toContain('tidak aktif')
    })

    it('should reject expired voucher', () => {
      const expiredVoucher = {
        ...baseVoucher,
        validUntil: new Date(Date.now() - 1000), // in the past
      }
      const res = validateVoucher(
        expiredVoucher,
        1_000_000,
        'user-1',
        0,
        'PRODUCT'
      )
      expect(res.valid).toBe(false)
      expect(res.reason).toContain('telah berakhir')
    })

    it('should reject voucher not yet active', () => {
      const futureVoucher = {
        ...baseVoucher,
        validFrom: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
      }
      const res = validateVoucher(
        futureVoucher,
        1_000_000,
        'user-1',
        0,
        'PRODUCT'
      )
      expect(res.valid).toBe(false)
      expect(res.reason).toContain('belum berlaku')
    })

    it('should reject when quota is exhausted', () => {
      const exhaustedVoucher = { ...baseVoucher, totalQuota: 50, usedCount: 50 }
      const res = validateVoucher(
        exhaustedVoucher,
        1_000_000,
        'user-1',
        0,
        'PRODUCT'
      )
      expect(res.valid).toBe(false)
      expect(res.reason).toContain('telah habis')
    })

    it('should reject when subtotal is below minimum purchase', () => {
      // minPurchase is 500.000, subtotal is 300.000
      const res = validateVoucher(baseVoucher, 300_000, 'user-1', 0, 'PRODUCT')
      expect(res.valid).toBe(false)
      expect(res.reason).toContain('Minimum belanja')
    })

    it('should reject when user has reached usage limit', () => {
      // usagePerUser is 1, userUsageCount is 1
      const res = validateVoucher(
        baseVoucher,
        1_000_000,
        'user-1',
        1,
        'PRODUCT'
      )
      expect(res.valid).toBe(false)
      expect(res.reason).toContain('batas maksimal')
    })

    it('should reject when order type does not match', () => {
      const res = validateVoucher(
        baseVoucher,
        1_000_000,
        'user-1',
        0,
        'SERVICE'
      )
      expect(res.valid).toBe(false)
      expect(res.reason).toContain('tidak berlaku untuk jenis pesanan')
    })
  })

  describe('3. Checkout Schema with Voucher Code & Error Codes', () => {
    it('should validate checkout payload with optional voucherCode', () => {
      const payload = {
        items: [
          {
            type: 'PRODUCT',
            productId: 'prod-123',
            quantity: 1,
          },
        ],
        courierCode: 'JNE',
        courierService: 'REG',
        voucherCode: 'RAMADAN20',
      }

      const result = checkoutSchema.safeParse(payload)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.voucherCode).toBe('RAMADAN20')
      }
    })

    it('should validate checkout payload with null or omitted voucherCode', () => {
      const payload = {
        items: [
          {
            type: 'PRODUCT',
            productId: 'prod-123',
            quantity: 1,
          },
        ],
      }

      const result = checkoutSchema.safeParse(payload)
      expect(result.success).toBe(true)
    })

    it('should define all voucher error codes', () => {
      expect(CHECKOUT_ERROR_CODES.VOUCHER_INVALID).toBe('VOUCHER_INVALID')
      expect(CHECKOUT_ERROR_CODES.VOUCHER_EXPIRED).toBe('VOUCHER_EXPIRED')
      expect(CHECKOUT_ERROR_CODES.VOUCHER_QUOTA_EMPTY).toBe(
        'VOUCHER_QUOTA_EMPTY'
      )
      expect(CHECKOUT_ERROR_CODES.VOUCHER_MIN_PURCHASE).toBe(
        'VOUCHER_MIN_PURCHASE'
      )
      expect(CHECKOUT_ERROR_CODES.VOUCHER_USER_LIMIT).toBe('VOUCHER_USER_LIMIT')
    })

    it('should instantiate CheckoutError with voucher error code and status', () => {
      const err = new CheckoutError(
        'Voucher kedaluwarsa',
        CHECKOUT_ERROR_CODES.VOUCHER_EXPIRED,
        400
      )
      expect(err.code).toBe('VOUCHER_EXPIRED')
      expect(err.statusCode).toBe(400)
      expect(err.message).toBe('Voucher kedaluwarsa')
    })
  })
})
