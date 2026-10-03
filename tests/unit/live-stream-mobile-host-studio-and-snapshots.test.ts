import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Live Stream Mobile Host Studio, Clean Pinned Card, Adaptive Desktop & Dynamic Snapshots Suite', () => {
  const viewerPath = path.join(
    process.cwd(),
    'src/components/live/live-stream-viewer.tsx'
  )
  const broadcasterPath = path.join(
    process.cwd(),
    'src/components/live/live-stream-broadcaster.tsx'
  )
  const snapshotRoutePath = path.join(
    process.cwd(),
    'src/app/api/live-streams/[id]/snapshot/route.ts'
  )
  const thumbnailRoutePath = path.join(
    process.cwd(),
    'src/app/api/live-streams/[id]/thumbnail/route.ts'
  )
  const livePagePath = path.join(process.cwd(), 'src/app/live/[id]/page.tsx')
  const snapshotHelperPath = path.join(
    process.cwd(),
    'src/lib/live-snapshot.ts'
  )

  const viewerCode = fs.readFileSync(viewerPath, 'utf-8')
  const broadcasterCode = fs.readFileSync(broadcasterPath, 'utf-8')
  const snapshotRouteCode = fs.readFileSync(snapshotRoutePath, 'utf-8')
  const thumbnailRouteCode = fs.readFileSync(thumbnailRoutePath, 'utf-8')
  const livePageCode = fs.readFileSync(livePagePath, 'utf-8')
  const snapshotHelperCode = fs.readFileSync(snapshotHelperPath, 'utf-8')

  it('1. Mobile Viewer Pinned Card: eliminates bulky "Disematkan Host" badge and provides prominent title & price', () => {
    // Card exists on mobile viewer
    expect(viewerCode).toContain('{pinnedProduct && (')
    // The bulky "Disematkan Host" badge is removed
    expect(viewerCode).not.toContain('Disematkan Host')
    // Title and price are rendered prominently
    expect(viewerCode).toContain('pinnedProduct.productTitle')
    expect(viewerCode).toContain('pinnedProduct.productPrice')
    expect(viewerCode).toContain('text-xs sm:text-sm font-bold text-slate-900')
    expect(viewerCode).toContain(
      'text-xs sm:text-sm font-extrabold text-orange-600'
    )
  })

  it('2. Broadcaster Mobile Studio: fullscreen immersive view without page scrolling or bottom tabs', () => {
    // Broadcaster has mobile detection and renders fullscreen 100dvh fixed layout portaled to body
    expect(broadcasterCode).toContain('useIsMobile')
    expect(broadcasterCode).toContain('fixed inset-0 z-[99999] flex h-[100dvh]')
    expect(broadcasterCode).toContain(
      'createPortal(mobileStudio, document.body)'
    )
    expect(broadcasterCode).toContain('mobile-live-active')
    // Floating live chat stream on video with extended height
    expect(broadcasterCode).toContain('mobileChatScrollRef')
    expect(broadcasterCode).toContain('max-h-[46dvh] min-h-[160px]')
    expect(broadcasterCode).toContain('Balas komentar sebagai Host...')
    expect(broadcasterCode).toContain('handleSendHostComment')
    // Floating button to open catalog drawer for 200+ products in Clean Light Mode
    expect(broadcasterCode).toContain('setIsProductDrawerOpen(true)')
    expect(broadcasterCode).toContain('Sematkan Barang Siaran')
    expect(broadcasterCode).toContain('bg-white p-4 text-slate-900')
    // Keyboard avoidance
    expect(broadcasterCode).toContain('useKeyboardInset')
    expect(broadcasterCode).toContain(
      'transform: `translateY(-${keyboardInset}px)`'
    )
  })

  it('3. Desktop Viewer Adaptive View: detects mobile vertical stream and displays uncropped with ambient backdrop', () => {
    // Subscriber video detects vertical orientation dynamically
    expect(viewerCode).toContain('onOrientationChange')
    expect(viewerCode).toContain('isVerticalStream')
    // Uncropped object-contain for vertical streams
    expect(viewerCode).toContain('isVertical')
    expect(viewerCode).toContain('object-contain')
    // Ambient blurred backdrop video behind the main stream
    expect(viewerCode).toContain('ambientVideoRef')
    expect(viewerCode).toContain('blur-2xl')
    // Desktop player box adapts height from strict aspect-video to tall 640px
    expect(viewerCode).toContain('isVerticalStream')
    expect(viewerCode).toContain('h-[640px] max-h-[calc(100vh-160px)]')
  })

  it('4. Real-time Live Share Snapshots: auto frame capture and dynamic OpenGraph preview for WhatsApp', () => {
    // Helper captures frame from HTMLVideoElement
    expect(snapshotHelperCode).toContain('captureVideoSnapshot')
    expect(snapshotHelperCode).toContain('uploadLiveSnapshot')
    expect(snapshotHelperCode).toContain('ctx.drawImage(video')
    // Snapshot API saves frame to uploads and updates coverImage
    expect(snapshotRouteCode).toContain('/uploads/live-snapshots/')
    expect(snapshotRouteCode).toContain('prisma.liveStream.update')
    expect(thumbnailRouteCode).toContain('live-snapshots')
    // Page generateMetadata exports openGraph with live thumbnail
    expect(livePageCode).toContain('generateMetadata')
    expect(livePageCode).toContain('/api/live-streams/${id}/thumbnail')
    expect(livePageCode).toContain('openGraph')
    expect(livePageCode).toContain('summary_large_image')
    // Host and Viewer share buttons trigger snapshot upload
    expect(broadcasterCode).toContain('handleShare')
    expect(viewerCode).toContain('handleShare')
  })
})
