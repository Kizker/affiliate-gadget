import { describe, it, expect, beforeEach } from 'vitest'
import {
  createLiveDeal,
  verifyDealToken,
  consumeDealToken,
  hasUserUsedStreamDeal,
  getActiveDealForStream,
  getActiveDealsForStream,
  deactivateStreamDeals,
} from '@/lib/live-deals'

describe('Sistem Diskon Live Stream & Sematan (Single-Use Checkout)', () => {
  const streamId = `stream_test_${Date.now()}_${Math.random().toString(36).substring(7)}`
  const prodId = 'prod_macbook_m3'

  beforeEach(() => {
    // Nonaktifkan semua deal uji sebelumnya
    deactivateStreamDeals(streamId)
  })

  it('1. Dapat membuat Diskon Siaran Live (LIVE_FEATURED) untuk etalase produk', () => {
    const liveDeal = createLiveDeal({
      streamId,
      productId: prodId,
      productTitle: 'MacBook Air 15 M3',
      originalPrice: 21999000,
      discountPrice: 20000000,
      dealType: 'LIVE_FEATURED',
      badgeLabel: 'Diskon Khusus Siaran Live',
    })

    expect(liveDeal.dealToken).toContain('deal_live_')
    expect(liveDeal.dealType).toBe('LIVE_FEATURED')
    expect(liveDeal.discountPrice).toBe(20000000)
    expect(liveDeal.isActive).toBe(true)
    expect(liveDeal.isUsed).toBe(false)

    const verification = verifyDealToken(liveDeal.dealToken)
    expect(verification.valid).toBe(true)
    expect(verification.deal?.dealType).toBe('LIVE_FEATURED')
  })

  it('2. Dapat membuat Diskon Khusus Sematan (PINNED_DEAL) yang berbeda saat produk disematkan', () => {
    // Diskon live umum di etalase: 20.000.000
    const liveDeal = createLiveDeal({
      streamId,
      productId: prodId,
      productTitle: 'MacBook Air 15 M3',
      originalPrice: 21999000,
      discountPrice: 20000000,
      dealType: 'LIVE_FEATURED',
    })

    // Diskon sematan khusus pin: 19.500.000 (diskon lebih miring lagi)
    const pinnedDeal = createLiveDeal({
      streamId,
      productId: prodId,
      productTitle: 'MacBook Air 15 M3',
      originalPrice: 21999000,
      discountPrice: 19500000,
      dealType: 'PINNED_DEAL',
      badgeLabel: 'Diskon Spesial Sematan Live',
    })

    expect(pinnedDeal.dealToken).toContain('deal_pin_')
    expect(pinnedDeal.dealType).toBe('PINNED_DEAL')
    expect(pinnedDeal.discountPrice).toBe(19500000)

    // getActiveDealForStream memprioritaskan diskon sematan PINNED_DEAL
    const active = getActiveDealForStream(streamId, prodId)
    expect(active?.dealType).toBe('PINNED_DEAL')
    expect(active?.discountPrice).toBe(19500000)

    // Unpin hanya menonaktifkan PINNED_DEAL, LIVE_FEATURED tetap aktif
    deactivateStreamDeals(streamId, prodId, 'PINNED_DEAL')
    const fallbackActive = getActiveDealForStream(streamId, prodId)
    expect(fallbackActive?.dealType).toBe('LIVE_FEATURED')
    expect(fallbackActive?.discountPrice).toBe(20000000)
  })

  it('3. Diskon hanya bisa dipakai 1 kali checkout dan langsung hangus setelah digunakan', () => {
    const pinnedDeal = createLiveDeal({
      streamId,
      productId: prodId,
      originalPrice: 21999000,
      discountPrice: 19500000,
      dealType: 'PINNED_DEAL',
    })

    const token = pinnedDeal.dealToken
    const userId = `user_customer_${Date.now()}_${Math.random().toString(36).substring(7)}`

    // Sebelum checkout: valid
    expect(verifyDealToken(token).valid).toBe(true)
    expect(hasUserUsedStreamDeal(userId, streamId, prodId)).toBe(false)

    // Konsumsi saat order checkout berhasil dibuat
    const consumed = consumeDealToken(token, 'order_123', userId)
    expect(consumed).toBe(true)

    // Percobaan checkout kedua: ditolak karena status USED
    const secondCheck = verifyDealToken(token)
    expect(secondCheck.valid).toBe(false)
    expect(secondCheck.reason).toBe('USED')

    // Validasi policy 1x checkout per user tercatat
    expect(hasUserUsedStreamDeal(userId, streamId, prodId)).toBe(true)
  })
})
