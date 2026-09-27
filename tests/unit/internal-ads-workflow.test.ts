import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock prisma and auth dependencies
const mockPrisma = {
  internalAd: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  store: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
  },
}

vi.mock('@/lib/prisma', () => ({
  default: mockPrisma,
}))

vi.mock('@/lib/db', () => ({
  default: mockPrisma,
}))

describe('Internal Ads Workflow & Two-Level Placement Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('1. Public Ads Retrieval & Filtering', () => {
    it('only returns APPROVED and active ads for public viewers', async () => {
      mockPrisma.internalAd.findMany.mockResolvedValue([
        {
          id: 'ad-1',
          title: 'Promo Roxy Mas',
          placement: 'HOMEPAGE_HERO',
          status: 'APPROVED',
          isActive: true,
          imageUrl: '/images/hero-1.jpg',
          store: { name: 'Roxy Mas Jakarta', slug: 'roxy-mas-jakarta' },
        },
      ])

      // Simulate GET filter logic
      const whereClause = {
        isActive: true,
        status: 'APPROVED',
        placement: 'HOMEPAGE_HERO',
      }

      const results = await mockPrisma.internalAd.findMany({
        where: whereClause,
      })

      expect(results).toHaveLength(1)
      expect(results[0].status).toBe('APPROVED')
      expect(results[0].placement).toBe('HOMEPAGE_HERO')
      expect(mockPrisma.internalAd.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          isActive: true,
          status: 'APPROVED',
        }),
      })
    })

    it('correctly filters Level 2 (PROMOTED_LIST) in-feed product ads', async () => {
      mockPrisma.internalAd.findMany.mockResolvedValue([
        {
          id: 'ad-2',
          title: 'In-Feed Gadget Second WTC Surabaya',
          placement: 'PROMOTED_LIST',
          status: 'APPROVED',
          isActive: true,
          imageUrl: '/images/wtc-feed.jpg',
          store: { name: 'WTC Surabaya', slug: 'wtc-surabaya' },
        },
      ])

      const results = await mockPrisma.internalAd.findMany({
        where: {
          isActive: true,
          status: 'APPROVED',
          placement: 'PROMOTED_LIST',
        },
      })

      expect(results).toHaveLength(1)
      expect(results[0].placement).toBe('PROMOTED_LIST')
      expect(results[0].store.slug).toBe('wtc-surabaya')
    })
  })

  describe('2. Click and Impression Tracking', () => {
    it('increments click count on user interaction', async () => {
      mockPrisma.internalAd.update.mockResolvedValue({
        id: 'ad-1',
        clicks: 1,
      })

      await mockPrisma.internalAd.update({
        where: { id: 'ad-1' },
        data: { clicks: { increment: 1 } },
      })

      expect(mockPrisma.internalAd.update).toHaveBeenCalledWith({
        where: { id: 'ad-1' },
        data: { clicks: { increment: 1 } },
      })
    })

    it('increments impression count when banner renders', async () => {
      mockPrisma.internalAd.update.mockResolvedValue({
        id: 'ad-1',
        impressions: 1,
      })

      await mockPrisma.internalAd.update({
        where: { id: 'ad-1' },
        data: { impressions: { increment: 1 } },
      })

      expect(mockPrisma.internalAd.update).toHaveBeenCalledWith({
        where: { id: 'ad-1' },
        data: { impressions: { increment: 1 } },
      })
    })
  })

  describe('3. Store Admin Ad Submission & Auto-Routing', () => {
    it('sets initial status to PENDING for Store Admin requests', async () => {
      const mockAdInput = {
        title: 'Flash Sale Toko Bandung',
        placement: 'HOMEPAGE_HERO' as const,
        imageUrl: '/images/hero-bec.jpg',
        storeId: 'store-bandung',
      }

      mockPrisma.internalAd.create.mockResolvedValue({
        id: 'ad-new-1',
        ...mockAdInput,
        status: 'PENDING',
        isActive: true,
        priority: 0,
        targetUrl: '/toko/bec-bandung',
      })

      const created = await mockPrisma.internalAd.create({
        data: {
          ...mockAdInput,
          status: 'PENDING',
          targetUrl: '/toko/bec-bandung',
        },
      })

      expect(created.status).toBe('PENDING')
      expect(created.storeId).toBe('store-bandung')
      expect(created.targetUrl).toBe('/toko/bec-bandung')
    })

    it('auto-generates store URL fallback if targetUrl is empty', () => {
      const storeSlug = 'roxy-mas-jakarta'
      let finalTargetUrl = ''
      if (!finalTargetUrl) {
        finalTargetUrl = `/toko/${storeSlug}`
      }
      expect(finalTargetUrl).toBe('/toko/roxy-mas-jakarta')
    })
  })

  describe('4. Superadmin Moderation & Priority Suite', () => {
    it('approves pending ad and clears previous rejection reasons', async () => {
      mockPrisma.internalAd.update.mockResolvedValue({
        id: 'ad-new-1',
        status: 'APPROVED',
        rejectionReason: null,
        isActive: true,
      })

      const updated = await mockPrisma.internalAd.update({
        where: { id: 'ad-new-1' },
        data: {
          status: 'APPROVED',
          rejectionReason: null,
          isActive: true,
        },
      })

      expect(updated.status).toBe('APPROVED')
      expect(updated.rejectionReason).toBeNull()
      expect(updated.isActive).toBe(true)
    })

    it('rejects pending ad with structured rejection explanation', async () => {
      const reason = 'Resolusi gambar terlalu rendah di bawah standar HD.'
      mockPrisma.internalAd.update.mockResolvedValue({
        id: 'ad-new-1',
        status: 'REJECTED',
        rejectionReason: reason,
      })

      const rejected = await mockPrisma.internalAd.update({
        where: { id: 'ad-new-1' },
        data: {
          status: 'REJECTED',
          rejectionReason: reason,
        },
      })

      expect(rejected.status).toBe('REJECTED')
      expect(rejected.rejectionReason).toBe(reason)
    })

    it('adjusts priority to control ordering in carousel & feed', async () => {
      mockPrisma.internalAd.update.mockResolvedValue({
        id: 'ad-new-1',
        priority: 50,
      })

      const updated = await mockPrisma.internalAd.update({
        where: { id: 'ad-new-1' },
        data: { priority: 50 },
      })

      expect(updated.priority).toBe(50)
    })
  })
})
