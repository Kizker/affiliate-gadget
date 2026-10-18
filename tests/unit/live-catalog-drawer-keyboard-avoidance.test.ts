import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Live Catalog Product Drawer Keyboard Avoidance Suite', () => {
  const rootDir = process.cwd()
  const broadcasterPath = path.join(
    rootDir,
    'src',
    'components',
    'live',
    'live-stream-broadcaster.tsx'
  )
  const broadcasterContent = fs.readFileSync(broadcasterPath, 'utf-8')

  it('1. verifies product drawer container shifts up with keyboardInset', () => {
    expect(broadcasterContent).toContain('paddingBottom:')
    expect(broadcasterContent).toContain(
      'keyboardInset > 0 ? `${keyboardInset}px` : undefined'
    )
  })

  it('2. verifies drawer card height adapts to prevent top clipping when keyboard appears', () => {
    expect(broadcasterContent).toContain(
      'calc(100dvh - ${keyboardInset}px - 2rem)'
    )
    expect(broadcasterContent).toContain('transition-[max-height]')
  })

  it('3. verifies auto-scroll useEffect uses container scrolling to prevent iOS window scroll', () => {
    expect(broadcasterContent).toContain(
      'if (keyboardInset > 0 && isProductDrawerOpen)'
    )
    expect(broadcasterContent).toContain('scrollInputIntoContainer(activeEl)')
  })

  it('4. verifies drawer discount input and search input have onFocus container scroll handlers', () => {
    expect(broadcasterContent).toContain('setDiscountInputs((prev) => ({')
    expect(broadcasterContent).toContain('scrollInputIntoContainer(el)')
  })
})
