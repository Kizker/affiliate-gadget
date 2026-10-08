import fs from 'fs'
import path from 'path'
import { describe, it, expect } from 'vitest'

describe('Live Stream Phase 3 Performance Fix & Verification', () => {
  const rootDir = process.cwd()

  it('Task 1.1: useIsMobile supports initialValue and uses lazy initialization', () => {
    const filePath = path.join(rootDir, 'src', 'hooks', 'use-is-mobile.ts')
    const content = fs.readFileSync(filePath, 'utf8')

    // Accepts initialValue parameter
    expect(content).toMatch(
      /export function useIsMobile\([^)]*initialValue\?: boolean\)/
    )
    // Uses lazy useState initializer
    expect(content).toContain('useState<boolean>(() => {')
    expect(content).toContain("typeof initialValue === 'boolean'")
    expect(content).toContain('matchMedia')
    // Does NOT read window.innerWidth
    expect(content).not.toContain('window.innerWidth')
  })

  it('Task 1.2: page.tsx detects mobile device on server and gates desktop chrome', () => {
    const pagePath = path.join(
      rootDir,
      'src',
      'app',
      'live',
      '[id]',
      'page.tsx'
    )
    const content = fs.readFileSync(pagePath, 'utf8')

    // Uses next/headers and parseUserAgent on SSR
    expect(content).toContain("import { headers } from 'next/headers'")
    expect(content).toContain(
      "import { parseUserAgent } from '@/lib/user-agent-parser'"
    )
    expect(content).toContain('isMobileDevice')
    expect(content).toContain('initialIsMobile={isMobileDevice}')

    // Ommitted on mobile to eliminate client chunk load & CSS blocking
    expect(content).toContain('{!isMobileDevice && <LiveDesktopNavbar />}')
    expect(content).toContain('{!isMobileDevice && <LiveDesktopFooter />}')
  })

  it('Task 1.3 & 3.1: LiveStreamViewer accepts initialIsMobile and uses matchMedia orientation', () => {
    const viewerPath = path.join(
      rootDir,
      'src',
      'components',
      'live',
      'live-stream-viewer.tsx'
    )
    const content = fs.readFileSync(viewerPath, 'utf8')

    // Props accept initialIsMobile
    expect(content).toContain('initialIsMobile?: boolean')
    expect(content).toContain('useIsMobile(768, initialIsMobile)')

    // Zero forced reflow in orientation check
    expect(content).toContain("window.matchMedia('(orientation: landscape)')")
    expect(content).not.toContain('window.innerWidth > window.innerHeight')
  })

  it('Task 2.1 & 2.2: Poster cover images have full opacity and zero blur across player components', () => {
    const viewerPath = path.join(
      rootDir,
      'src',
      'components',
      'live',
      'live-stream-viewer.tsx'
    )
    const viewerContent = fs.readFileSync(viewerPath, 'utf8')

    // Dynamic import loading returns null (non-blocking)
    expect(viewerContent).toMatch(
      /LiveKitStreamPlayer[\s\S]*?loading:\s*\(\)\s*=>\s*null/
    )

    // Poster cover in viewer has object-cover without opacity-65
    expect(viewerContent).toMatch(
      /src=\{stream\.coverImage\}[\s\S]*?className="object-cover"/
    )
    expect(viewerContent).not.toContain(
      'src={stream.coverImage}\n            alt={stream.title}\n            fill\n            priority\n            sizes="(max-width: 768px) 100vw, 960px"\n            className="object-cover opacity-65"'
    )

    // Subscriber video cover has object-cover without blur or opacity reduction
    const subVideoPath = path.join(
      rootDir,
      'src',
      'components',
      'live',
      'livekit-subscriber-video.tsx'
    )
    const subVideoContent = fs.readFileSync(subVideoPath, 'utf8')
    expect(subVideoContent).not.toContain('opacity-65 blur-[1px]')
  })

  it('Task 4.1: Avatar and product images have onError handlers to prevent console 400 errors', () => {
    const viewerPath = path.join(
      rootDir,
      'src',
      'components',
      'live',
      'live-stream-viewer.tsx'
    )
    const content = fs.readFileSync(viewerPath, 'utf8')

    // Store logo and pinned product have error handling
    expect(content).toContain('onError')
    expect(content).toContain('stream.store.logo')
    expect(content).toContain('pinnedProduct.productImage')
  })
})
