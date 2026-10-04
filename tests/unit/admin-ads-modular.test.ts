import { describe, it, expect } from 'vitest'
import {
  calculateDurationText,
  computeTargetUrl,
  getAdTimingInfo,
  PRESET_BANNERS,
  InternalAdItem,
  CurrentStoreInfo,
  Level1SlotInfo,
} from '@/components/admin/ads/types'

describe('Admin Ads Modular Decomposition', () => {
  it('exports all expected types, presets and calculators', () => {
    expect(calculateDurationText).toBeDefined()
    expect(computeTargetUrl).toBeDefined()
    expect(getAdTimingInfo).toBeDefined()
    expect(Array.isArray(PRESET_BANNERS)).toBe(true)
    expect(PRESET_BANNERS.length).toBeGreaterThan(0)
  })

  describe('calculateDurationText', () => {
    it('handles null or empty endDateStr for LEVEL_1 and LEVEL_2', () => {
      expect(calculateDurationText('2026-10-01', null, 'LEVEL_1')).toBe(
        'Durasi: 7 Hari'
      )
      expect(calculateDurationText('2026-10-01', undefined, 'LEVEL_1')).toBe(
        'Durasi: 7 Hari'
      )
      expect(calculateDurationText('2026-10-01', null, 'LEVEL_2')).toBe(
        'Target Kemunculan Grid'
      )
      expect(calculateDurationText('2026-10-01', undefined, 'LEVEL_2')).toBe(
        'Target Kemunculan Grid'
      )
    })

    it('calculates duration correctly with endDateStr', () => {
      expect(calculateDurationText('2026-10-01', '2026-10-08', 'LEVEL_1')).toBe(
        'Berdasarkan Hari: 7 Hari'
      )
      expect(calculateDurationText('2026-10-01', '2026-10-15', 'LEVEL_1')).toBe(
        'Berdasarkan Hari: 14 Hari'
      )
      expect(calculateDurationText('2026-10-01', '2026-10-31', 'LEVEL_2')).toBe(
        'Target Grid • 30 Hari'
      )
    })

    it('guarantees at least 1 day when start and end dates are identical', () => {
      expect(calculateDurationText('2026-10-01', '2026-10-01', 'LEVEL_1')).toBe(
        'Berdasarkan Hari: 1 Hari'
      )
    })
  })

  describe('computeTargetUrl', () => {
    const mockStore: CurrentStoreInfo = {
      id: 'store_roxy_1',
      name: 'PT Gadget Jaya Sentosa - Roxy Mas Pusat',
      slug: 'roxy-mas',
      city: 'Jakarta',
    }

    it('generates STORE target URLs', () => {
      expect(computeTargetUrl('STORE', mockStore)).toBe('/toko/roxy-mas')
      expect(computeTargetUrl('STORE', null)).toBe('/toko')
    })

    it('generates STORE_CATALOG target URLs', () => {
      expect(computeTargetUrl('STORE_CATALOG', mockStore)).toBe(
        '/gadget?store=store_roxy_1'
      )
      expect(computeTargetUrl('STORE_CATALOG', null)).toBe('/gadget')
    })

    it('generates PRODUCT target URLs', () => {
      expect(computeTargetUrl('PRODUCT', mockStore, 'prod_samsung_s24')).toBe(
        '/gadget/prod_samsung_s24'
      )
      expect(computeTargetUrl('PRODUCT', null, '')).toBe('/gadget')
    })

    it('generates standard platform feature URLs', () => {
      expect(computeTargetUrl('ALL_CATALOG')).toBe('/gadget')
      expect(computeTargetUrl('SERVICE_LCD')).toBe('/servis-lcd')
      expect(computeTargetUrl('WARRANTY')).toBe('/garansi')
    })

    it('handles CUSTOM target URLs with fallback', () => {
      expect(
        computeTargetUrl(
          'CUSTOM',
          null,
          undefined,
          'https://affiliategadget.id/promo'
        )
      ).toBe('https://affiliategadget.id/promo')
      expect(computeTargetUrl('CUSTOM', null, undefined, '')).toBe('')
    })
  })

  describe('getAdTimingInfo', () => {
    it('calculates active unexpired ad timing correctly', () => {
      const futureDate = new Date(Date.now() + 5 * 86400000).toISOString()
      const ad: InternalAdItem = {
        id: 'ad_active_1',
        title: 'Samsung S24 Ultra Flagship',
        placement: 'HOMEPAGE_HERO',
        imageUrl: '/images/samsung.jpg',
        status: 'APPROVED',
        isActive: true,
        priority: 10,
        clicks: 25,
        impressions: 600,
        startDate: '2026-10-01',
        endDate: futureDate,
        createdAt: '2026-10-01',
      }

      const timing = getAdTimingInfo(ad)
      expect(timing.isApproved).toBe(true)
      expect(timing.isCurrentlyActive).toBe(true)
      expect(timing.isExpired).toBe(false)
      expect(timing.days).toBeGreaterThanOrEqual(4)
      expect(timing.remainingText).toContain('hari')
      expect(timing.isUrgent).toBe(false)
    })

    it('flags ad as urgent when less than 3 days remain', () => {
      const urgentDate = new Date(Date.now() + 1.5 * 86400000).toISOString()
      const ad: InternalAdItem = {
        id: 'ad_urgent_1',
        title: 'Flash Sale Ending Soon',
        placement: 'PROMOTED_LIST',
        imageUrl: '/images/urgent.jpg',
        status: 'APPROVED',
        isActive: true,
        priority: 0,
        clicks: 5,
        impressions: 120,
        startDate: '2026-10-01',
        endDate: urgentDate,
        createdAt: '2026-10-01',
      }

      const timing = getAdTimingInfo(ad)
      expect(timing.isCurrentlyActive).toBe(true)
      expect(timing.isUrgent).toBe(true)
    })

    it('handles expired ads properly', () => {
      const pastDate = new Date(Date.now() - 3600000).toISOString()
      const ad: InternalAdItem = {
        id: 'ad_expired_1',
        title: 'Expired Promo',
        placement: 'HOMEPAGE_HERO',
        imageUrl: '/images/expired.jpg',
        status: 'APPROVED',
        isActive: true,
        priority: 0,
        clicks: 1,
        impressions: 50,
        startDate: '2026-09-01',
        endDate: pastDate,
        createdAt: '2026-09-01',
      }

      const timing = getAdTimingInfo(ad)
      expect(timing.isExpired).toBe(true)
      expect(timing.isCurrentlyActive).toBe(false)
      expect(timing.remainingText).toBe('Masa Tayang Habis')
    })

    it('handles ads without endDate (Aktif Tanpa Batas Waktu)', () => {
      const ad: InternalAdItem = {
        id: 'ad_infinite_1',
        title: 'Permanent Sponsor Banner',
        placement: 'HOMEPAGE_HERO',
        imageUrl: '/images/banner.jpg',
        status: 'APPROVED',
        isActive: true,
        priority: 1,
        clicks: 0,
        impressions: 0,
        startDate: '2026-10-01',
        endDate: null,
        createdAt: '2026-10-01',
      }

      const timing = getAdTimingInfo(ad)
      expect(timing.isCurrentlyActive).toBe(true)
      expect(timing.remainingText).toBe('Aktif Tanpa Batas Waktu')
    })
  })
})
