import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Live Streaming Enhancements Suite (Mirror Sync, Instagram Mobile & YouTube Desktop)', () => {
  const broadcasterPath = path.join(
    process.cwd(),
    'src/components/live/live-stream-broadcaster.tsx'
  )
  const viewerPath = path.join(
    process.cwd(),
    'src/components/live/live-stream-viewer.tsx'
  )
  const chatPanelPath = path.join(
    process.cwd(),
    'src/components/live/live-chat-panel.tsx'
  )
  const productPinPath = path.join(
    process.cwd(),
    'src/components/live/live-product-pin.tsx'
  )
  const floatingHeartsPath = path.join(
    process.cwd(),
    'src/components/live/floating-hearts.tsx'
  )
  const roomManagerPath = path.join(process.cwd(), 'ws-server/room-manager.ts')
  const globalsCssPath = path.join(process.cwd(), 'src/styles/globals.css')

  const broadcasterCode = fs.readFileSync(broadcasterPath, 'utf-8')
  const viewerCode = fs.readFileSync(viewerPath, 'utf-8')
  const chatPanelCode = fs.readFileSync(chatPanelPath, 'utf-8')
  const productPinCode = fs.readFileSync(productPinPath, 'utf-8')
  const floatingHeartsCode = fs.readFileSync(floatingHeartsPath, 'utf-8')
  const roomManagerCode = fs.readFileSync(roomManagerPath, 'utf-8')
  const globalsCssCode = fs.readFileSync(globalsCssPath, 'utf-8')

  it('1. Mirror view synchronization: Host toggles mirror & broadcasts to viewers with scaleX(-1)', () => {
    // Broadcaster has state isMirrored and syncs via setMirror
    expect(broadcasterCode).toContain(
      'const [isMirrored, setIsMirrored] = useState(true)'
    )
    expect(broadcasterCode).toContain('setMirror')
    expect(broadcasterCode).toContain('toggleMirror')
    // Broadcaster has style transform scaleX(-1) when active
    expect(broadcasterCode).toContain(
      "style={{ transform: isMirrored ? 'scaleX(-1)' : 'none' }}"
    )
    // Viewer receives isMirrored from WebSocket and mirrors subscriber video
    expect(viewerCode).toContain('isMirrored')
    expect(viewerCode).toContain(
      "style={{ transform: isMirrored ? 'scaleX(-1)' : 'none' }}"
    )
    // Room manager broadcasts mirror state
    expect(roomManagerCode).toContain('setMirrorState')
    expect(roomManagerCode).toContain("type: 'mirror'")
  })

  it('2. Dual Platform Layout: Instagram Live on mobile and YouTube Live on desktop', () => {
    // Chat panel uses clean white container styling on desktop
    expect(chatPanelCode).toContain(
      'rounded-3xl border border-slate-200/80 bg-white shadow-sm'
    )
    // Desktop layout has 16:9 cinematic player box and YouTube-style channel bar
    expect(viewerCode).toContain('aspect-video w-full')
    expect(viewerCode).toContain('useIsMobile')
    // Mobile layout has Instagram Live style full-bleed 9:16 portrait
    expect(viewerCode).toContain('h-[100dvh] w-full')
    expect(viewerCode).toContain('Instagram Live')
  })

  it('3. Accurate viewer count: Counts unique devices (including unauthenticated guests) and excludes broadcasters', () => {
    // Room manager excludes broadcasters
    expect(roomManagerCode).toContain('if (session.isBroadcaster) continue')
    // Room manager counts active devices by viewerId
    expect(roomManagerCode).toContain('dev:${session.viewerId}')
    expect(roomManagerCode).toContain('activeDevices.size')
  })

  it('4. Viewer chat & like: Guest users can immediately chat and like without blocking modal gates', () => {
    // Chat panel supports persistent guest name from localStorage
    expect(chatPanelCode).toContain(
      "localStorage.getItem('affiliate_gadget_guest_name')"
    )
    // Chat panel sends message with effectiveUserName for guests
    expect(chatPanelCode).toContain('onSendMessage(trimmed, effectiveUserName)')
    // Heart/like button triggers onSendLike seamlessly
    expect(chatPanelCode).toContain('onSendLike(1)')
  })

  it('5. Floating Hearts Animation: Heart click produces floating drifting hearts on video canvas', () => {
    // FloatingHearts component creates animated particles with dynamic colors & horizontal offsets
    expect(floatingHeartsCode).toContain('FloatingHeartsOverlay')
    expect(floatingHeartsCode).toContain('animate-float-heart')
    // Floating hearts overlay mounted on broadcaster and viewer screens
    expect(broadcasterCode).toContain(
      '<FloatingHeartsOverlay triggerCount={likeCount} />'
    )
    expect(viewerCode).toContain(
      '<FloatingHeartsOverlay triggerCount={likeCount} />'
    )
    // Keyframes defined in globals.css
    expect(globalsCssCode).toContain('@keyframes float-heart')
    expect(globalsCssCode).toContain('animation: float-heart')
    expect(globalsCssCode).toContain('.animate-float-heart')
  })

  it('6. Floating Pinned Product: Pinned item appears at bottom on mobile and horizontal banner on desktop', () => {
    // LiveProductPin mounted on broadcaster canvas
    expect(broadcasterCode).toContain('<LiveProductPin')
    expect(broadcasterCode).toContain('product={pinnedProduct}')
    expect(broadcasterCode).toContain('isBroadcaster={true}')
    // Viewer renders pinned product at the bottom of the screen on mobile
    expect(viewerCode).toContain('{pinnedProduct && (')
    expect(viewerCode).toContain('Disematkan Host')
    // Has product thumbnail, title, price, and CTA link
    expect(productPinCode).toContain('product.productPrice')
    expect(productPinCode).toContain('product.productTitle')
  })
})
