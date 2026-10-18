import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Live Studio Fullscreen Zero-Scroll Suite', () => {
  const rootDir = process.cwd()
  const broadcasterPath = path.join(
    rootDir,
    'src',
    'components',
    'live',
    'live-stream-broadcaster.tsx'
  )
  const hookPath = path.join(rootDir, 'src', 'hooks', 'use-keyboard-inset.ts')

  const broadcasterContent = fs.readFileSync(broadcasterPath, 'utf-8')
  const hookContent = fs.readFileSync(hookPath, 'utf-8')

  it('1. verifies useKeyboardInset verifies active input element before applying inset', () => {
    expect(hookContent).toContain('const activeEl =')
    expect(hookContent).toContain("activeEl.tagName === 'INPUT'")
    expect(hookContent).toContain(
      'const hasKeyboard = isInputFocused && rawDelta > 75'
    )
    expect(hookContent).toContain(
      'const inset = hasKeyboard ? Math.round(rawDelta) : 0'
    )
  })

  it('2. verifies useKeyboardInset resets scroll on focusout', () => {
    expect(hookContent).toContain('const handleFocusOut = () => {')
    expect(hookContent).toContain(
      "window.scrollTo({ top: 0, left: 0, behavior: 'instant' })"
    )
    expect(hookContent).toContain(
      "window.addEventListener('focusout', handleFocusOut)"
    )
    expect(hookContent).toContain(
      "window.removeEventListener('focusout', handleFocusOut)"
    )
  })

  it('3. verifies broadcaster implements scrollInputIntoContainer for container-only scrolling', () => {
    expect(broadcasterContent).toContain(
      'function scrollInputIntoContainer(el: HTMLElement)'
    )
    expect(broadcasterContent).toContain(
      "const container = el.closest<HTMLElement>('.overflow-y-auto')"
    )
    expect(broadcasterContent).toContain(
      "container.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' })"
    )
  })

  it('4. verifies continuous zero-scroll listener is enforced in mobile live studio', () => {
    expect(broadcasterContent).toContain('const enforceZeroScroll = () => {')
    expect(broadcasterContent).toContain(
      'if (window.scrollY !== 0 || window.scrollX !== 0)'
    )
    expect(broadcasterContent).toContain(
      "window.scrollTo({ top: 0, left: 0, behavior: 'instant' })"
    )
    expect(broadcasterContent).toContain(
      "window.addEventListener('scroll', enforceZeroScroll"
    )
    expect(broadcasterContent).toContain(
      "window.addEventListener('orientationchange', enforceZeroScroll"
    )
    expect(broadcasterContent).toContain(
      "vv.addEventListener('scroll', enforceZeroScroll"
    )
  })

  it('5. verifies top status bar has safe area inset padding and mobile studio is locked fullscreen', () => {
    expect(broadcasterContent).toContain(
      'top-[max(0.85rem,env(safe-area-inset-top,14px))]'
    )
    expect(broadcasterContent).toContain(
      'top-[calc(max(0.85rem,env(safe-area-inset-top,14px))+3.25rem)]'
    )
    expect(broadcasterContent).toContain('fixed inset-0 z-[99999]')
    expect(broadcasterContent).toContain("touchAction: 'none'")
  })
})
