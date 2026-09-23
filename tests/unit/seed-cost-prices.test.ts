// Unit Test: Integritas Harga Modal (HPP) & Biaya Packing (Fase 3)
import { describe, it, expect } from 'vitest'
import db from '@/lib/db'

describe('Cost Price Seeding & Data Integrity (Phase 3)', () => {
  it('should ensure all products have costPrice > 0', async () => {
    const products = await db.product.findMany({
      select: { id: true, name: true, price: true, costPrice: true },
    })
    expect(products.length).toBeGreaterThan(0)
    for (const prod of products) {
      expect(prod.costPrice).toBeGreaterThan(0)
      expect(prod.costPrice).toBeLessThan(prod.price)
    }
  })

  it('should ensure all product variants have valid costPrice', async () => {
    const variants = await db.productVariant.findMany({
      select: { id: true, name: true, price: true, costPrice: true },
    })
    expect(variants.length).toBeGreaterThan(0)
    for (const v of variants) {
      expect(v.costPrice).not.toBeNull()
      expect(v.costPrice!).toBeGreaterThan(0)
      expect(v.costPrice!).toBeLessThan(v.price)
    }
  })

  it('should ensure all order items have costPrice > 0', async () => {
    const items = await db.orderItem.findMany({
      where: { price: { gt: 0 } },
      select: { id: true, price: true, costPrice: true },
    })
    expect(items.length).toBeGreaterThan(0)
    for (const item of items) {
      expect(item.costPrice).toBeGreaterThan(0)
      expect(item.costPrice).toBeLessThanOrEqual(item.price)
    }
  })

  it('should ensure all stores have defaultPackingFee set to 5000', async () => {
    const stores = await db.store.findMany({
      select: { id: true, name: true, defaultPackingFee: true },
    })
    expect(stores.length).toBeGreaterThan(0)
    for (const store of stores) {
      expect(store.defaultPackingFee).toBe(5000)
    }
  })
})
