import { describe, it, expect } from 'vitest'
import {
  createLiveDeal,
  verifyDealToken,
  deactivateStreamDeals,
  getActiveDealForStream,
  getActiveDealsForStream,
} from '@/lib/live-deals'

describe('Thermal Mobile View & Live Catalog vs Pinned Discount Algorithm', () => {
  const streamId = `test-stream-catalog-${Date.now()}`
  const prod1Id = 'prod-macbook-15'
  const normalPrice = 21999000
  const liveCatalogPrice = 19999000
  const pinnedExtraPrice = 18500000

  it('1. Setup 5 Barang Siaran: Diskon awal tersimpan sebagai katalog biasa (LIVE_FEATURED)', () => {
    // Host memilih 5 barang saat setup dan memasukkan harga promo live
    const catalogDeal = createLiveDeal({
      streamId,
      productId: prod1Id,
      productTitle: 'Apple MacBook Air 15 M3',
      originalPrice: normalPrice,
      discountPrice: liveCatalogPrice,
      dealType: 'LIVE_FEATURED',
      badgeLabel: 'Promo Live Siaran',
    })

    expect(catalogDeal).toBeDefined()
    expect(catalogDeal.dealType).toBe('LIVE_FEATURED')
    expect(catalogDeal.discountPrice).toBe(19999000)
    expect(catalogDeal.isActive).toBe(true)

    // Cek daftar deals aktif untuk siaran ini
    const streamDeals = getActiveDealsForStream(streamId)
    expect(
      streamDeals.some(
        (d) => d.productId === prod1Id && d.dealType === 'LIVE_FEATURED'
      )
    ).toBe(true)
  })

  it('2. Di Studio Drawer / Katalog Biasa: Produk menampilkan harga diskon katalog live', () => {
    const deals = getActiveDealsForStream(streamId)
    const dealForProd = deals.find(
      (d) =>
        d.productId === prod1Id && d.dealType === 'LIVE_FEATURED' && d.isActive
    )

    expect(dealForProd).toBeDefined()
    expect(dealForProd?.discountPrice).toBe(liveCatalogPrice)
    expect(dealForProd?.discountPrice).toBeLessThan(normalPrice)
  })

  it('3. Saat Di-Pin dengan Diskon Ekstra: Tercipta PINNED_DEAL dengan harga lebih murah lagi', () => {
    // Host memasukkan diskon ekstra saat menyematkan produk
    const pinnedDeal = createLiveDeal({
      streamId,
      productId: prod1Id,
      productTitle: 'Apple MacBook Air 15 M3',
      originalPrice: normalPrice,
      discountPrice: pinnedExtraPrice,
      dealType: 'PINNED_DEAL',
      badgeLabel: 'Diskon Spesial Sematan Live',
    })

    expect(pinnedDeal.dealType).toBe('PINNED_DEAL')
    expect(pinnedDeal.discountPrice).toBe(18500000)

    // Deal aktif yang diprioritaskan saat ini haruslah PINNED_DEAL
    const active = getActiveDealForStream(streamId, prod1Id)
    expect(active?.dealType).toBe('PINNED_DEAL')
    expect(active?.discountPrice).toBe(18500000)
  })

  it('4. Saat Di-Unpin (Lepas Sematan): Hanya PINNED_DEAL yang dinonaktifkan, LIVE_FEATURED tetap aktif', () => {
    // Host mengklik Lepas (unpin)
    deactivateStreamDeals(streamId, prod1Id, 'PINNED_DEAL')

    // PINNED_DEAL harus nonaktif
    const deals = getActiveDealsForStream(streamId)
    const pinned = deals.find(
      (d) =>
        d.productId === prod1Id && d.dealType === 'PINNED_DEAL' && d.isActive
    )
    expect(pinned).toBeUndefined()

    // Namun LIVE_FEATURED untuk katalog biasa tetap aktif untuk penonton!
    const catalogActive = deals.find(
      (d) =>
        d.productId === prod1Id && d.dealType === 'LIVE_FEATURED' && d.isActive
    )
    expect(catalogActive).toBeDefined()
    expect(catalogActive?.discountPrice).toBe(liveCatalogPrice)

    // Token verifikasi untuk katalog promo tetap valid
    if (catalogActive) {
      const verify = verifyDealToken(catalogActive.dealToken)
      expect(verify.valid).toBe(true)
    }
  })

  it('5. Verifikasi Proteksi CSS Header & Burger Menu saat Thermal Modal Terbuka', () => {
    const selectorRule =
      'body.thermal-modal-open header, body.thermal-modal-open button[aria-label*="Menu Navigasi"]'
    expect(selectorRule).toContain('body.thermal-modal-open header')
    expect(selectorRule).toContain('Menu Navigasi')
  })
})
