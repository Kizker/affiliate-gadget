import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { createLiveDeal, verifyDealToken } from '@/lib/live-deals'

describe('Live Stream Variant Dropdown & Locked Deal Suite', () => {
  it('1. createLiveDeal menyimpan variantId dan variantName ke dalam record deal', () => {
    const deal = createLiveDeal({
      streamId: 'stream-test-var-1',
      productId: 'prod-note-10',
      variantId: 'var-note-10-512',
      variantName: '512GB - Aura Glow',
      productTitle: 'Samsung Galaxy Note 10 Plus',
      originalPrice: 2850000,
      discountPrice: 2450000,
      dealType: 'PINNED_DEAL',
    })

    expect(deal.dealToken).toBeDefined()
    expect(deal.productId).toBe('prod-note-10')
    expect(deal.variantId).toBe('var-note-10-512')
    expect(deal.variantName).toBe('512GB - Aura Glow')
    expect(deal.originalPrice).toBe(2850000)
    expect(deal.discountPrice).toBe(2450000)

    const verification = verifyDealToken(deal.dealToken)
    expect(verification.valid).toBe(true)
    expect(verification.deal?.variantId).toBe('var-note-10-512')
    expect(verification.deal?.variantName).toBe('512GB - Aura Glow')
  })

  it('2. live-stream-broadcaster.tsx pada tahap setup memiliki dropdown pemilihan varian produk dan kalkulasi harga varian', () => {
    const broadcasterPath = path.join(
      process.cwd(),
      'src/components/live/live-stream-broadcaster.tsx'
    )
    const content = fs.readFileSync(broadcasterPath, 'utf-8')

    // State setupVariants
    expect(content).toContain('setupVariants')
    expect(content).toContain('setSetupVariants')

    // Dropdown pemilihan varian di setup form
    expect(content).toContain('Pilih Varian Diskon Live:')
    expect(content).toContain('p.variants.map((v)')
    expect(content).toContain('setupVariants[p.id]')

    // Deal payload menyertakan variantId dan variantName
    expect(content).toContain('variantId: chosenVar?.id || null')
    expect(content).toContain('variantName: chosenVar?.name || null')
  })

  it('3. live-stream-broadcaster.tsx pada modal sematan (Pin Modal) memiliki dropdown varian dan menyematkan varian terpilih', () => {
    const broadcasterPath = path.join(
      process.cwd(),
      'src/components/live/live-stream-broadcaster.tsx'
    )
    const content = fs.readFileSync(broadcasterPath, 'utf-8')

    expect(content).toContain('pinModalVariantId')
    expect(content).toContain('setPinModalVariantId')
    expect(content).toContain('Pilih Varian yang Disematkan:')
    expect(content).toContain('pinModalProduct.variants.map((v)')
    expect(content).toContain(
      'handlePinProduct(pinModalProduct, discountPrice, chosenVariant)'
    )
  })

  it('4. LiveProductPin dan live-stream-viewer.tsx menampilkan badge varian dan menyematkan parameter variantId pada tautan beli', () => {
    const pinCardPath = path.join(
      process.cwd(),
      'src/components/live/live-product-pin.tsx'
    )
    const pinContent = fs.readFileSync(pinCardPath, 'utf-8')

    expect(pinContent).toContain('product.variantName')
    expect(pinContent).toContain('product.variantId')

    const viewerPath = path.join(
      process.cwd(),
      'src/components/live/live-stream-viewer.tsx'
    )
    const viewerContent = fs.readFileSync(viewerPath, 'utf-8')

    expect(viewerContent).toContain('pinnedProduct.variantName')
    expect(viewerContent).toContain('pinnedProduct.variantId')
  })

  it('5. gadget-detail-client.tsx otomatis mengunci selectedVariant ke deal.variantId dan hanya menerapkan diskon pada varian terkunci', () => {
    const detailClientPath = path.join(
      process.cwd(),
      'src/app/gadget/[id]/gadget-detail-client.tsx'
    )
    const content = fs.readFileSync(detailClientPath, 'utf-8')

    expect(content).toContain('json.deal.variantId')
    expect(content).toContain('isDealVariantMatched')
    expect(content).toContain(
      '!activeDeal?.variantId || activeDeal.variantId === selectedVariant?.id'
    )
    expect(content).toContain('Terkunci khusus varian:')
  })

  it('6. POST /api/checkout dan checkout page memvalidasi bahwa diskon live deal terkunci pada variantId yang tepat', () => {
    const checkoutApiPath = path.join(
      process.cwd(),
      'src/app/api/checkout/route.ts'
    )
    const apiContent = fs.readFileSync(checkoutApiPath, 'utf-8')

    expect(apiContent).toContain(
      '(!deal.variantId || vi.raw.variantId === deal.variantId)'
    )
    expect(apiContent).toContain(
      'Diskon live deal ini hanya berlaku khusus untuk varian'
    )

    const checkoutPagePath = path.join(
      process.cwd(),
      'src/app/checkout/page.tsx'
    )
    const pageContent = fs.readFileSync(checkoutPagePath, 'utf-8')

    expect(pageContent).toContain('isLiveDealVariantMatched')
    expect(pageContent).toContain('buyNowItem.variantId !== deal.variantId')
  })
})
