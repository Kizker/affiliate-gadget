import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

describe('Mobile Bottom Nav Auto-Hide on Scroll Down & Show on Scroll Up', () => {
  const navPath = path.resolve(
    process.cwd(),
    'src/components/layouts/mobile-bottom-nav.tsx'
  )
  const cssPath = path.resolve(process.cwd(), 'src/styles/globals.css')

  it('memvalidasi listener scroll auto-hide dan hysteresis threshold pada MobileBottomNav', () => {
    const content = fs.readFileSync(navPath, 'utf-8')

    // State isVisible
    expect(content).toContain(
      'const [isVisible, setIsVisible] = useState(true)'
    )

    // Reset visibility saat pathname berubah
    expect(content).toContain('setIsVisible(true)')
    expect(content).toContain('[pathname]')

    // Threshold scroll untuk mencegah micro-bounce momentum iOS saat jari dilepas
    expect(content).toContain('SCROLL_DOWN_THRESHOLD = 15')
    expect(content).toContain('SCROLL_UP_THRESHOLD = 20')
    expect(content).toContain('TOP_THRESHOLD = 70')

    // requestAnimationFrame scroll listener
    expect(content).toContain('window.requestAnimationFrame(updateVisibility)')
    expect(content).toContain(
      "window.addEventListener('scroll', handleScroll, { passive: true })"
    )

    // Class toggle visibility pada tag nav
    expect(content).toContain(
      "isVisible ? 'mobile-bottom-nav-visible' : 'mobile-bottom-nav-hidden'"
    )
  })

  it('memvalidasi CSS transisi hardware acceleration dan pointer-events di globals.css', () => {
    const css = fs.readFileSync(cssPath, 'utf-8')

    // Rule mobile-bottom-nav-fixed dengan will-change & transition
    expect(css).toContain('.mobile-bottom-nav-fixed')
    expect(css).toContain('will-change: transform')
    expect(css).toContain(
      'transition: transform 320ms cubic-bezier(0.2, 0.9, 0.3, 1)'
    )

    // Rule mobile-bottom-nav-hidden dengan translasi ke bawah penuh & pointer-events none
    expect(css).toContain('.mobile-bottom-nav-hidden')
    expect(css).toContain(
      'transform: translate3d(0, calc(100% + 7rem), 0) !important'
    )
    expect(css).toContain('pointer-events: none !important')

    // Rule mobile-bottom-nav-visible
    expect(css).toContain('.mobile-bottom-nav-visible')
    expect(css).toContain('transform: translate3d(0, 0, 0) !important')
    expect(css).toContain('pointer-events: auto !important')
  })
})
