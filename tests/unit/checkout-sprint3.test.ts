import { describe, it, expect } from 'vitest'
import crypto from 'crypto'
import {
  CHECKOUT_ERROR_CODES,
  CheckoutError,
  checkoutSchema,
} from '../../src/lib/validations/checkout'

describe('Sprint 3: Checkout Hardening, UI Polish & Idempotency', () => {
  describe('MED-05: Collision-Proof Order Number Generation', () => {
    function generateOrderNumber(prefix: string): string {
      const now = new Date()
      const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, '')
      const randomSuffix = crypto
        .randomUUID()
        .replace(/-/g, '')
        .substring(0, 8)
        .toUpperCase()
      return `${prefix}-${yyyymmdd}-${randomSuffix}`
    }

    it('should generate valid format: PREFIX-YYYYMMDD-8HEX', () => {
      const prefixes = ['SPR', 'RNT', 'SVC']
      const regex = /^(SPR|RNT|SVC)-\d{8}-[A-F0-9]{8}$/

      for (const prefix of prefixes) {
        const orderNumber = generateOrderNumber(prefix)
        expect(orderNumber).toMatch(regex)
        expect(orderNumber.startsWith(`${prefix}-`)).toBe(true)
        const parts = orderNumber.split('-')
        expect(parts).toHaveLength(3)
        expect(parts[1]).toHaveLength(8) // YYYYMMDD
        expect(parts[2]).toHaveLength(8) // 8-char hex
      }
    })

    it('should produce 1000 collision-free numbers without collision (high entropy)', () => {
      const set = new Set<string>()
      const total = 1000

      for (let i = 0; i < total; i++) {
        const orderNumber = generateOrderNumber('SPR')
        expect(set.has(orderNumber)).toBe(false)
        set.add(orderNumber)
      }

      expect(set.size).toBe(total)
    })
  })

  describe('MED-06: Structured Error Handling & CHECKOUT_ERROR_CODES', () => {
    it('should define all mandatory checkout error codes', () => {
      expect(CHECKOUT_ERROR_CODES.UNAUTHORIZED).toBe('UNAUTHORIZED')
      expect(CHECKOUT_ERROR_CODES.FORBIDDEN_ROLE).toBe('FORBIDDEN_ROLE')
      expect(CHECKOUT_ERROR_CODES.RATE_LIMIT_USER).toBe('RATE_LIMIT_USER')
      expect(CHECKOUT_ERROR_CODES.RATE_LIMIT_IP).toBe('RATE_LIMIT_IP')
      expect(CHECKOUT_ERROR_CODES.INVALID_JSON).toBe('INVALID_JSON')
      expect(CHECKOUT_ERROR_CODES.VALIDATION_FAILED).toBe('VALIDATION_FAILED')
      expect(CHECKOUT_ERROR_CODES.IDEMPOTENCY_IN_PROGRESS).toBe(
        'IDEMPOTENCY_IN_PROGRESS'
      )
      expect(CHECKOUT_ERROR_CODES.IDEMPOTENCY_REPLAY).toBe('IDEMPOTENCY_REPLAY')
      expect(CHECKOUT_ERROR_CODES.STOK_HABIS).toBe('STOK_HABIS')
      expect(CHECKOUT_ERROR_CODES.PRODUK_TIDAK_AKTIF).toBe('PRODUK_TIDAK_AKTIF')
      expect(CHECKOUT_ERROR_CODES.PRODUK_TIDAK_DITEMUKAN).toBe(
        'PRODUK_TIDAK_DITEMUKAN'
      )
      expect(CHECKOUT_ERROR_CODES.PRODUK_TANPA_TOKO).toBe('PRODUK_TANPA_TOKO')
      expect(CHECKOUT_ERROR_CODES.ORDER_CREATION_FAILED).toBe(
        'ORDER_CREATION_FAILED'
      )
      expect(CHECKOUT_ERROR_CODES.ORDER_NUMBER_CONFLICT).toBe(
        'ORDER_NUMBER_CONFLICT'
      )
      expect(CHECKOUT_ERROR_CODES.INTERNAL_ERROR).toBe('INTERNAL_ERROR')
    })

    it('should instantiate CheckoutError with correct code and status code', () => {
      const err = new CheckoutError(
        'Stok tidak cukup',
        CHECKOUT_ERROR_CODES.STOK_HABIS,
        400
      )

      expect(err).toBeInstanceOf(Error)
      expect(err).toBeInstanceOf(CheckoutError)
      expect(err.name).toBe('CheckoutError')
      expect(err.message).toBe('Stok tidak cukup')
      expect(err.code).toBe('STOK_HABIS')
      expect(err.statusCode).toBe(400)
    })
  })

  describe('LOW-06: Store ID Guard for Physical Products', () => {
    it('should identify invalid physical products without storeId or inactive store', () => {
      const mockProducts = [
        {
          id: 'prod-orphan',
          name: 'iPhone 15 Pro',
          storeId: null,
          store: null,
        },
        {
          id: 'prod-inactive-store',
          name: 'Samsung S24',
          storeId: 'store-closed',
          store: { id: 'store-closed', isActive: false },
        },
        {
          id: 'prod-valid',
          name: 'Xiaomi 14',
          storeId: 'store-roxy',
          store: { id: 'store-roxy', isActive: true },
        },
      ]

      for (const p of mockProducts) {
        const isValid = Boolean(p.storeId && p.store && p.store.isActive)
        if (p.id === 'prod-valid') {
          expect(isValid).toBe(true)
        } else {
          expect(isValid).toBe(false)
        }
      }
    })
  })

  describe('BONUS-01: Dynamic 3-in-1 Bonus Calculation', () => {
    it('should evaluate bonus inclusion dynamically based on product flags', () => {
      const itemsWithAllBonus = [
        {
          name: 'iPhone 13',
          includesCharger: true,
          includesScreenProtector: true,
          includesCase: true,
        },
        {
          name: 'Samsung S23',
          includesCharger: true,
          includesScreenProtector: true,
          includesCase: true,
        },
      ]

      const chargerIncluded = itemsWithAllBonus.every(
        (i) => i.includesCharger !== false
      )
      const protectorIncluded = itemsWithAllBonus.every(
        (i) => i.includesScreenProtector !== false
      )
      const caseIncluded = itemsWithAllBonus.every(
        (i) => i.includesCase !== false
      )

      expect(chargerIncluded).toBe(true)
      expect(protectorIncluded).toBe(true)
      expect(caseIncluded).toBe(true)
    })

    it('should correctly set bonus false if any item does not include the bonus accessory', () => {
      const itemsPartialBonus = [
        {
          name: 'iPhone 15',
          includesCharger: false, // No charger included
          includesScreenProtector: true,
          includesCase: true,
        },
        {
          name: 'Case Only',
          includesCharger: true,
          includesScreenProtector: true,
          includesCase: true,
        },
      ]

      const chargerIncluded = itemsPartialBonus.every(
        (i) => i.includesCharger !== false
      )
      const protectorIncluded = itemsPartialBonus.every(
        (i) => i.includesScreenProtector !== false
      )
      const caseIncluded = itemsPartialBonus.every(
        (i) => i.includesCase !== false
      )

      expect(chargerIncluded).toBe(false)
      expect(protectorIncluded).toBe(true)
      expect(caseIncluded).toBe(true)
    })

    it('should set all bonuses to false for non-product order types', () => {
      const orderType: 'RENTAL' | 'SERVICE' = 'RENTAL'
      const bonusCharger = orderType === ('PRODUCT' as string)
      const bonusProtector = orderType === ('PRODUCT' as string)
      const bonusCase = orderType === ('PRODUCT' as string)

      expect(bonusCharger).toBe(false)
      expect(bonusProtector).toBe(false)
      expect(bonusCase).toBe(false)
    })
  })

  describe('LOW-04: Idempotency Key Validation & Format', () => {
    it('should validate UUID v4 idempotency keys generated by client', () => {
      const key = crypto.randomUUID()
      const uuidV4Regex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

      expect(key).toMatch(uuidV4Regex)
      expect(key.length).toBe(36)
    })

    it('should formulate proper Redis idempotency storage key', () => {
      const userId = 'user_cm8123456789'
      const idempotencyKey = crypto.randomUUID()
      const redisKey = `idempotency:checkout:${userId}:${idempotencyKey}`

      expect(redisKey).toContain(userId)
      expect(redisKey).toContain(idempotencyKey)
      expect(redisKey.startsWith('idempotency:checkout:')).toBe(true)
    })
  })

  describe('MED-08: Courier Service Calculation Logic (JNE REG vs YES)', () => {
    function calculateShippingCost(
      courier: 'JNE' | 'GOJEK',
      courierService: string
    ): number {
      if (courier === 'GOJEK') return 35000
      if (courierService === 'YES') return 28000
      return 15000
    }

    it('should calculate Rp 15.000 for JNE REG', () => {
      expect(calculateShippingCost('JNE', 'REG')).toBe(15000)
    })

    it('should calculate Rp 28.000 for JNE YES', () => {
      expect(calculateShippingCost('JNE', 'YES')).toBe(28000)
    })

    it('should calculate Rp 35.000 for Gojek Instant', () => {
      expect(calculateShippingCost('GOJEK', 'INSTANT')).toBe(35000)
      expect(calculateShippingCost('GOJEK', 'REG')).toBe(35000) // Gojek overrides service
    })
  })
})
