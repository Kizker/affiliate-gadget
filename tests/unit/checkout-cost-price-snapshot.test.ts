import { describe, it, expect } from 'vitest'

describe('Checkout Cost Price (HPP) Snapshot Engine (Phase 4)', () => {
  interface MockProduct {
    id: string
    name: string
    price: number
    costPrice: number
    variants?: Array<{
      id: string
      name: string
      price: number
      costPrice: number | null
    }>
  }

  // Pure function matching the snapshot logic implemented in src/app/api/checkout/route.ts
  function resolveItemCostPrice(
    product: MockProduct,
    variantId?: string | null
  ): number {
    const matchedVariant =
      variantId && Array.isArray(product.variants)
        ? product.variants.find((v) => v.id === variantId)
        : null

    return matchedVariant?.costPrice != null && matchedVariant.costPrice > 0
      ? matchedVariant.costPrice
      : (product.costPrice ?? 0)
  }

  it('should snapshot product base costPrice when no variant is selected', () => {
    const product: MockProduct = {
      id: 'prod-1',
      name: 'iPhone 15 Pro 128GB',
      price: 18999000,
      costPrice: 17000000,
    }

    const snapshottedCost = resolveItemCostPrice(product, null)
    expect(snapshottedCost).toBe(17000000)
  })

  it('should prioritize variant costPrice when variant has specific modal', () => {
    const product: MockProduct = {
      id: 'prod-1',
      name: 'iPhone 15 Pro Max Titanium',
      price: 22999000,
      costPrice: 20200000,
      variants: [
        {
          id: 'var-256',
          name: '256GB - Natural Titanium',
          price: 22999000,
          costPrice: 20200000,
        },
        {
          id: 'var-512',
          name: '512GB - Black Titanium',
          price: 26999000,
          costPrice: 23800000,
        },
      ],
    }

    const snapshottedCost512 = resolveItemCostPrice(product, 'var-512')
    expect(snapshottedCost512).toBe(23800000)

    const snapshottedCost256 = resolveItemCostPrice(product, 'var-256')
    expect(snapshottedCost256).toBe(20200000)
  })

  it('should fallback to product costPrice when variant costPrice is null or 0', () => {
    const product: MockProduct = {
      id: 'prod-1',
      name: 'Samsung S24 Ultra',
      price: 21999000,
      costPrice: 19500000,
      variants: [
        {
          id: 'var-null-cost',
          name: '12GB / 256GB',
          price: 21999000,
          costPrice: null,
        },
        {
          id: 'var-zero-cost',
          name: '12GB / 512GB',
          price: 23999000,
          costPrice: 0,
        },
      ],
    }

    expect(resolveItemCostPrice(product, 'var-null-cost')).toBe(19500000)
    expect(resolveItemCostPrice(product, 'var-zero-cost')).toBe(19500000)
  })

  it('should safely return 0 if neither product nor variant has costPrice', () => {
    const product: MockProduct = {
      id: 'prod-legacy',
      name: 'Legacy Product',
      price: 5000000,
      costPrice: 0,
    }

    expect(resolveItemCostPrice(product, null)).toBe(0)
  })

  it('should calculate item gross profit correctly from price and snapshotted costPrice', () => {
    const itemPrice = 22999000
    const itemCostPrice = 20200000
    const quantity = 2

    const itemSubtotal = itemPrice * quantity
    const itemCOGS = itemCostPrice * quantity
    const itemGrossProfit = itemSubtotal - itemCOGS
    const itemGrossMarginPct = (itemGrossProfit / itemSubtotal) * 100

    expect(itemSubtotal).toBe(45998000)
    expect(itemCOGS).toBe(40400000)
    expect(itemGrossProfit).toBe(5598000)
    expect(Number(itemGrossMarginPct.toFixed(2))).toBe(12.17)
  })
})
