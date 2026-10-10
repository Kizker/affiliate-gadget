import { describe, it, expect, vi } from 'vitest'
import { getStoresDirectoryData } from '@/lib/store-data'
import prisma from '@/lib/db'

vi.mock('@/lib/db', () => ({
  default: {
    store: {
      findMany: vi.fn(),
    },
  },
}))

describe('Store Directory SSR & Lighthouse Optimization Suite', () => {
  it('should fetch active stores directory with relations and count in SSR', async () => {
    const mockStores = [
      {
        id: 'store-1',
        name: 'Affiliate Gadget - Roxy Mas Jakarta',
        slug: 'roxy-mas-jakarta',
        city: 'Jakarta Pusat',
        address: 'ITC Roxy Mas Lt. 2 No. 45-47',
        logo: '/uploads/avatars/1789121012957-ql3275.jpg',
        banner: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a',
        rating: 4.9,
        totalReview: 310,
        isOwnerStore: true,
        isActive: true,
        _count: { products: 12, orders: 40 },
        schedules: [],
        bankAccounts: [],
      },
      {
        id: 'store-2',
        name: 'Affiliate Gadget - WTC Surabaya',
        slug: 'wtc-surabaya',
        city: 'Surabaya',
        address: 'WTC Surabaya Lt. 3 No. 312',
        logo: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97',
        banner: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5',
        rating: 4.8,
        totalReview: 180,
        isOwnerStore: false,
        isActive: true,
        _count: { products: 8, orders: 25 },
        schedules: [],
        bankAccounts: [],
      },
    ]

    vi.mocked(prisma.store.findMany).mockResolvedValue(mockStores as any)

    const data = await getStoresDirectoryData()

    expect(data).toHaveLength(2)
    expect(data[0].id).toBe('store-1')
    expect(data[0].city).toBe('Jakarta Pusat')
    expect(data[1].id).toBe('store-2')
    expect(data[1].slug).toBe('wtc-surabaya')
    expect(prisma.store.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      include: {
        bankAccounts: true,
        schedules: true,
        _count: {
          select: {
            products: true,
            orders: true,
          },
        },
      },
      orderBy: [{ isOwnerStore: 'desc' }, { rating: 'desc' }],
    })
  })

  it('should handle database errors gracefully and return empty array', async () => {
    vi.mocked(prisma.store.findMany).mockRejectedValue(
      new Error('DB connection error')
    )

    const data = await getStoresDirectoryData()
    expect(data).toEqual([])
  })
})
