import { describe, it, expect } from 'vitest'
import { checkRateLimit } from '../../src/lib/rate-limit'
import {
  INSURANCE_RATE,
  INSURANCE_PERCENTAGE,
  calculateInsuranceFee,
  isValidInsuranceFee,
} from '../../src/lib/constants/insurance'
import {
  calculateWeightShipping,
  calculateBilledKg,
  COURIER_MULTIPLIERS,
  DEFAULT_PRICE_PER_KG,
  DEFAULT_WEIGHT_GRAM,
  WEIGHT_THRESHOLD_GRAM,
} from '../../src/lib/constants/shipping'

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
      orderType: 'PRODUCT' | 'RENTAL' | 'SERVICE' = 'PRODUCT',
      totalWeightGram: number = DEFAULT_WEIGHT_GRAM,
      pricePerKg: number = DEFAULT_PRICE_PER_KG
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
        shippingCost = calculateWeightShipping(
          totalWeightGram,
          pricePerKg,
          detectedCourier,
          detectedService
        )
        insuranceFee = calculateInsuranceFee(subtotal)
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

    it('should calculate standard JNE REG base + weight-based shipping and mandatory 0.2% insurance correctly', () => {
      const subtotal = 10_000_000 // 10 juta
      // 1200g -> 2kg billed (extra 1kg) -> 15.000 + (1 * 20.000) = 35.000
      const result = calculateCheckoutTotal(
        subtotal,
        'JNE',
        'REG',
        'PRODUCT',
        1200,
        20000
      )

      expect(result.shippingCost).toBe(35000)
      expect(result.insuranceFee).toBe(20000) // 10M * 0.002 = 20,000
      expect(result.total).toBe(10_055_000)
      expect(result.commissionAmount).toBe(200_000) // 2% of 10M
    })

    it('should calculate flat 0.2% insurance with base shipping for low value items (sub-1kg = base Rp 15.000)', () => {
      const subtotal = 1_000_000 // 1 juta
      const result = calculateCheckoutTotal(
        subtotal,
        'JNE',
        'REG',
        'PRODUCT',
        500,
        20000
      )

      // 500g <= 1kg -> shippingCost = Base Rp 15.000
      expect(result.insuranceFee).toBe(2000) // 1M * 0.002 = 2,000
      expect(result.shippingCost).toBe(15000)
      expect(result.total).toBe(1_017_000)
    })

    it('should calculate 0.2% for mid-range product (Rp 5 juta), sub-1kg = base Rp 15.000', () => {
      const subtotal = 5_000_000
      const result = calculateCheckoutTotal(
        subtotal,
        'JNE',
        'REG',
        'PRODUCT',
        500,
        20000
      )

      expect(result.insuranceFee).toBe(10000) // 5M * 0.002 = 10,000
      // 500g <= 1kg -> shippingCost = Base Rp 15.000
      expect(result.shippingCost).toBe(15000)
      expect(result.total).toBe(5_025_000)
    })

    it('should calculate JNE YES (1.8x) and GOJEK INSTANT (2.2x) correctly for base + weight (> 1kg)', () => {
      const subtotal = 5_000_000

      // 1200g -> 2kg billed (extra 1kg -> 15.000 + 20.000 = 35.000)
      const jneYes = calculateCheckoutTotal(
        subtotal,
        'JNE',
        'YES',
        'PRODUCT',
        1200,
        20000
      )
      expect(jneYes.shippingCost).toBe(63000) // 35000 * 1.8 = 63000
      expect(jneYes.insuranceFee).toBe(10000)
      expect(jneYes.total).toBe(5_073_000)

      const gojek = calculateCheckoutTotal(
        subtotal,
        'GOJEK',
        'INSTANT',
        'PRODUCT',
        1200,
        20000
      )
      expect(gojek.shippingCost).toBe(77000) // 35000 * 2.2 = 77000
      expect(gojek.insuranceFee).toBe(10000)
      expect(gojek.total).toBe(5_087_000)
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

    it('should validate insurance integrity helpers and edge cases', () => {
      expect(INSURANCE_RATE).toBe(0.002)
      expect(INSURANCE_PERCENTAGE).toBe(0.2)
      expect(calculateInsuranceFee(0)).toBe(0)
      expect(calculateInsuranceFee(-500000)).toBe(0)
      expect(calculateInsuranceFee(NaN)).toBe(0)
      expect(calculateInsuranceFee(12_345_678)).toBe(24691) // Math.round(24691.356)

      // Test isValidInsuranceFee helper
      expect(isValidInsuranceFee(10_000_000, 20000, false)).toBe(true)
      expect(isValidInsuranceFee(10_000_000, 15000, false)).toBe(false)
      expect(isValidInsuranceFee(500_000, 0, true)).toBe(true)
      expect(isValidInsuranceFee(500_000, 1000, true)).toBe(false)
    })

    describe('Weight-Based Shipping Formula & Accumulation', () => {
      it('should export WEIGHT_THRESHOLD_GRAM = 1000', () => {
        expect(WEIGHT_THRESHOLD_GRAM).toBe(1000)
      })

      it('should calculate billedKg with ceiling and minimum 1kg', () => {
        expect(calculateBilledKg(0)).toBe(1)
        expect(calculateBilledKg(-100)).toBe(1)
        expect(calculateBilledKg(NaN)).toBe(1)
        expect(calculateBilledKg(200)).toBe(1) // 0.2kg -> 1kg
        expect(calculateBilledKg(1000)).toBe(1) // 1.0kg -> 1kg
        expect(calculateBilledKg(1001)).toBe(2) // 1.001kg -> 2kg
        expect(calculateBilledKg(2500)).toBe(3) // 2.5kg -> 3kg
      })

      it('should return base shipping cost (Rp 15.000) for items <= 1kg (<= 1000g)', () => {
        // Fallback default weight (500g) -> minimum Base Rp 15.000
        expect(calculateWeightShipping(0, 20000, 'JNE', 'REG')).toBe(15000)
        expect(calculateWeightShipping(-100, 20000, 'JNE', 'REG')).toBe(15000)
        expect(calculateWeightShipping(NaN, 20000, 'JNE', 'REG')).toBe(15000)
        // 500g <= 1000g -> Base Rp 15.000
        expect(calculateWeightShipping(500, 20000, 'JNE', 'REG')).toBe(15000)
        // 999g <= 1000g -> Base Rp 15.000
        expect(calculateWeightShipping(999, 20000, 'JNE', 'REG')).toBe(15000)
        // 1000g (= 1kg) -> Base Rp 15.000
        expect(calculateWeightShipping(1000, 20000, 'JNE', 'REG')).toBe(15000)
      })

      it('should calculate base + extra weight shipping for items > 1kg (1200g = 2kg, JNE REG)', () => {
        // 1200g -> 2kg (extra 1kg) -> 15.000 + (1 * 20.000) = 35.000
        expect(calculateWeightShipping(1200, 20000, 'JNE', 'REG')).toBe(35000)
      })

      it('should accumulate weight for multiple items (e.g. 2 x 600g = 1200g -> 2kg)', () => {
        const item1Weight = 600
        const item2Weight = 600
        const totalWeight = item1Weight + item2Weight // 1200g -> 2kg -> 15.000 + 20.000 = 35.000
        expect(calculateWeightShipping(totalWeight, 20000, 'JNE', 'REG')).toBe(
          35000
        )
      })

      it('should return base shipping cost for sub-1kg accumulated weight (e.g. 2 x 400g = 800g)', () => {
        const totalWeight = 400 + 400 // 800g <= 1000g -> Base Rp 15.000
        expect(calculateWeightShipping(totalWeight, 20000, 'JNE', 'REG')).toBe(
          15000
        )
      })

      it('should apply correct courier multipliers for base and extra weight', () => {
        expect(COURIER_MULTIPLIERS['JNE_REG']).toBe(1.0)
        expect(COURIER_MULTIPLIERS['JNE_YES']).toBe(1.8)
        expect(COURIER_MULTIPLIERS['GOJEK_INSTANT']).toBe(2.2)
        expect(COURIER_MULTIPLIERS['GOJEK_SAMEDAY']).toBe(1.5)

        // <= 1kg (500g):
        // JNE YES: 15.000 * 1.8 = 27.000
        expect(calculateWeightShipping(500, 20000, 'JNE', 'YES')).toBe(27000)
        // GOJEK SAMEDAY: 15.000 * 1.5 = 22.500
        expect(calculateWeightShipping(500, 20000, 'GOJEK', 'SAMEDAY')).toBe(
          22500
        )
        // GOJEK INSTANT: 15.000 * 2.2 = 33.000
        expect(calculateWeightShipping(500, 20000, 'GOJEK', 'INSTANT')).toBe(
          33000
        )

        // > 1kg (1500g -> 2kg, extra 1kg -> 15.000 + 20.000 = 35.000):
        // 2kg with JNE YES -> 35.000 * 1.8 = 63.000
        expect(calculateWeightShipping(1500, 20000, 'JNE', 'YES')).toBe(63000)
        // 2kg with GOJEK SAMEDAY -> 35.000 * 1.5 = 52.500
        expect(calculateWeightShipping(1500, 20000, 'GOJEK', 'SAMEDAY')).toBe(
          52500
        )
        // 2kg with GOJEK INSTANT -> 35.000 * 2.2 = 77.000
        expect(calculateWeightShipping(1500, 20000, 'GOJEK', 'INSTANT')).toBe(
          77000
        )
      })

      it('should use custom pricePerKg for extra weight when provided', () => {
        // sub-1kg -> still base 15.000 (1st kg uses base rate)
        expect(calculateWeightShipping(500, 25000, 'JNE', 'REG')).toBe(15000)
        // exactly 1kg -> 15.000
        expect(calculateWeightShipping(1000, 25000, 'JNE', 'REG')).toBe(15000)
        // 1.5kg (2kg -> extra 1kg at 25.000 -> 15.000 + 25.000 = 40.000)
        expect(calculateWeightShipping(1500, 25000, 'JNE', 'REG')).toBe(40000)
        // 1.5kg with JNE YES -> 40.000 * 1.8 = 72.000
        expect(calculateWeightShipping(1500, 25000, 'JNE', 'YES')).toBe(72000)
      })
    })
  })
})
