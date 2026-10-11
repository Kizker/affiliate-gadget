import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { getMitraServiceListData } from '@/lib/mitra-service-data'

describe('Service Page Lighthouse Optimization Suite (/servis-lcd & /servis)', () => {
  it('verifies getMitraServiceListData returns valid mitra list with proper fields and fallbacks', async () => {
    const mitras = await getMitraServiceListData()
    expect(Array.isArray(mitras)).toBe(true)
    expect(mitras.length).toBeGreaterThan(0)

    const first = mitras[0]
    expect(first).toHaveProperty('id')
    expect(first).toHaveProperty('businessName')
    expect(first).toHaveProperty('city')
    expect(first).toHaveProperty('googleMapsUrl')
    expect(first.googleMapsUrl).toContain('https://maps.google.com/?q=')
  })

  it('verifies src/app/servis-lcd/page.tsx implements SSR Direct Data Hydration & Schema.org JSON-LD', () => {
    const pagePath = path.join(process.cwd(), 'src/app/servis-lcd/page.tsx')
    const content = fs.readFileSync(pagePath, 'utf-8')

    // 1. Force dynamic & direct data fetch
    expect(content).toContain("export const dynamic = 'force-dynamic'")
    expect(content).toContain('getMitraServiceListData()')
    expect(content).toContain('parseUserAgent(')

    // 2. Canonical SEO & Metadata
    expect(content).toContain('generateMetadata()')
    expect(content).toContain('canonical:')
    expect(content).toContain('/servis-lcd')

    // 3. Schema.org Structured Data
    expect(content).toContain('application/ld+json')
    expect(content).toContain("'@type': 'ItemList'")
    expect(content).toContain("'@type': 'AutoRepair'")

    // 4. Passes initial props to client
    expect(content).toContain('initialMitras={mitras}')
    expect(content).toContain('initialIsMobile={isMobileDevice}')
  })

  it('verifies integrated-service-view.tsx implements Viewport Mount Gating, LCP Eager Banner, & WCAG 100', () => {
    const viewPath = path.join(
      process.cwd(),
      'src/components/service/integrated-service-view.tsx'
    )
    const content = fs.readFileSync(viewPath, 'utf-8')

    // 1. Viewport Mount Gating
    expect(content).toContain('showMobile')
    expect(content).toContain('showDesktop')
    expect(content).toContain('useIsMobile(768, initialIsMobile)')

    // 2. MitraBannerImage with safe fallback and priority on first card
    expect(content).toContain('function MitraBannerImage(')
    expect(content).toContain('onError={() => setImgSrc(DEFAULT_BANNER)}')
    expect(content).toContain("priority ? 'high' : 'auto'")
    expect(content).toContain("priority ? 'eager' : 'lazy'")
    expect(content).toContain('priority={isFirstCard}')

    // 3. WCAG 100 Accessibility & Semantic Heading
    expect(content).toContain('<h1 className="sr-only">')
    expect(content).toContain('bg-orange-700') // high-contrast >= 4.5:1
    expect(content).toContain(
      'Petunjuk arah Google Maps menuju ${mitra.businessName}'
    )
    expect(content).toContain(
      'Booking servis dan konsultasi di ${mitra.businessName}'
    )
    expect(content).toContain('aria-pressed={isActive}')
  })

  it('verifies next.config.js includes 301 permanent redirect for legacy /servis route', () => {
    const configPath = path.join(process.cwd(), 'next.config.js')
    const content = fs.readFileSync(configPath, 'utf-8')

    expect(content).toContain("source: '/servis'")
    expect(content).toContain("destination: '/servis-lcd'")
    expect(content).toContain('permanent: true')
  })

  it('verifies navbar.tsx has optimized Next Image logo and accessible touch target for mobile login', () => {
    const navbarPath = path.join(
      process.cwd(),
      'src/components/layouts/navbar.tsx'
    )
    const content = fs.readFileSync(navbarPath, 'utf-8')

    // 1. Next Image with dimensions
    expect(content).toContain("import Image from 'next/image'")
    expect(content).toContain('<Image')
    expect(content).toContain('src="/logo.webp"')
    expect(content).toContain('width={32}')
    expect(content).toContain('height={32}')

    // 2. Mobile touch target >= 44px
    expect(content).toContain('min-h-[44px] min-w-[44px]')
  })
})
