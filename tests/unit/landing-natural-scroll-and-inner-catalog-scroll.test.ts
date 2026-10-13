import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Landing Page Natural Scroll & Inner Catalog Scroll Verification', () => {
  const homePagePath = path.join(process.cwd(), 'src/app/page.tsx')
  const featuredGadgetsPath = path.join(
    process.cwd(),
    'src/components/landing/section-featured-gadgets.tsx'
  )

  it('1. should remove snap scroll (snap-container) from homepage root (src/app/page.tsx)', () => {
    const content = fs.readFileSync(homePagePath, 'utf-8')

    // Verifikasi snap-container telah dihilangkan dari halaman beranda
    expect(content).not.toContain('id="snap-container"')
    expect(content).not.toContain('h-screen overflow-y-scroll bg-white')
    expect(content).not.toContain('scroll snap container')

    // Menggunakan semantik main dengan natural scroll
    expect(content).toContain('<main className="min-h-screen')
    expect(content).toContain('<SectionFeaturedGadgets />')
  })

  it('2. should restore inner scroll (overflow-y-auto) on desktop catalog section (SectionFeaturedGadgets)', () => {
    const content = fs.readFileSync(featuredGadgetsPath, 'utf-8')

    // Verifikasi struktur section h-screen dengan inner scroll
    expect(content).toContain(
      '<section className="flex h-screen flex-col overflow-hidden bg-white pt-16 dark:bg-slate-950">'
    )
    expect(content).toContain(
      '<div className="min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-color:#e2e8f0_transparent] [scrollbar-width:thin]">'
    )

    // Memastikan header tetap sticky/fixed di atas dalam flex-col
    expect(content).toContain('shrink-0 space-y-3')
  })

  it('3. should preserve wishlist toggle, ratings, and stock indicators inside the product cards', () => {
    const content = fs.readFileSync(featuredGadgetsPath, 'utf-8')

    expect(content).toContain('toggleWishlist')
    expect(content).toContain('useWishlistSafe')
    expect(content).toContain('Heart')
    expect(content).toContain('Star')
    expect(content).toContain('displayedProducts.map')
  })
})
