import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getStoreDetailData } from '@/lib/store-data'
import prisma from '@/lib/db'

vi.mock('@/lib/db', () => ({
  default: {
    store: {
      findUnique: vi.fn(),
    },
    $queryRawUnsafe: vi.fn(),
  },
}))

describe('Store Detail SSR & Lighthouse Optimization Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch store detail with active products, variants, and schedules in SSR', async () => {
    const mockStore = {
      id: 'store-roxy',
      name: 'Affiliate Gadget - Roxy Mas Jakarta',
      slug: 'roxy-mas-jakarta',
      companyName: 'PT Gadget Jaya Perkasa',
      taxId: '01.234.567.8-012.000',
      tagline: 'Pusat Handphone & Servis Terpercaya',
      description: 'Gerai resmi Roxy Mas ITC Jakarta Pusat',
      logo: '/uploads/avatars/roxy.jpg',
      banner: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a',
      address: 'ITC Roxy Mas Lt. 2 No. 45-47',
      city: 'Jakarta Pusat',
      province: 'DKI Jakarta',
      postalCode: '10150',
      latitude: -6.1623,
      longitude: 106.8042,
      phone: '021-63851234',
      whatsapp: '081299998888',
      email: 'roxy@affiliategadget.tech',
      rating: 4.9,
      totalReview: 340,
      totalSales: 1250,
      isActive: true,
      schedules: [
        {
          id: 'sched-1',
          day: 'Senin - Minggu',
          openTime: '10:00',
          closeTime: '21:00',
          isClosed: false,
        },
      ],
      products: [
        {
          id: 'prod-1',
          name: 'iPhone 15 Pro Max 256GB',
          price: 21999000,
          originalPrice: 24999000,
          category: 'Smartphone',
          brand: 'Apple',
          model: 'iPhone 15 Pro Max',
          condition: 'LIKE_NEW',
          stock: 5,
          images: ['/uploads/products/iphone15.jpg'],
          rating: 4.9,
          totalReview: 25,
          isPromoted: true,
          variants: [
            {
              id: 'var-1',
              name: 'Natural Titanium 256GB',
              price: 21999000,
              stock: 3,
              color: 'Natural Titanium',
              storage: '256GB',
            },
          ],
        },
      ],
    }

    vi.mocked(prisma.store.findUnique).mockResolvedValue(mockStore as any)
    vi.mocked((prisma as any).$queryRawUnsafe).mockResolvedValue([
      {
        heroImage: '/images/banners/samsung-hero-flagship.jpg',
        heroMobileImage: '/images/banners/samsung-hero-flagship.jpg',
        heroTitle: 'iPhone 15 Pro Max 8GB/1TB White Titanium',
        heroSubtitle: 'APPLE OFFICIAL',
        heroDescription: 'Dapatkan iPhone 15 Pro Max bergaransi 30 hari.',
      },
    ])

    const data = await getStoreDetailData('roxy-mas-jakarta')

    expect(data).not.toBeNull()
    expect(data?.id).toBe('store-roxy')
    expect(data?.slug).toBe('roxy-mas-jakarta')
    expect(data?.name).toBe('Affiliate Gadget - Roxy Mas Jakarta')
    expect(data?.heroImage).toBe('/images/banners/samsung-hero-flagship.jpg')
    expect(data?.products).toHaveLength(1)
    expect(data?.products[0].variants).toHaveLength(1)
    expect(data?.schedules).toHaveLength(1)
  })

  it('should return null when store is inactive or not found', async () => {
    vi.mocked(prisma.store.findUnique).mockResolvedValue(null)
    const notFoundData = await getStoreDetailData('non-existent-store')
    expect(notFoundData).toBeNull()

    vi.mocked(prisma.store.findUnique).mockResolvedValue({
      id: 'inactive-store',
      isActive: false,
    } as any)
    const inactiveData = await getStoreDetailData('inactive-store')
    expect(inactiveData).toBeNull()
  })

  it('should handle raw query error gracefully and still return store data', async () => {
    const mockStore = {
      id: 'store-solo',
      name: 'Affiliate Gadget - Solo Grand Mall',
      slug: 'solo-grand-mall',
      isActive: true,
      products: [],
      schedules: [],
    }

    vi.mocked(prisma.store.findUnique).mockResolvedValue(mockStore as any)
    vi.mocked((prisma as any).$queryRawUnsafe).mockRejectedValue(
      new Error('Column not found')
    )

    const data = await getStoreDetailData('solo-grand-mall')
    expect(data).not.toBeNull()
    expect(data?.id).toBe('store-solo')
    expect(data?.name).toBe('Affiliate Gadget - Solo Grand Mall')
  })
})
