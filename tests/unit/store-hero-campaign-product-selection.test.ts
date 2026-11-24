import { describe, it, expect } from 'vitest'
import { resolveStorePageContent } from '@/lib/store-page-content'
import { StorePublicProfile } from '@/types/store-public'

describe('Store Hero & Campaign Target Product Selection with Sales Sorting', () => {
  const dummyProducts: any[] = [
    {
      id: 'prod-s24',
      name: 'Samsung Galaxy S24 Ultra',
      brand: 'Samsung',
      price: 18999000,
      images: ['https://images.example.com/s24.jpg'],
      soldCount: 5,
      rating: 4.9,
      totalReview: 10,
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'prod-fold',
      name: 'Samsung Galaxy Z Fold 5',
      brand: 'Samsung',
      price: 24999000,
      images: ['https://images.example.com/fold5.jpg'],
      soldCount: 28, // Paling banyak dibeli
      rating: 5.0,
      totalReview: 15,
      createdAt: '2026-01-02T00:00:00Z',
    },
    {
      id: 'prod-a55',
      name: 'Samsung Galaxy A55 5G',
      brand: 'Samsung',
      price: 5999000,
      images: ['https://images.example.com/a55.jpg'],
      soldCount: 12,
      rating: 4.8,
      totalReview: 20,
      createdAt: '2026-01-03T00:00:00Z',
    },
  ]

  const baseStore: StorePublicProfile = {
    id: 'store-1',
    name: 'Hafiyan Gadget',
    slug: 'hafiyan-gadget',
    city: 'Jakarta',
    rating: 5.0,
    totalReview: 45,
    products: dummyProducts,
    schedules: [],
  } as unknown as StorePublicProfile

  it('1. should resolve hero product and price matching heroProductId', () => {
    // Toko memilih Galaxy A55 sebagai hero
    const storeWithHero: StorePublicProfile = {
      ...baseStore,
      heroProductId: 'prod-a55',
      heroTitle: 'Promo Spesial A55',
    }

    const resolved = resolveStorePageContent(storeWithHero)

    // Harga hero harus menyesuaikan harga Galaxy A55 (Rp 5.999.000), bukan produk termahal
    expect(resolved.topFlagship?.id).toBe('prod-a55')
    expect(resolved.hero.priceText).toBe('Mulai Rp 5.999.000')
    expect(resolved.hero.title).toBe('Promo Spesial A55')
    // Jika heroImage tidak kustom, gunakan foto Galaxy A55
    expect(resolved.hero.desktopImage).toBe(
      'https://images.example.com/a55.jpg'
    )
  })

  it('2. should resolve campaign product matching campaignProductId for Buy Now button', () => {
    // Toko memilih Galaxy Z Fold 5 sebagai produk kampanye
    const storeWithCampaign: StorePublicProfile = {
      ...baseStore,
      campaignProductId: 'prod-fold',
    }

    const resolved = resolveStorePageContent(storeWithCampaign)

    expect(resolved.editorial1.campaignProduct).toBeDefined()
    expect(resolved.editorial1.campaignProduct?.id).toBe('prod-fold')
    expect(resolved.editorial1.campaignProduct?.name).toBe(
      'Samsung Galaxy Z Fold 5'
    )
    expect(resolved.editorial1.campaignProduct?.price).toBe(24999000)
  })

  it('3. should sort products by most purchased (soldCount descending) in store product collection', () => {
    const list = [...dummyProducts]

    const sorted = list.sort((a, b) => {
      const aSold = Number(a.soldCount) || 0
      const bSold = Number(b.soldCount) || 0
      if (bSold !== aSold) return bSold - aSold
      return 0
    })

    // Yang pertama harus Z Fold 5 (28 terjual), kedua A55 (12 terjual), ketiga S24 (5 terjual)
    expect(sorted[0].id).toBe('prod-fold')
    expect(sorted[1].id).toBe('prod-a55')
    expect(sorted[2].id).toBe('prod-s24')
  })
})
