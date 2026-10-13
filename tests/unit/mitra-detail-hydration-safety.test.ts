import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Mitra Detail Mobile Hydration Safety & Consistency Suite', () => {
  const rootDir = process.cwd()
  const hookPath = path.join(rootDir, 'src', 'hooks', 'use-is-mobile.ts')
  const pagePath = path.join(
    rootDir,
    'src',
    'app',
    'rekomendasi',
    '[id]',
    'page.tsx'
  )
  const clientPath = path.join(
    rootDir,
    'src',
    'app',
    'rekomendasi',
    '[id]',
    'mitra-detail-client.tsx'
  )
  const subComponentsDir = path.join(
    rootDir,
    'src',
    'components',
    'rekomendasi'
  )

  it('1. verifies useIsMobile hook initializes safely to prevent SSR-client hydration mismatch', () => {
    const hookContent = fs.readFileSync(hookPath, 'utf-8')
    expect(hookContent).toContain("typeof initialValue === 'boolean'")
    expect(hookContent).toContain("typeof window === 'undefined'")
    // Must return false as fallback during initial render to match SSR HTML
    expect(hookContent).toContain('return false')
    // Must sync with window.matchMedia inside useEffect
    expect(hookContent).toContain('useEffect(() => {')
    expect(hookContent).toContain('window.matchMedia')
  })

  it('2. verifies recommendation page detects mobile device on server and passes initialIsMobile', () => {
    const pageContent = fs.readFileSync(pagePath, 'utf-8')
    expect(pageContent).toContain("import { headers } from 'next/headers'")
    expect(pageContent).toContain(
      "import { parseUserAgent } from '@/lib/user-agent-parser'"
    )
    expect(pageContent).toContain("headersList.get('user-agent')")
    expect(pageContent).toContain("clientDevice.deviceType === 'mobile'")
    expect(pageContent).toContain('initialIsMobile={isMobileDevice}')
  })

  it('3. verifies MitraDetailClient accepts initialIsMobile and forwards it to all sub-components', () => {
    const clientContent = fs.readFileSync(clientPath, 'utf-8')
    expect(clientContent).toContain('initialIsMobile?: boolean')
    expect(clientContent).toContain('initialIsMobile = false')
    expect(clientContent).toContain('<MitraHero')
    expect(clientContent).toContain('initialIsMobile={initialIsMobile}')
    expect(clientContent).toContain('<MitraEditorialBanner')
    expect(clientContent).toContain('<MitraServiceCatalog')
    expect(clientContent).toContain('<MitraFeatures')
    expect(clientContent).toContain('<MitraGallery')
    expect(clientContent).toContain('<MitraInfo')
    expect(clientContent).toContain('<MitraReviews')
  })

  it('4. verifies all 7 recommendation section components accept initialIsMobile and have suppressHydrationWarning', () => {
    const componentFiles = [
      'mitra-hero.tsx',
      'mitra-editorial-banner.tsx',
      'mitra-service-catalog.tsx',
      'mitra-features.tsx',
      'mitra-gallery.tsx',
      'mitra-info.tsx',
      'mitra-reviews.tsx',
    ]

    for (const file of componentFiles) {
      const content = fs.readFileSync(
        path.join(subComponentsDir, file),
        'utf-8'
      )
      expect(content).toContain('initialIsMobile')
      expect(content).toContain('useIsMobile(768, initialIsMobile)')
      expect(content).toContain('suppressHydrationWarning')
    }
  })
})
