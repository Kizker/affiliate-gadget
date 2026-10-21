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

  it('2. should display top 4 best-selling smartphones without inner scroll (SectionFeaturedGadgets)', () => {
    const content = fs.readFileSync(featuredGadgetsPath, 'utf-8')

    // Verifikasi MAX_TOP_PHONES = 4 dan subtitle Top 4 HP terlaris
    expect(content).toContain('const MAX_TOP_PHONES = 4')
    expect(content).toContain('Top 4 HP terlaris bergaransi toko 30 hari')

    // Verifikasi tidak lagi menggunakan h-screen maupun inner scrollbar overflow-y-auto
    expect(content).not.toContain('h-screen flex-col overflow-hidden')
    expect(content).not.toContain('overflow-y-auto')
    expect(content).toContain(
      '<section className="bg-white py-10 dark:bg-slate-950 sm:py-14">'
    )
    expect(content).toContain('<div className="w-full">')
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
