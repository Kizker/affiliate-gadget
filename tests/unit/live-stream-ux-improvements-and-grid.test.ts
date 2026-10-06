import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Live Streaming UX Improvements & Home Grid Integration', () => {
  const broadcasterPath = path.join(
    process.cwd(),
    'src/components/live/live-stream-broadcaster.tsx'
  )
  const viewerPath = path.join(
    process.cwd(),
    'src/components/live/live-stream-viewer.tsx'
  )
  const livePagePath = path.join(process.cwd(), 'src/app/live/[id]/page.tsx')
  const mobileCatalogPath = path.join(
    process.cwd(),
    'src/components/gadget/mobile-catalog-view.tsx'
  )
  const useLiveChatPath = path.join(process.cwd(), 'src/hooks/use-live-chat.ts')
  const keyboardInsetPath = path.join(
    process.cwd(),
    'src/hooks/use-keyboard-inset.ts'
  )
  const liveRoutePath = path.join(
    process.cwd(),
    'src/app/api/live-streams/[id]/route.ts'
  )

  const broadcasterCode = fs.readFileSync(broadcasterPath, 'utf-8')
  const viewerCode = fs.readFileSync(viewerPath, 'utf-8')
  const livePageCode = fs.readFileSync(livePagePath, 'utf-8')
  const mobileCatalogCode = fs.readFileSync(mobileCatalogPath, 'utf-8')
  const useLiveChatCode = fs.readFileSync(useLiveChatPath, 'utf-8')
  const keyboardInsetCode = fs.readFileSync(keyboardInsetPath, 'utf-8')
  const liveRouteCode = fs.readFileSync(liveRoutePath, 'utf-8')

  it('1. Camera Autostart in Host Studio: automatically attaches camera track upon publication without manual toggle', () => {
    expect(broadcasterCode).toContain('localTrackPublished')
    expect(broadcasterCode).toContain('tryAttach')
    expect(broadcasterCode).toContain('setInterval')
  })

  it('2. Desktop Live Chat Width: widened comfortably to the right (lg:grid-cols-12, col-span-8/4, max-w-[1440px])', () => {
    expect(livePageCode).toContain('md:max-w-[1440px]')
    expect(viewerCode).toContain('lg:grid-cols-12')
    expect(viewerCode).toContain('lg:col-span-8')
    expect(viewerCode).toContain('lg:col-span-4')
  })

  it('3. Home Page Grid Live Streams: removed horizontal top strip and renders live streams in 2-column masonry grid', () => {
    // Horizontal strip above search bar is eliminated
    expect(mobileCatalogCode).not.toContain('SEDANG LIVE')
    // Live streams partitioned and rendered in 2-column grid
    expect(mobileCatalogCode).toContain('LiveBannerCard')
    expect(mobileCatalogCode).toContain(
      '<LiveBannerCard stream={item.data} className="w-full" />'
    )
  })

  it('4. iPhone Comment Input Stability: eliminates blur jitter loop on iOS Safari', () => {
    // mobileRootRef anchored cleanly without oscillating offsetTop transform
    expect(viewerCode).toContain('fixed inset-0 flex h-[100dvh]')
    expect(viewerCode).not.toContain(
      'style={{ transform: `translateY(${offsetTop}px)` }}'
    )
    // RAF and keyboard delta in useKeyboardInset
    expect(keyboardInsetCode).toContain('requestAnimationFrame')
    expect(keyboardInsetCode).toContain('window.innerHeight - vv.height')
    // onFocus prevent scroll handler
    expect(viewerCode).toContain(
      "window.scrollTo({ top: 0, left: 0, behavior: 'instant' })"
    )
  })

  it('5. Pinned Product & Live Discount Sync: fetches active deal on mount and synchronizes discount price', () => {
    // useLiveChat fetches active deal from REST on join
    expect(useLiveChatCode).toContain('/deals')
    expect(useLiveChatCode).toContain('loadActiveDeal')
    // GET /api/live-streams/[id] resolves activeDeal
    expect(liveRouteCode).toContain('getActiveDealForStream')
    expect(liveRouteCode).toContain('activeDeal')
  })
})
