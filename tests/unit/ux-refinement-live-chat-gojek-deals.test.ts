import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import {
  createLiveDeal,
  getActiveDealForStream,
  getActiveDealsForStream,
  deactivateStreamDeals,
} from '@/lib/live-deals'

describe('UX Refinement: Live Redirect, Single Chat Context, 1-Line Gojek Badge, Live Deals Setup', () => {
  it('1. /live page redirects to / and viewer close/exit links point to /', () => {
    const livePagePath = path.join(process.cwd(), 'src/app/live/page.tsx')
    const livePageCode = fs.readFileSync(livePagePath, 'utf-8')
    expect(livePageCode).toContain("redirect('/')")

    const viewerPath = path.join(
      process.cwd(),
      'src/components/live/live-stream-viewer.tsx'
    )
    const viewerCode = fs.readFileSync(viewerPath, 'utf-8')
    expect(viewerCode).not.toContain('href="/live"')
    expect(viewerCode).toContain('href="/"')
  })

  it('2. Customer chat page renders mutually exclusive context and no duplicate order bars', () => {
    const chatPagePath = path.join(
      process.cwd(),
      'src/app/dashboard/customer/chat/page.tsx'
    )
    const chatPageCode = fs.readFileSync(chatPagePath, 'utf-8')

    // Mutual exclusivity
    expect(chatPageCode).toContain('activeOrderContext ? (')
    expect(chatPageCode).toContain(') : activeServiceContext ? (')
    expect(chatPageCode).toContain(') : activeProductContext ? (')

    // No duplicate "Membahas Pesanan:" block
    expect(chatPageCode).not.toContain('Membahas Pesanan:')

    // When orderId is present in URL params, product context is not set
    expect(chatPageCode).toContain('if (paramOrderId) {')
    expect(chatPageCode).toContain('setActiveProductContext(null)')
  })

  it('3. Checkout Gojek distance badges are strictly on 1 line with whitespace-nowrap and leading-none', () => {
    const mobileCheckoutPath = path.join(
      process.cwd(),
      'src/components/checkout/mobile-shopee-checkout-view.tsx'
    )
    const mobileCheckoutCode = fs.readFileSync(mobileCheckoutPath, 'utf-8')

    expect(mobileCheckoutCode).toContain('whitespace-nowrap')
    expect(mobileCheckoutCode).toContain('{shippingDistanceKm.toFixed(1)} km')
    expect(mobileCheckoutCode).toContain('leading-none')
  })

  it('4. Broadcaster supports special live discount inputs during setup and desktop catalog', () => {
    const broadcasterPath = path.join(
      process.cwd(),
      'src/components/live/live-stream-broadcaster.tsx'
    )
    const broadcasterCode = fs.readFileSync(broadcasterPath, 'utf-8')

    // Setup discounts state
    expect(broadcasterCode).toContain('setupDiscounts')
    // Deal creation in handleCreateStream
    expect(broadcasterCode).toContain('/api/live-streams/${json.data.id}/deals')
    // Diskon live input in setup product list
    expect(broadcasterCode).toContain('Diskon Live (Rp):')
    // Desktop catalog discount input
    expect(broadcasterCode).toContain('Diskon (Rp):')
  })

  it('5. live-deals supports multiple distinct products discounted per stream', () => {
    const testStreamId = `test-stream-${Date.now()}`
    const deal1 = createLiveDeal({
      streamId: testStreamId,
      productId: 'prod-1',
      originalPrice: 1000000,
      discountPrice: 850000,
    })

    const deal2 = createLiveDeal({
      streamId: testStreamId,
      productId: 'prod-2',
      originalPrice: 2000000,
      discountPrice: 1750000,
    })

    const allDeals = getActiveDealsForStream(testStreamId)
    expect(allDeals.length).toBe(2)

    const p1Deal = getActiveDealForStream(testStreamId, 'prod-1')
    expect(p1Deal?.discountPrice).toBe(850000)

    const p2Deal = getActiveDealForStream(testStreamId, 'prod-2')
    expect(p2Deal?.discountPrice).toBe(1750000)

    // Cleanup
    deactivateStreamDeals(testStreamId)
    expect(getActiveDealsForStream(testStreamId).length).toBe(0)
  })
})
