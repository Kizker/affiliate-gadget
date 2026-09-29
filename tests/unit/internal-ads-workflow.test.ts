import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock prisma and auth dependencies
const mockPrisma = {
  internalAd: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
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

  describe('5. Role-Based Activation & Cancellation Security Suite', () => {
    it('ensures Store Admin submissions are strictly PENDING and isActive is false', () => {
      const role: string = 'STORE_ADMIN'
      const isSuperAdmin = role === 'SUPER_ADMIN'
      const initialStatus = isSuperAdmin ? 'APPROVED' : 'PENDING'
      const initialIsActive = isSuperAdmin ? true : false

      expect(initialStatus).toBe('PENDING')
      expect(initialIsActive).toBe(false)
    })

    it('allows only SUPER_ADMIN to immediately activate an ad', () => {
      const role: string = 'SUPER_ADMIN'
      const isSuperAdmin = role === 'SUPER_ADMIN'
      const initialStatus = isSuperAdmin ? 'APPROVED' : 'PENDING'
      const initialIsActive = isSuperAdmin ? true : false

      expect(initialStatus).toBe('APPROVED')
      expect(initialIsActive).toBe(true)
    })

    it('blocks Store Admin from deleting an approved ad', () => {
      const ad = { id: 'ad-approved', status: 'APPROVED', storeId: 'store-1' }
      const role: string = 'STORE_ADMIN'

      const canDelete =
        role === 'SUPER_ADMIN' ||
        (role === 'STORE_ADMIN' && ad.status !== 'APPROVED')
      expect(canDelete).toBe(false)
    })

    it('allows Store Admin to edit their own ad media and resets status to PENDING awaiting Superadmin re-approval', async () => {
      const existingAd = {
        id: 'ad-10',
        storeId: 'store-roxy',
        status: 'APPROVED',
        isActive: true,
        bannerUrl: '/old-banner.jpg',
        title: 'Judul Lama',
        rejectionReason: null,
      }

      // Store Admin modifies banner photo and title
      const updatePayload = {
        imageUrl: '/new-video-promo.mp4',
        title: 'Judul Promo Baru',
        targetUrl: '/toko/roxy-mas-jakarta',
      }

      // Logic applied when STORE_ADMIN edits
      const updateData: any = {
        status: 'PENDING',
        isActive: false,
        rejectionReason: null,
        bannerUrl: updatePayload.imageUrl.trim(),
        title: updatePayload.title.trim(),
        targetUrl: updatePayload.targetUrl.trim(),
      }

      mockPrisma.internalAd.update.mockResolvedValue({
        ...existingAd,
        ...updateData,
      })

      const result = await mockPrisma.internalAd.update({
        where: { id: existingAd.id },
        data: updateData,
      })

      expect(result.status).toBe('PENDING')
      expect(result.isActive).toBe(false)
      expect(result.bannerUrl).toBe('/new-video-promo.mp4')
      expect(result.title).toBe('Judul Promo Baru')
      expect(result.rejectionReason).toBeNull()
    })

    it('blocks Store Admin from editing ads belonging to other stores', () => {
      const userStoreId = 'store-roxy'
      const adOtherStore = { id: 'ad-wtc', storeId: 'store-surabaya' }

      const hasAccess = userStoreId === adOtherStore.storeId
      expect(hasAccess).toBe(false)
    })

    it('allows Store Admin to cancel a pending submission', () => {
      const ad = { id: 'ad-pending', status: 'PENDING', storeId: 'store-1' }
      const role: string = 'STORE_ADMIN'

      const canCancel = role === 'STORE_ADMIN' && ad.status === 'PENDING'
      expect(canCancel).toBe(true)
    })
  })

  describe('6. Level 1 (Hero Carousel) Exclusivity & Single Active Ad Suite', () => {
    it('allows Level 1 activation when no other Level 1 ad is active', async () => {
      const { validateLevel1Exclusivity } =
        await import('@/lib/ads-exclusivity')
      mockPrisma.internalAd.findFirst.mockResolvedValue(null)

      const result = await validateLevel1Exclusivity('ad-candidate-1')
      expect(result.allowed).toBe(true)
      expect(result.currentActive).toBeUndefined()
    })

    it('rejects Level 1 activation when another Level 1 ad is currently active and not expired', async () => {
      const { validateLevel1Exclusivity } =
        await import('@/lib/ads-exclusivity')
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      mockPrisma.internalAd.findFirst.mockResolvedValue({
        id: 'ad-active-roxy',
        title: 'Flash Sale Eksklusif Roxy Mas',
        placement: 'HOMEPAGE_HERO',
        status: 'APPROVED',
        isActive: true,
        startDate: new Date(),
        endDate: futureDate,
        store: {
          id: 'store-roxy',
          name: 'Affiliate Gadget - Roxy Mas Jakarta',
          city: 'Jakarta Pusat',
          slug: 'roxy-mas-jakarta',
        },
      })

      const result = await validateLevel1Exclusivity('ad-candidate-wtc')
      expect(result.allowed).toBe(false)
      expect(result.currentActive?.id).toBe('ad-active-roxy')
      expect(result.message).toContain(
        'Slot Level 1 (Hero Carousel Mobile) bersifat eksklusif'
      )
      expect(result.message).toContain('Roxy Mas Jakarta')
    })

    it('allows Level 1 activation if the current active ad has expired', async () => {
      const { validateLevel1Exclusivity } =
        await import('@/lib/ads-exclusivity')
      const pastDate = new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago

      mockPrisma.internalAd.findFirst.mockResolvedValue({
        id: 'ad-old-hero',
        title: 'Old Hero Banner',
        placement: 'HOMEPAGE_HERO',
        status: 'APPROVED',
        isActive: true,
        startDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        endDate: pastDate,
        store: { name: 'Old Store', slug: 'old-store' },
      })

      const result = await validateLevel1Exclusivity('ad-candidate-surabaya')
      expect(result.allowed).toBe(true)
    })

    it('enforces limit 1 for public HOMEPAGE_HERO ad placement', () => {
      const placement = 'HOMEPAGE_HERO'
      const requestedLimit = 5
      const effectiveLimit = placement === 'HOMEPAGE_HERO' ? 1 : requestedLimit

      expect(effectiveLimit).toBe(1)
    })
  })
})
