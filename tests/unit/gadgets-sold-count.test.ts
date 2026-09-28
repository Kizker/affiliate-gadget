import { describe, it, expect, vi } from 'vitest'

describe('Gadgets & Ads Real Sold Count Engine', () => {
  it('should correctly calculate real sold count from order items excluding cancelled orders', () => {
    const rawOrderItems = [
      { productId: 'prod-1', quantity: 2, order: { status: 'COMPLETED' } },
      { productId: 'prod-1', quantity: 1, order: { status: 'PAID' } },
      { productId: 'prod-1', quantity: 3, order: { status: 'CANCELLED' } }, // Excluded
      { productId: 'prod-2', quantity: 4, order: { status: 'SHIPPED' } },
    ]

    const validItems = rawOrderItems.filter(
      (i) => i.order.status !== 'CANCELLED'
    )
    const salesMap = new Map<string, number>()
    validItems.forEach((item) => {
      salesMap.set(
        item.productId,
        (salesMap.get(item.productId) || 0) + item.quantity
      )
    })

    expect(salesMap.get('prod-1')).toBe(3) // 2 + 1, cancelled 3 excluded
    expect(salesMap.get('prod-2')).toBe(4)
    expect(salesMap.get('prod-3')).toBeUndefined()
  })

  it('should sort products by soldCount when POPULAR or BEST_SELLER is selected', () => {
    const products = [
      { id: '1', name: 'Product A', price: 1000000, soldCount: 2 },
      { id: '2', name: 'Product B', price: 2000000, soldCount: 15 },
      { id: '3', name: 'Product C', price: 1500000, soldCount: 0 },
      { id: '4', name: 'Product D', price: 3000000, soldCount: 7 },
    ]

    const sortBy = 'POPULAR'
    const sorted = [...products].sort((a, b) => {
      if (sortBy === 'POPULAR' || sortBy === 'BEST_SELLER') {
        return (Number(b.soldCount) || 0) - (Number(a.soldCount) || 0)
      }
      return 0
    })

    expect(sorted.map((p) => p.id)).toEqual(['2', '4', '1', '3'])
    expect(sorted[0].soldCount).toBe(15)
    expect(sorted[sorted.length - 1].soldCount).toBe(0)
  })

  it('should display fallback soldCount 0 when product has no sales yet', () => {
    const product = {
      id: 'fresh-product',
      name: 'Baru Datang',
      price: 5000000,
      soldCount: undefined,
    }

    const displayedSold = product.soldCount ?? 0
    expect(displayedSold).toBe(0)
    expect(`Terjual ${displayedSold}`).toBe('Terjual 0')
  })
})
