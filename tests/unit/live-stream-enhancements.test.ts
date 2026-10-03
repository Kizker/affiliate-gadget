import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Live Streaming 6-Item Enhancements Suite', () => {
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

  it('1. Mirror view toggle: Host has toggleable selfie mirror view with scaleX(-1)', () => {
    // Has state isMirrored, default true for front-facing camera
    expect(broadcasterCode).toContain(
      'const [isMirrored, setIsMirrored] = useState(true)'
    )
    // Has style transform scaleX(-1) when active
    expect(broadcasterCode).toContain(
      "style={{ transform: isMirrored ? 'scaleX(-1)' : 'none' }}"
    )
    // Has interactive toggle button with FlipHorizontal icon
    expect(broadcasterCode).toContain('FlipHorizontal')
    expect(broadcasterCode).toContain('setIsMirrored(!isMirrored)')
    expect(broadcasterCode).toContain('Mirror View')
  })

  it('2. Clean White Theme: Studio, chat panel, pinned products, and viewer match white dashboard canvas', () => {
    // Chat panel uses clean white container styling instead of pitch-black
    expect(chatPanelCode).toContain(
      'rounded-3xl border border-slate-200/80 bg-white shadow-sm'
    )
    expect(chatPanelCode).toContain('border-b border-slate-100 bg-slate-50/80')
    // Broadcaster pinned list uses clean white card styling
    expect(broadcasterCode).toContain(
      'rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm'
    )
    // Product pin uses white glassmorphism card
    expect(productPinCode).toContain('bg-white/95')
    expect(productPinCode).toContain('text-slate-900')
    // Viewer layout uses clean white card background
    expect(viewerCode).toContain(
      'rounded-3xl border border-slate-200/80 bg-white'
    )
  })

  it('3. Accurate viewer count: Deduplicates by account (userId) or client visitor ID and excludes broadcasters', () => {
    // Room manager excludes broadcasters
    expect(roomManagerCode).toContain('if (session.isBroadcaster) continue')
    // Room manager deduplicates viewers by userId or viewerId
    expect(roomManagerCode).toContain('user:${session.userId}')
    expect(roomManagerCode).toContain('guest:${session.viewerId}')
    expect(roomManagerCode).toContain('uniqueViewers.size')
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

  it('6. Floating Pinned Product: Pinned item floats at bottom-left of live video with direct checkout', () => {
    // LiveProductPin mounted on bottom-left of broadcaster canvas
    expect(broadcasterCode).toContain('<LiveProductPin')
    expect(broadcasterCode).toContain('product={pinnedProduct}')
    expect(broadcasterCode).toContain('isBroadcaster={true}')
    // LiveProductPin mounted on bottom-left of viewer canvas
    expect(viewerCode).toContain(
      '<LiveProductPin product={pinnedProduct} isBroadcaster={false} />'
    )
    // Has bottom-left positioning class
    expect(broadcasterCode).toContain('absolute bottom-20 left-4 z-30')
    expect(viewerCode).toContain('absolute bottom-16 left-4 z-30')
    // Has product thumbnail, title, price, and CTA link
    expect(productPinCode).toContain('product.productPrice')
    expect(productPinCode).toContain('product.productTitle')
  })
})
