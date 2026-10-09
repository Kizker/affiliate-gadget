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
})
