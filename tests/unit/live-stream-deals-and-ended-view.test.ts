import { describe, it, expect, beforeEach } from 'vitest'
import {
  createLiveDeal,
  verifyDealToken,
  consumeDealToken,
  deactivateStreamDeals,
  getActiveDealForStream,
} from '@/lib/live-deals'

describe('Live Deals & Single-Use Discount Protection', () => {
  const streamId = `test-stream-${Date.now()}`
  const productId = 'prod-123'
  const originalPrice = 21999000
  const discountPrice = 19999000

  it('1. Host dapat membuat diskon live saat menyematkan produk', () => {
    const deal = createLiveDeal({
      streamId,
      productId,
      productTitle: 'Samsung Galaxy S24 Ultra',
      originalPrice,
      discountPrice,
    })

    expect(deal).toBeDefined()
    expect(deal.dealToken).toMatch(/^deal_/)
    expect(deal.isActive).toBe(true)
    expect(deal.isUsed).toBe(false)
    expect(deal.discountPrice).toBe(19999000)
    expect(deal.originalPrice).toBe(21999000)

    // Periksa pengambilan deal aktif
    const active = getActiveDealForStream(streamId)
    expect(active?.dealToken).toBe(deal.dealToken)
  })

  it('2. Penonton dapat memverifikasi deal token yang aktif', () => {
    const deal = createLiveDeal({
      streamId,
      productId,
      productTitle: 'Samsung Galaxy S24 Ultra',
      originalPrice,
      discountPrice,
    })

    const verification = verifyDealToken(deal.dealToken)
    expect(verification.valid).toBe(true)
    expect(verification.deal?.dealToken).toBe(deal.dealToken)
    expect(verification.deal?.discountPrice).toBe(19999000)
  })

  it('3. Diskon hilang saat host melepas sematan barang (unpin)', () => {
    const deal = createLiveDeal({
      streamId,
      productId,
      productTitle: 'Samsung Galaxy S24 Ultra',
      originalPrice,
      discountPrice,
    })

    // Host unpin barang
    deactivateStreamDeals(streamId, productId)

    const verification = verifyDealToken(deal.dealToken)
    expect(verification.valid).toBe(false)
    expect(verification.reason).toBe('INACTIVE')
  })

  it('4. Proteksi Single-Use: Link diskon hanya bisa dipakai sekali saat checkout dan dibayar', () => {
    const deal = createLiveDeal({
      streamId,
      productId,
      productTitle: 'Samsung Galaxy S24 Ultra',
      originalPrice,
      discountPrice,
    })

    // Penggunaan pertama saat checkout
    const consumed = consumeDealToken(deal.dealToken, 'order-001', 'user-abc')
    expect(consumed).toBe(true)

    // Percobaan penggunaan kedua kali (misal link dibagikan lagi atau di-checkout ulang)
    const secondVerification = verifyDealToken(deal.dealToken)
    expect(secondVerification.valid).toBe(false)
    expect(secondVerification.reason).toBe('USED')

    // Percobaan consume ulang harus gagal
    const secondConsume = consumeDealToken(
      deal.dealToken,
      'order-002',
      'user-xyz'
    )
    expect(secondConsume).toBe(false)
  })

  it('5. Token yang tidak terdaftar otomatis ditolak', () => {
    const verification = verifyDealToken('non-existent-token')
    expect(verification.valid).toBe(false)
    expect(verification.reason).toBe('NOT_FOUND')
  })
})
