import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Mobile Top Nav Non-Sticky Logo & Smart Sticky Search on Scroll Suite', () => {
  const rootDir = process.cwd()
  const mobileTopNavPath = path.join(
    rootDir,
    'src',
    'components',
    'layouts',
    'mobile-top-nav.tsx'
  )
  const mobileCatalogViewPath = path.join(
    rootDir,
    'src',
    'components',
    'gadget',
    'mobile-catalog-view.tsx'
  )

  const mobileTopNavContent = fs.readFileSync(mobileTopNavPath, 'utf-8')
  const mobileCatalogViewContent = fs.readFileSync(
    mobileCatalogViewPath,
    'utf-8'
  )

  describe('1. MobileTopNav Scroll Detection & Replacement Logic', () => {
    it('listens to window scroll event and sets isScrolled based on threshold', () => {
      expect(mobileTopNavContent).toContain(
        'const [isScrolled, setIsScrolled] = useState(false)'
      )
      expect(mobileTopNavContent).toContain(
        "window.addEventListener('scroll', handleScroll, { passive: true })"
      )
      expect(mobileTopNavContent).toContain('scrollThreshold')
    })

    it('replaces logo with smart search bar when scrolled (logo is not sticky)', () => {
      // Scrolled condition shows search form and hides logo
      expect(mobileTopNavContent).toContain('searchable && isScrolled ? (')
      // Search form has magnifier button on the left
      expect(mobileTopNavContent).toMatch(/<Search className="h-4 w-4" \/>/)
      // Search input takes up all available width
      expect(mobileTopNavContent).toContain('flex-1 min-w-0')
      expect(mobileTopNavContent).toContain('type="search"')
      expect(mobileTopNavContent).toContain('placeholder={searchPlaceholder}')
    })

    it('keeps Chat and Keranjang Belanja sticky on the right in both states', () => {
      expect(mobileTopNavContent).toContain(
        '{/* Right Action Icons: Chat & Keranjang Belanja (Tetap Sticky di Kanan) */}'
      )
      expect(mobileTopNavContent).toContain('flex shrink-0 items-center gap-2')
      expect(mobileTopNavContent).toContain(
        '<MessageSquare className="h-4 w-4" />'
      )
      expect(mobileTopNavContent).toContain(
        '<ShoppingBag className="h-4 w-4" />'
      )
    })
  })

  describe('2. MobileCatalogView Integration', () => {
    it('wires search state and handlers into MobileTopNav', () => {
      expect(mobileCatalogViewContent).toContain('<MobileTopNav')
      expect(mobileCatalogViewContent).toContain('searchable')
      expect(mobileCatalogViewContent).toContain('searchValue={search}')
      expect(mobileCatalogViewContent).toContain('onSearchChange={setSearch}')
      expect(mobileCatalogViewContent).toContain(
        'onSearchSubmit={handleSearchSubmit}'
      )
      expect(mobileCatalogViewContent).toContain(
        'onClearSearch={handleClearSearch}'
      )
    })
  })
})
