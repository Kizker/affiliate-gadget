import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Desktop Product Cards Wishlist Love Button Suite', () => {
  it('verifies desktop homepage featured gadgets has wishlist love button at top-right', () => {
    const filePath = path.join(
      process.cwd(),
      'src/components/landing/section-featured-gadgets.tsx'
    )
    const content = fs.readFileSync(filePath, 'utf-8')

    // Must import Heart, useWishlistSafe, and sonner toast
    expect(content).toContain('Heart')
    expect(content).toContain('useWishlistSafe')
    expect(content).toContain('toast')

    // Must have Wishlist Love Button at top-right
    expect(content).toContain('aria-label="Wishlist"')
    expect(content).toContain('isInWishlist(product.id)')
    expect(content).toContain('toggleWishlist')

    // Must have shifted rating capsule to top-left
    expect(content).toContain('absolute left-1.5 top-1.5')
  })

  it('verifies desktop gadget catalog grid has wishlist love button at top-right', () => {
    const filePath = path.join(process.cwd(), 'src/app/gadget/page.tsx')
    const content = fs.readFileSync(filePath, 'utf-8')

    // Must import Heart, useWishlistSafe, and sonner toast
    expect(content).toContain('Heart')
    expect(content).toContain('useWishlistSafe')
    expect(content).toContain('toast')

    // Must have Wishlist Love Button at top-right
    expect(content).toContain('aria-label="Wishlist"')
    expect(content).toContain('isInWishlist(item.id)')
    expect(content).toContain('toggleWishlist')

    // Must have shifted rating capsule to top-left
    expect(content).toContain('absolute left-1.5 top-1.5')
  })

  it('verifies shared ProductCard has wishlist love button at top-right', () => {
    const filePath = path.join(
      process.cwd(),
      'src/components/catalog/product-card.tsx'
    )
    const content = fs.readFileSync(filePath, 'utf-8')

    expect(content).toContain('Heart')
    expect(content).toContain('useWishlistSafe')
    expect(content).toContain('handleWishlistClick')
    expect(content).toContain('isWishlisted')
    expect(content).toContain('absolute right-3 top-3')
  })

  it('verifies store detail products have wishlist love button at top-right', () => {
    const clientPath = path.join(
      process.cwd(),
      'src/app/toko/[slug]/store-detail-client.tsx'
    )
    const filePath = fs.existsSync(clientPath)
      ? clientPath
      : path.join(process.cwd(), 'src/app/toko/[slug]/page.tsx')
    const content = fs.readFileSync(filePath, 'utf-8')

    expect(content).toContain('Heart')
    expect(content).toContain('useWishlistSafe')
    expect(content).toContain('toggleWishlist')
    expect(content).toContain('isInWishlist(item.id)')
    expect(content).toContain('aria-label="Wishlist"')
  })

  it('verifies navbar header does NOT have standalone wishlist button, and keeps it only in profile dropdown', () => {
    const filePath = path.join(
      process.cwd(),
      'src/components/layouts/navbar.tsx'
    )
    const content = fs.readFileSync(filePath, 'utf-8')

    // Profile dropdown must have Wishlist Saya
    expect(content).toContain('Wishlist Saya')
    expect(content).toContain('/dashboard/customer/wishlist')

    // Navbar header actions must NOT have standalone wishlist button between chat and cart
    expect(content).not.toContain('aria-label="Wishlist Saya"')
  })

  it('verifies standalone wishlist page places Kosongkan in header and hides redundant item counter banner', () => {
    const clientPath = path.join(
      process.cwd(),
      'src/app/dashboard/customer/wishlist/wishlist-client.tsx'
    )
    const clientContent = fs.readFileSync(clientPath, 'utf-8')

    // Must have Kosongkan button in header
    expect(clientContent).toContain('Kosongkan')
    expect(clientContent).toContain('handleClearAll')
    expect(clientContent).toContain('clearWishlist')

    const viewPath = path.join(
      process.cwd(),
      'src/components/customer/customer-wishlist-view.tsx'
    )
    const viewContent = fs.readFileSync(viewPath, 'utf-8')

    // Top Bar must only render when !isStandalonePage
    expect(viewContent).toContain('!isStandalonePage')
  })
})
