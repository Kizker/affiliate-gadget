import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Gadget Catalog Phase 2 Lighthouse 100 Suite', () => {
  it('1. MobileTopHeroBanner has base Image, deferred video on interaction, and caption tracks', () => {
    const bannerPath = path.join(
      process.cwd(),
      'src/components/ads/mobile-top-hero-banner.tsx'
    )
    const content = fs.readFileSync(bannerPath, 'utf-8')

    // Must have deferred video state and interaction listeners
    expect(content).toContain('canLoadVideo')
    expect(content).toContain("window.addEventListener('scroll', enableVideo")
    expect(content).toContain(
      "window.addEventListener('touchstart', enableVideo"
    )

    // Must always render base Image for instant LCP
    expect(content).toContain('Base Poster Layer')
    expect(content).toContain('priority={idx === 0}')

    // Must include captions track and labels for accessibility
    expect(content).toContain(
      '<track kind="captions" src="/captions/live-empty.vtt" />'
    )
    expect(content).toContain("title={slide.title || 'Video Promo Iklan Toko'}")
    expect(content).toContain(
      "aria-label={slide.title || 'Video Promo Iklan Toko'}"
    )
  })

  it('2. InFeedStoreAdCard has base Image, deferred video, and caption tracks', () => {
    const adCardPath = path.join(
      process.cwd(),
      'src/components/ads/in-feed-store-ad-card.tsx'
    )
    const content = fs.readFileSync(adCardPath, 'utf-8')

    expect(content).toContain('canLoadVideo')
    expect(content).toContain('Base Poster Layer')
    expect(content).toContain(
      '<track kind="captions" src="/captions/live-empty.vtt" />'
    )
    expect(content).toContain("title={ad.title || 'Video Promo Iklan Toko'}")
  })

  it('3. MobileCatalogView has un-nested wishlist button, semantic h1, and img dimensions', () => {
    const mobileViewPath = path.join(
      process.cwd(),
      'src/components/gadget/mobile-catalog-view.tsx'
    )
    const content = fs.readFileSync(mobileViewPath, 'utf-8')

    // Semantic h1
    expect(content).toContain(
      '<h1 className="text-sm font-extrabold text-slate-950 dark:text-white">'
    )
    expect(content).toContain('ariaLabel="Urutkan katalog smartphone"')

    // Image explicit dimensions
    expect(content).toContain('width={300}')
    expect(content).toContain('height={300}')

    // Wishlist button outside link (must appear before <Link)
    const btnIndex = content.indexOf('Positioned absolutely outside Link')
    const linkIndex = content.indexOf('href={`/gadget/${item.id}`}')
    expect(btnIndex).toBeGreaterThan(0)
    expect(btnIndex).toBeLessThan(linkIndex)
  })

  it('4. MobileBottomNav has accessible labels on all navigation tabs', () => {
    const bottomNavPath = path.join(
      process.cwd(),
      'src/components/layouts/mobile-bottom-nav.tsx'
    )
    const content = fs.readFileSync(bottomNavPath, 'utf-8')

    expect(content).toContain('aria-label="Beranda Katalog Gadget"')
    expect(content).toContain('aria-label="Layanan Servis Gadget"')
    expect(content).toContain('aria-label="Daftar Toko Cabang"')
    expect(content).toContain('aria-label="Keranjang Belanja"')
  })

  it('5. Gadget page gates mobile vs desktop mount to eliminate double mount and has h1', () => {
    const pagePath = path.join(process.cwd(), 'src/app/gadget/page.tsx')
    const content = fs.readFileSync(pagePath, 'utf-8')

    expect(content).toContain('useIsMobile')
    expect(content).toContain('(!mounted || isMobile)')
    expect(content).toContain('(!mounted || !isMobile)')
    expect(content).toContain(
      'Katalog Smartphone & Gadget Original Garansi 30 Hari'
    )
    expect(content).toContain('aria-label="Halaman sebelumnya"')
    expect(content).toContain('aria-label="Halaman selanjutnya"')
  })
})
