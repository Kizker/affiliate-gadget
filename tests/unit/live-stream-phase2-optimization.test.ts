import fs from 'fs'
import path from 'path'
import { describe, it, expect } from 'vitest'

describe('Live Stream Phase 2 Optimization Verification', () => {
  const rootDir = process.cwd()

  it('Task 1.1: live-empty.vtt contains valid WEBVTT header without shift-causing cues', () => {
    const vttPath = path.join(rootDir, 'public', 'captions', 'live-empty.vtt')
    expect(fs.existsSync(vttPath)).toBe(true)
    const content = fs.readFileSync(vttPath, 'utf8')
    expect(content).toContain('WEBVTT')
    // Must NOT contain cue timing or text that triggers WebKit layout shift
    expect(content).not.toContain('-->')
    expect(content).not.toContain('Siaran Langsung Affiliate Gadget')
  })

  it('Task 1.2: livekit-subscriber-video.tsx removes default attribute from caption track', () => {
    const filePath = path.join(
      rootDir,
      'src',
      'components',
      'live',
      'livekit-subscriber-video.tsx'
    )
    const content = fs.readFileSync(filePath, 'utf8')
    expect(content).toContain('kind="captions"')
    expect(content).toContain('src="/captions/live-empty.vtt"')
    // Must NOT contain default on the track tag to avoid forced pseudo-element mounting
    expect(content).not.toMatch(/<track[^>]*\sdefault\s*\/?>/)
  })

  it('Task 2.1 & 2.2: live-stream-viewer renders cover image poster with priority in base layer', () => {
    const filePath = path.join(
      rootDir,
      'src',
      'components',
      'live',
      'live-stream-viewer.tsx'
    )
    const content = fs.readFileSync(filePath, 'utf8')
    // Verify renderLiveVideo always mounts coverImage as priority base layer
    expect(content).toContain('src={stream.coverImage}')
    expect(content).toContain('priority')
    expect(content).toContain('coverImage={stream.coverImage}')
  })

  it('Task 2.3 & 4.1: live page.tsx preloads LCP poster and sets Navbar/Footer to ssr: false', () => {
    const pagePath = path.join(
      rootDir,
      'src',
      'app',
      'live',
      '[id]',
      'page.tsx'
    )
    const pageContent = fs.readFileSync(pagePath, 'utf8')
    // Preload link for LCP cover image
    expect(pageContent).toContain('rel="preload"')
    expect(pageContent).toContain('as="image"')
    expect(pageContent).toContain('initialStream?.coverImage')
    expect(pageContent).toContain('LiveDesktopNavbar')
    expect(pageContent).toContain('LiveDesktopFooter')

    // ssr: false in live-desktop-chrome.tsx for mobile critical path optimization
    const chromePath = path.join(
      rootDir,
      'src',
      'components',
      'live',
      'live-desktop-chrome.tsx'
    )
    expect(fs.existsSync(chromePath)).toBe(true)
    const chromeContent = fs.readFileSync(chromePath, 'utf8')
    expect(chromeContent).toMatch(/Navbar[\s\S]*?\{\s*ssr:\s*false\s*\}/)
    expect(chromeContent).toMatch(/Footer[\s\S]*?\{\s*ssr:\s*false\s*\}/)
  })

  it('Task 3.1 & 3.2: viewer uses shared useIsMobile and debounces auto-scroll with rAF', () => {
    const filePath = path.join(
      rootDir,
      'src',
      'components',
      'live',
      'live-stream-viewer.tsx'
    )
    const content = fs.readFileSync(filePath, 'utf8')
    expect(content).toContain(
      "import { useIsMobile } from '@/hooks/use-is-mobile'"
    )
    expect(content).toContain('requestAnimationFrame')
    expect(content).toContain('cancelAnimationFrame')
  })

  it('Task 3.3: use-keyboard-inset does not query layout geometry on initial mount', () => {
    const filePath = path.join(rootDir, 'src', 'hooks', 'use-keyboard-inset.ts')
    const content = fs.readFileSync(filePath, 'utf8')
    // Must not call update() before adding event listeners
    expect(content).not.toMatch(/update\(\)\s*vv\.addEventListener/)
  })

  it('Task 4.2: handleShare dynamically imports live-snapshot', () => {
    const filePath = path.join(
      rootDir,
      'src',
      'components',
      'live',
      'live-stream-viewer.tsx'
    )
    const content = fs.readFileSync(filePath, 'utf8')
    // Static top-level import should not exist
    expect(content).not.toMatch(/^import .* from '@\/lib\/live-snapshot'/m)
    // Dynamic import inside handleShare
    expect(content).toContain('@/lib/live-snapshot')
    expect(content).toMatch(/import\(\s*['"]@\/lib\/live-snapshot['"]\s*\)/)
  })
})
