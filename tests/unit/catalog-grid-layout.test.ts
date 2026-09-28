import { describe, it, expect } from 'vitest'
import {
  assembleCatalogGridItems,
  buildPaginatedCatalogGrid,
  CatalogGridItem,
} from '@/lib/catalog-grid-layout'
import { InFeedAdData } from '@/types/ads'

describe('assembleCatalogGridItems Suite', () => {
  const mockProducts = Array.from({ length: 12 }, (_, i) => ({
    id: `prod-${i + 1}`,
    name: `Gadget ${i + 1}`,
    price: 5000000 + i * 500000,
  }))

  const mockStoreBannerAd: InFeedAdData = {
    id: 'ad-banner-1',
    title: 'Diskon Spesial BEC Bandung',
    imageUrl: 'https://example.com/banner.jpg',
    store: {
      name: 'PT Digital Niaga Prima',
      slug: 'bec-bandung',
      city: 'Bandung',
    },
  }

  const mockProductAd: InFeedAdData = {
    id: 'ad-product-1',
    title: 'iPhone 15 Pro Max',
    imageUrl: 'https://example.com/iphone.jpg',
    productId: 'prod-iphone-15',
    targetUrl: '/gadget/prod-iphone-15',
    store: {
      name: 'PT Gadget Jaya Sentosa',
      slug: 'roxy-mas',
      city: 'Jakarta',
    },
    product: {
      id: 'prod-iphone-15',
      name: 'iPhone 15 Pro Max',
      price: 18000000,
    },
  }

  it('should assemble regular products into perfect 4-column rows', () => {
    const items = assembleCatalogGridItems(mockProducts.slice(0, 8), [])
    expect(items).toHaveLength(8)
    expect(items.every((it) => it.type === 'product')).toBe(true)
  })

  it('should place store banner ad (span 2) only when 2 slots remain to complete a 4-col row', () => {
    const items = assembleCatalogGridItems(mockProducts, [mockStoreBannerAd])

    // Row 1 should be: Product 1 (span 1), Product 2 (span 1), Store Banner (span 2) -> Total 4 span!
    expect(items[0].type).toBe('product')
    expect(items[1].type).toBe('product')
    expect(items[2].type).toBe('ad')
    expect((items[2] as any).isProductAd).toBe(false)

    // Row 2 starts with Product 3 (span 1)
    expect(items[3].type).toBe('product')
  })

  it('should place promoted product ad (span 1) without disrupting 4-col row', () => {
    const items = assembleCatalogGridItems(mockProducts, [mockProductAd])

    expect(items[0].type).toBe('product')
    expect(items[1].type).toBe('ad')
    expect((items[1] as any).isProductAd).toBe(true)
    expect(items[2].type).toBe('product')
    expect(items[3].type).toBe('product')
    // Total 4 items on Row 1 (all span 1 = 4)
  })

  it('should calculate total spans per row as strictly multiples of 4', () => {
    const mixedAds: InFeedAdData[] = [
      mockProductAd,
      mockStoreBannerAd,
      {
        ...mockStoreBannerAd,
        id: 'ad-banner-2',
        title: 'Promo WTC Surabaya',
      },
    ]

    const items = assembleCatalogGridItems(mockProducts, mixedAds)

    let currentSpan = 0
    let rowCount = 0

    items.forEach((item) => {
      const span = item.type === 'ad' && !(item as any).isProductAd ? 2 : 1
      currentSpan += span
      if (currentSpan === 4) {
        rowCount++
        currentSpan = 0
      }
    })

    // If there is a remainder, it should only be because products finished
    expect([0, 1, 2, 3]).toContain(currentSpan)
    expect(rowCount).toBeGreaterThanOrEqual(2)
  })

  it('buildPaginatedCatalogGrid should guarantee exact 12 spans for page 1 without incomplete rows', () => {
    // 1 store banner (span 2) + 20 products
    const pageData = buildPaginatedCatalogGrid(
      mockProducts,
      [mockStoreBannerAd],
      1,
      12
    )

    let totalSpan = 0
    pageData.items.forEach((item) => {
      const span = item.type === 'ad' && !(item as any).isProductAd ? 2 : 1
      totalSpan += span
    })

    // Exactly 12 spans = 3 full rows of 4 columns!
    expect(totalSpan).toBe(12)
    expect(totalSpan % 4).toBe(0)
  })
})
