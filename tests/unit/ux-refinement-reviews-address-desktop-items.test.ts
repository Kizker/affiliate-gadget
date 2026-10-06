import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('UX Refinement: Reviews Modal, Address GPS Auto-fill & Desktop Checkout Items', () => {
  const reviewModalPath = path.resolve(
    __dirname,
    '../../src/components/gadget/product-review-modal.tsx'
  )
  const addressModalPath = path.resolve(
    __dirname,
    '../../src/components/customer/address-modal.tsx'
  )
  const checkoutPagePath = path.resolve(
    __dirname,
    '../../src/app/checkout/page.tsx'
  )

  it('ProductReviewModal should not have QUICK_TAGS or "+ Unggah Media" button', () => {
    const content = fs.readFileSync(reviewModalPath, 'utf-8')
    expect(content).not.toContain('Poin Kepuasan Produk (Pilih Cepat)')
    expect(content).not.toContain('QUICK_TAGS')
    expect(content).not.toContain('+ Unggah Media')
    expect(content).toContain('Lampirkan Foto & Video Unit')
    expect(content).toContain('+ Foto / Video')
  })

  it('AddressModal should support defaultRecipientName, useSession, and form noValidate without duplicate portals', () => {
    const addressContent = fs.readFileSync(addressModalPath, 'utf-8')
    expect(addressContent).toContain('defaultRecipientName')
    expect(addressContent).toContain('defaultPhone')
    expect(addressContent).toContain('useSession')
    expect(addressContent).toContain('noValidate')

    // In checkout page, verify only ONE AddressModal is rendered
    const checkoutContent = fs.readFileSync(checkoutPagePath, 'utf-8')
    const addressModalOccurrences = (
      checkoutContent.match(/<AddressModal/g) || []
    ).length
    expect(addressModalOccurrences).toBe(1)
  })

  it('Desktop Checkout should place "Produk yang Dipesan" at the top of the left column', () => {
    const checkoutContent = fs.readFileSync(checkoutPagePath, 'utf-8')
    const itemsPreviewIndex = checkoutContent.indexOf('Produk yang Dipesan')
    const addressSectionIndex =
      checkoutContent.indexOf(
        'Alamat &\\n                      Kurir Pengiriman'
      ) !== -1
        ? checkoutContent.indexOf(
            'Alamat &\\n                      Kurir Pengiriman'
          )
        : checkoutContent.indexOf('Alamat &')
    const paymentSectionIndex =
      checkoutContent.indexOf('Metode\\n                      Pembayaran') !==
      -1
        ? checkoutContent.indexOf('Metode\\n                      Pembayaran')
        : checkoutContent.indexOf('Metode')

    expect(itemsPreviewIndex).toBeGreaterThan(-1)
    expect(addressSectionIndex).toBeGreaterThan(-1)
    expect(itemsPreviewIndex).toBeLessThan(addressSectionIndex)
  })
})
