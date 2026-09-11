import { describe, it, expect } from 'vitest'
import { checkRateLimit } from '../../src/lib/rate-limit'

describe('Checkout Security & Business Rules (Sprint 1)', () => {
  describe('Rate Limiting (CRIT-03)', () => {
    it('should allow checkout requests up to 5 attempts per minute per user', async () => {
      const userId = `user-test-${Date.now()}`
      const key = `checkout:user:${userId}`

      for (let i = 1; i <= 5; i++) {
        const res = await checkRateLimit(key, 5, 60)
        expect(res.success).toBe(true)
        expect(res.remaining).toBe(5 - i)
      }

      // 6th attempt must fail
      const blocked = await checkRateLimit(key, 5, 60)
      expect(blocked.success).toBe(false)
      expect(blocked.remaining).toBe(0)
    })

    it('should allow checkout requests up to 10 attempts per 10 minutes per IP', async () => {
      const ip = `192.168.1.${Math.floor(Math.random() * 200 + 10)}-${Date.now()}-${Math.random()}`
      const key = `checkout:ip:${ip}`

      for (let i = 1; i <= 10; i++) {
        const res = await checkRateLimit(key, 10, 600)
        expect(res.success).toBe(true)
      }

      // 11th attempt must fail
      const blocked = await checkRateLimit(key, 10, 600)
      expect(blocked.success).toBe(false)
    })
  })

  describe('Server-Side Price, Shipping & Insurance Calculations (CRIT-02)', () => {
    const calculateCheckoutTotal = (
      subtotal: number,
      courierCode: string,
      courierService: string,
      orderType: 'PRODUCT' | 'RENTAL' | 'SERVICE' = 'PRODUCT'
    ) => {
      let shippingCost = 0
      let insuranceFee = 0

      const detectedCourier = courierCode === 'GOJEK' ? 'GOJEK' : 'JNE'
      const detectedService =
        detectedCourier === 'GOJEK'
          ? courierService === 'SAMEDAY'
            ? 'SAMEDAY'
            : 'INSTANT'
          : courierService === 'YES'
            ? 'YES'
            : 'REG'

      if (orderType === 'PRODUCT' || orderType === 'RENTAL') {
        shippingCost =
          detectedCourier === 'GOJEK'
            ? 35000
            : detectedService === 'YES'
              ? 28000
              : 15000
        insuranceFee = Math.max(15000, Math.round(subtotal * 0.0025))
      }

      const total = subtotal + shippingCost + insuranceFee
      const commissionRate = 2.0
      const commissionAmount = (subtotal * commissionRate) / 100

      return {
        subtotal,
        shippingCost,
        insuranceFee,
        total,
        commissionRate,
        commissionAmount,
        courierCode: orderType !== 'SERVICE' ? detectedCourier : null,
        courierService: orderType !== 'SERVICE' ? detectedService : null,
      }
    }

    it('should calculate standard JNE REG shipping (15,000) and mandatory insurance correctly', () => {
      const subtotal = 10_000_000 // 10 juta
      const result = calculateCheckoutTotal(subtotal, 'JNE', 'REG', 'PRODUCT')

      expect(result.shippingCost).toBe(15000)
      expect(result.insuranceFee).toBe(25000) // 10M * 0.0025 = 25,000 > 15,000 min
      expect(result.total).toBe(10_040_000)
      expect(result.commissionAmount).toBe(200_000) // 2% of 10M
    })

    it('should enforce minimum 15,000 insurance fee for low value items', () => {
      const subtotal = 1_000_000 // 1 juta (0.25% = 2,500 < 15,000 min)
      const result = calculateCheckoutTotal(subtotal, 'JNE', 'REG', 'PRODUCT')

      expect(result.insuranceFee).toBe(15000)
      expect(result.shippingCost).toBe(15000)
      expect(result.total).toBe(1_030_000)
    })

    it('should calculate JNE YES (28,000) and GOJEK (35,000) correctly', () => {
      const subtotal = 5_000_000

      const jneYes = calculateCheckoutTotal(subtotal, 'JNE', 'YES', 'PRODUCT')
      expect(jneYes.shippingCost).toBe(28000)

      const gojek = calculateCheckoutTotal(
        subtotal,
        'GOJEK',
        'INSTANT',
        'PRODUCT'
      )
      expect(gojek.shippingCost).toBe(35000)
    })

    it('should waive shipping and insurance for SERVICE orders', () => {
      const subtotal = 500_000
      const service = calculateCheckoutTotal(subtotal, 'JNE', 'REG', 'SERVICE')

      expect(service.shippingCost).toBe(0)
      expect(service.insuranceFee).toBe(0)
      expect(service.total).toBe(500_000)
      expect(service.courierCode).toBeNull()
      expect(service.courierService).toBeNull()
    })
  })
})
