import { describe, it, expect } from 'vitest'
import db from '@/lib/db'

describe('Database Live Column Connectivity (Phase 2)', () => {
  it('should query Store and retrieve defaultPackingFee', async () => {
    const store = await db.store.findFirst({
      select: {
        id: true,
        name: true,
        defaultPackingFee: true,
      },
    })
    if (store) {
      expect(typeof store.defaultPackingFee).toBe('number')
      expect(store.defaultPackingFee).toBeGreaterThanOrEqual(0)
    } else {
      expect(true).toBe(true)
    }
  })

  it('should query Product and retrieve costPrice', async () => {
    const product = await db.product.findFirst({
      select: {
        id: true,
        name: true,
        costPrice: true,
      },
    })
    if (product) {
      expect(typeof product.costPrice).toBe('number')
      expect(product.costPrice).toBeGreaterThanOrEqual(0)
    } else {
      expect(true).toBe(true)
    }
  })

  it('should query ProductVariant and retrieve costPrice', async () => {
    const variant = await db.productVariant.findFirst({
      select: {
        id: true,
        name: true,
        costPrice: true,
      },
    })
    if (variant) {
      expect(
        variant.costPrice === null || typeof variant.costPrice === 'number'
      ).toBe(true)
    } else {
      expect(true).toBe(true)
    }
  })

  it('should query OrderItem and retrieve costPrice', async () => {
    const orderItem = await db.orderItem.findFirst({
      select: {
        id: true,
        costPrice: true,
      },
    })
    if (orderItem) {
      expect(typeof orderItem.costPrice).toBe('number')
      expect(orderItem.costPrice).toBeGreaterThanOrEqual(0)
    } else {
      expect(true).toBe(true)
    }
  })
})
