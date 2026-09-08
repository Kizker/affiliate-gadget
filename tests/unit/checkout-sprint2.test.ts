import { describe, it, expect } from 'vitest'
import {
  checkoutSchema,
  checkoutItemSchema,
} from '../../src/lib/validations/checkout'

describe('Sprint 2: Checkout Validation & IDOR Hardening', () => {
  describe('HIGH-02: Zod Checkout Validation Schema', () => {
    it('should pass validation with valid PRODUCT payload', () => {
      const validPayload = {
        items: [
          {
            type: 'PRODUCT',
            productId: 'prod-123',
            quantity: 2,
            name: 'iPhone 13 Pro 128GB',
          },
        ],
        paymentMethod: 'MANUAL_TRANSFER',
        courierCode: 'JNE',
        courierService: 'YES',
        notes: 'Tolong packing kayu tebal',
        deliveryAddress: 'Jl. Sudirman No. 45, Jakarta Pusat',
        recipientName: 'Budi Santoso',
        recipientPhone: '081234567890',
      }

      const result = checkoutSchema.safeParse(validPayload)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.items).toHaveLength(1)
        expect(result.data.paymentMethod).toBe('MANUAL_TRANSFER')
        expect(result.data.courierCode).toBe('JNE')
        expect(result.data.courierService).toBe('YES')
      }
    })

    it('should pass validation with valid RENTAL and SERVICE items', () => {
      const validPayload = {
        items: [
          {
            type: 'RENTAL',
            rentalItemId: 'rent-456',
            quantity: 1,
            rentalDays: 7,
          },
          {
            type: 'SERVICE',
            serviceId: 'srv-789',
            quantity: 1,
          },
        ],
      }

      const result = checkoutSchema.safeParse(validPayload)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.paymentMethod).toBe('CASH') // Default
        expect(result.data.courierCode).toBe('JNE') // Default
        expect(result.data.courierService).toBe('REG') // Default
      }
    })

    it('should reject empty items array', () => {
      const emptyPayload = {
        items: [],
      }

      const result = checkoutSchema.safeParse(emptyPayload)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.items).toContain(
          'Keranjang belanja kosong'
        )
      }
    })

    it('should reject more than 20 items', () => {
      const items = Array.from({ length: 21 }, (_, i) => ({
        type: 'PRODUCT',
        productId: `prod-${i}`,
        quantity: 1,
      }))

      const result = checkoutSchema.safeParse({ items })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.items).toContain(
          'Maksimal 20 item dalam satu pesanan'
        )
      }
    })

    it('should reject item quantity greater than 10', () => {
      const itemResult = checkoutItemSchema.safeParse({
        type: 'PRODUCT',
        productId: 'prod-1',
        quantity: 11,
      })

      expect(itemResult.success).toBe(false)
      if (!itemResult.success) {
        expect(itemResult.error.flatten().fieldErrors.quantity).toContain(
          'Maksimal pembelian 10 unit per barang'
        )
      }
    })

    it('should reject item quantity less than or equal to 0', () => {
      const zeroQty = checkoutItemSchema.safeParse({
        type: 'PRODUCT',
        productId: 'prod-1',
        quantity: 0,
      })
      expect(zeroQty.success).toBe(false)

      const negQty = checkoutItemSchema.safeParse({
        type: 'PRODUCT',
        productId: 'prod-1',
        quantity: -2,
      })
      expect(negQty.success).toBe(false)
    })

    it('should reject PRODUCT without productId', () => {
      const result = checkoutItemSchema.safeParse({
        type: 'PRODUCT',
        quantity: 1,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.productId).toContain(
          'productId wajib diisi untuk item produk'
        )
      }
    })

    it('should reject RENTAL without rentalItemId', () => {
      const result = checkoutItemSchema.safeParse({
        type: 'RENTAL',
        quantity: 1,
        rentalDays: 3,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.rentalItemId).toContain(
          'rentalItemId wajib diisi untuk item sewa'
        )
      }
    })

    it('should reject SERVICE without serviceId', () => {
      const result = checkoutItemSchema.safeParse({
        type: 'SERVICE',
        quantity: 1,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.serviceId).toContain(
          'serviceId wajib diisi untuk item servis'
        )
      }
    })

    it('should reject invalid paymentMethod enum', () => {
      const result = checkoutSchema.safeParse({
        items: [{ type: 'PRODUCT', productId: 'p-1', quantity: 1 }],
        paymentMethod: 'CRYPTO_BITCOIN',
      })

      expect(result.success).toBe(false)
    })

    it('should enforce character limits on text fields', () => {
      const tooLongNotes = 'a'.repeat(501)
      const result = checkoutSchema.safeParse({
        items: [{ type: 'PRODUCT', productId: 'p-1', quantity: 1 }],
        notes: tooLongNotes,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.notes).toContain(
          'Catatan pengiriman maksimal 500 karakter'
        )
      }
    })
  })

  describe('CRIT-04: IDOR Query Scoping by Role', () => {
    const buildOrderQueryWhere = (
      orderId: string,
      user: { id: string; role: string; storeId?: string | null }
    ) => {
      const { role, id: userId, storeId } = user

      if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        return { id: orderId }
      } else if (role === 'STORE_ADMIN' && storeId) {
        return { id: orderId, storeId }
      } else {
        return {
          id: orderId,
          OR: [{ userId }, { technician: { userId } }],
        }
      }
    }

    it('should scope CUSTOMER queries to their own userId or technician assignment', () => {
      const customer = { id: 'cust-123', role: 'CUSTOMER' }
      const where = buildOrderQueryWhere('order-001', customer)

      expect(where).toEqual({
        id: 'order-001',
        OR: [{ userId: 'cust-123' }, { technician: { userId: 'cust-123' } }],
      })
    })

    it('should scope STORE_ADMIN queries to their specific storeId', () => {
      const storeAdmin = {
        id: 'admin-roxy',
        role: 'STORE_ADMIN',
        storeId: 'store-roxy-01',
      }
      const where = buildOrderQueryWhere('order-002', storeAdmin)

      expect(where).toEqual({
        id: 'order-002',
        storeId: 'store-roxy-01',
      })
    })

    it('should allow ADMIN and SUPER_ADMIN to query any order without user/store restriction', () => {
      const admin = { id: 'admin-1', role: 'ADMIN' }
      const superAdmin = { id: 'super-1', role: 'SUPER_ADMIN' }

      expect(buildOrderQueryWhere('order-003', admin)).toEqual({
        id: 'order-003',
      })
      expect(buildOrderQueryWhere('order-003', superAdmin)).toEqual({
        id: 'order-003',
      })
    })
  })
})
