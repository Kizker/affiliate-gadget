import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Gadget Catalog Performance & Accessibility Suite', () => {
  it('1. MobileTopHeroBanner uses poster image, preload none, and priority sizes', () => {
    const bannerPath = path.join(
      process.cwd(),
      'src/components/ads/mobile-top-hero-banner.tsx'
    )
    const content = fs.readFileSync(bannerPath, 'utf-8')

    expect(content).toContain('poster={slide.image}')
    expect(content).toContain('preload="none"')
    expect(content).toContain('sizes="(max-width: 768px) 100vw, 1200px"')
    expect(content).toContain('-poster.webp')
  })

  it('2. InFeedStoreAdCard uses poster, preload none, and companion poster fallback', () => {
    const adCardPath = path.join(
      process.cwd(),
      'src/components/ads/in-feed-store-ad-card.tsx'
    )
    const content = fs.readFileSync(adCardPath, 'utf-8')

    expect(content).toContain('poster={bannerImage}')
    expect(content).toContain('preload="none"')
    expect(content).toContain('-poster.webp')
  })

  it('3. Gadget page preloads initial items and has proper accessibility labels', () => {
    const pagePath = path.join(process.cwd(), 'src/app/gadget/page.tsx')
    const content = fs.readFileSync(pagePath, 'utf-8')

    expect(content).toContain('INITIAL_CATALOG_GADGETS')
    expect(content).toContain(
      'aria-label="Cari iPhone, Samsung, Xiaomi atau model smartphone"'
    )
    expect(content).toContain('aria-label="Hapus kata kunci pencarian"')
    expect(content).toContain('ariaLabel="Urutkan katalog smartphone"')
    expect(content).toContain('priority={idx < 4}')
  })

  it('4. CustomSelect provides aria-label to SelectTrigger', () => {
    const selectPath = path.join(
      process.cwd(),
      'src/components/ui/custom-select.tsx'
    )
    const content = fs.readFileSync(selectPath, 'utf-8')

    expect(content).toContain('ariaLabel?: string')
    expect(content).toContain(
      "aria-label={ariaLabel || placeholder || 'Pilih opsi'}"
    )
  })

  it('5. MobileCatalogView contains accessible search and filter buttons', () => {
    const mobileViewPath = path.join(
      process.cwd(),
      'src/components/gadget/mobile-catalog-view.tsx'
    )
    const content = fs.readFileSync(mobileViewPath, 'utf-8')

    expect(content).toContain(
      'aria-label="Cari tipe iPhone, Galaxy, Xiaomi atau model smartphone"'
    )
    expect(content).toContain('aria-label="Hapus kata kunci pencarian"')
    expect(content).toContain('aria-label="Urutkan dan filter produk katalog"')
  })
})
