import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Gadget Catalog Phase 5 Mobile Lighthouse 90+ Suite', () => {
  it('1. MobileTopHeroBanner matches active live poster 1790671997412-zuzb6l-poster.webp on frame 1', () => {
    const bannerPath = path.join(
      process.cwd(),
      'src/components/ads/mobile-top-hero-banner.tsx'
    )
    const content = fs.readFileSync(bannerPath, 'utf-8')

    // Must default to active DB ad poster to eliminate 3,350ms delay
    expect(content).toContain('1790671997412-zuzb6l-poster.webp')
    expect(content).toContain('1790671997412-zuzb6l.mp4')
    expect(content).toContain('cmuiftegm0001tzagr48ikekn')

    // Must have state update diff guard
    expect(content).toContain('prev[0]?.id === mapped[0]?.id')
    expect(content).toContain('prev[0]?.image === mapped[0]?.image')

    // Must have priority high attributes on base image
    expect(content).toContain("fetchPriority={idx === 0 ? 'high' : 'auto'}")
    expect(content).toContain("loading={idx === 0 ? 'eager' : 'lazy'}")
  })

  it('2. package.json modern browserslist eliminates legacy JS polyfills', () => {
    const pkgPath = path.join(process.cwd(), 'package.json')
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))

    expect(pkg.browserslist).toContain('chrome >= 109')
    expect(pkg.browserslist).toContain('safari >= 16')
    expect(pkg.browserslist).toContain('edge >= 109')
  })

  it('3. next.config.js includes 192 in imageSizes for mobile waterfall columns', () => {
    const configPath = path.join(process.cwd(), 'next.config.js')
    const content = fs.readFileSync(configPath, 'utf-8')

    expect(content).toContain('192')
  })

  it('4. MobileCatalogView and InFeedStoreAdCard apply image quality 70 compression', () => {
    const catalogPath = path.join(
      process.cwd(),
      'src/components/gadget/mobile-catalog-view.tsx'
    )
    const catalogContent = fs.readFileSync(catalogPath, 'utf-8')
    expect(catalogContent).toContain('quality={70}')

    const adPath = path.join(
      process.cwd(),
      'src/components/ads/in-feed-store-ad-card.tsx'
    )
    const adContent = fs.readFileSync(adPath, 'utf-8')
    expect(adContent).toContain('quality={70}')
  })

  it('5. Gadget page Suspense fallback renders MobileCatalogView shell for instant Frame-1 LCP', () => {
    const pagePath = path.join(process.cwd(), 'src/app/gadget/page.tsx')
    const content = fs.readFileSync(pagePath, 'utf-8')

    expect(content).toContain('fallback=')
    expect(content).toContain('<MobileCatalogView')
    expect(content).toContain('INITIAL_CATALOG_GADGETS')
    expect(content).toContain('<MobileBottomNav activeTab="beranda" />')
  })

  it('6. Gadget catalog defers background sync to user interaction / 6s, preserves desktop SSR Navbar & enables WCAG aria-pressed', () => {
    const pagePath = path.join(process.cwd(), 'src/app/gadget/page.tsx')
    const pageContent = fs.readFileSync(pagePath, 'utf-8')

    // Must defer fetchGadgets to interaction events to eliminate TBT & drop Speed Index
    expect(pageContent).toContain("addEventListener('scroll'")
    expect(pageContent).toContain("addEventListener('touchstart'")
    expect(pageContent).toContain('setTimeout')
    expect(pageContent).toContain('fetchGadgets()')

    // Desktop navbar & footer static SSR import for 0 CLS and instant FCP
    expect(pageContent).toContain('import { Navbar, Footer, MobileBottomNav }')

    // Scoped mobile media preload to recover mobile 96+ without desktop unused penalty
    expect(pageContent).toContain('rel="preload"')
    expect(pageContent).toContain('media="(max-width: 768px)"')
    expect(pageContent).toContain('1790671997412-zuzb6l-poster.webp')

    // Brand filter and load more WCAG accessibility
    const catalogPath = path.join(
      process.cwd(),
      'src/components/gadget/mobile-catalog-view.tsx'
    )
    const catalogContent = fs.readFileSync(catalogPath, 'utf-8')
    expect(catalogContent).toContain('aria-pressed={isSelected}')
    expect(catalogContent).toContain('aria-label="Muat Lebih Banyak Gadget"')

    // Hero banner slide WCAG button role and keyboard interaction
    const heroBannerPath = path.join(
      process.cwd(),
      'src/components/ads/mobile-top-hero-banner.tsx'
    )
    const heroBannerContent = fs.readFileSync(heroBannerPath, 'utf-8')
    expect(heroBannerContent).toContain('role="button"')
    expect(heroBannerContent).toContain('tabIndex={0}')
  })
})
