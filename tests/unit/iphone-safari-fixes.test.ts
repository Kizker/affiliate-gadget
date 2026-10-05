import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('iPhone Safari Fixes Suite (Bottom Nav, Auto-Zoom, Uniform Grid)', () => {
  const layoutPath = path.resolve(process.cwd(), 'src/app/layout.tsx')
  const globalsCssPath = path.resolve(process.cwd(), 'src/styles/globals.css')
  const mobileBottomNavPath = path.resolve(
    process.cwd(),
    'src/components/layouts/mobile-bottom-nav.tsx'
  )
  const mobileCatalogViewPath = path.resolve(
    process.cwd(),
    'src/components/gadget/mobile-catalog-view.tsx'
  )
  const inFeedAdCardPath = path.resolve(
    process.cwd(),
    'src/components/ads/in-feed-store-ad-card.tsx'
  )
  const loginPagePath = path.resolve(process.cwd(), 'src/app/login/page.tsx')

  it('1. should export Viewport in layout.tsx with viewportFit cover and zoom lock', () => {
    const content = fs.readFileSync(layoutPath, 'utf-8')
    expect(content).toContain("viewportFit: 'cover'")
    expect(content).toContain('maximumScale: 1')
    expect(content).toContain('userScalable: false')
    expect(content).toContain("width: 'device-width'")
  })

  it('2. should enforce 16px font-size on mobile inputs in globals.css to eliminate iOS auto-zoom', () => {
    const css = fs.readFileSync(globalsCssPath, 'utf-8')
    expect(css).toContain('@media screen and (max-width: 768px)')
    expect(css).toContain('font-size: 16px !important;')
    expect(css).toContain('.mobile-bottom-nav-fixed')
    expect(css).toContain('-webkit-text-size-adjust: 100%')
  })

  it('3. should attach mobile-bottom-nav-fixed and overscroll bleed protection to mobile bottom nav', () => {
    const navContent = fs.readFileSync(mobileBottomNavPath, 'utf-8')
    expect(navContent).toContain('mobile-bottom-nav-fixed')
    expect(navContent).toContain(
      'pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]'
    )
    expect(navContent).toContain('-bottom-24')
  })

  it('4. should use uniform 1:1 aspect-square image boxes and 2-column masonry waterfall in mobile catalog', () => {
    const catalog = fs.readFileSync(mobileCatalogViewPath, 'utf-8')
    expect(catalog).toContain('aspect-square w-full')
    expect(catalog).toContain('object-contain')
    expect(catalog).toContain('grid grid-cols-2 items-start')
    expect(catalog).toContain('leftColumnItems')
    expect(catalog).toContain('rightColumnItems')
  })

  it('5. should use natural aspect-[4/5] min-h-[260px] for in-feed ad card in masonry layout', () => {
    const adCard = fs.readFileSync(inFeedAdCardPath, 'utf-8')
    expect(adCard).toContain('aspect-[4/5] min-h-[260px]')
  })

  it('6. should ensure login inputs use non-zooming text-base font size on mobile', () => {
    const login = fs.readFileSync(loginPagePath, 'utf-8')
    expect(login).toContain('text-base')
    expect(login).toContain('sm:text-xs')
  })
})
