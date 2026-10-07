import { describe, it, expect, vi } from 'vitest'
import { GET } from '@/app/api/stores/[slug]/route'
import prisma from '@/lib/db'

vi.mock('@/lib/db', () => ({
  default: {
    store: {
      findUnique: vi.fn(),
    },
  },
}))

describe('Store Public API Sanitization Suite', () => {
  it('1. should return 404 if store is not found or isActive is false', async () => {
    vi.mocked(prisma.store.findUnique).mockResolvedValueOnce(null)

    const req = new Request('http://localhost:3000/api/stores/toko-tidak-ada')
    const res = await GET(req, {
      params: Promise.resolve({ slug: 'toko-tidak-ada' }),
    })

    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.success).toBe(false)
    expect(data.error).toBe('Toko tidak ditemukan')

    // Test inactive store
    vi.mocked(prisma.store.findUnique).mockResolvedValueOnce({
      id: 'store-inactive',
      isActive: false,
    } as any)

    const resInactive = await GET(req, {
      params: Promise.resolve({ slug: 'toko-inactive' }),
    })
    expect(resInactive.status).toBe(404)
  })

  it('2. should strictly whitelist public fields and exclude bank accounts & sensitive tax/internal fields', async () => {
    const mockStoreFromDb = {
      id: 'store-1',
      name: 'Affiliate Gadget Roxy Mas',
      slug: 'affiliate-gadget-roxy-mas',
      companyName: 'PT Gadget Jaya Sentosa',
      taxId: '01.234.567.8-012.000',
      tagline: 'Pusat Smartphone Roxy Mas',
      description: 'Gerai resmi unit second garansi 30 hari.',
      logo: 'https://example.com/logo.jpg',
      banner: 'https://example.com/banner.jpg',
      address: 'ITC Roxy Mas Lt. 2 No. 15',
      city: 'Jakarta Pusat',
      province: 'DKI Jakarta',
      postalCode: '10150',
      latitude: -6.1627,
      longitude: 106.8049,
      phone: '02163851122',
      whatsapp: '081234567890',
      email: 'roxy@affiliategadget.com',
      rating: 4.9,
      totalReview: 520,
      totalSales: 1200,
      isActive: true,
      schedules: [
        {
          id: 's-1',
          day: 'MONDAY',
          openTime: '10:00',
          closeTime: '20:30',
          isClosed: false,
        },
      ],
      products: [],
    }

    vi.mocked(prisma.store.findUnique).mockResolvedValueOnce(
      mockStoreFromDb as any
    )

    const req = new Request('http://localhost:3000/api/stores/roxy')
    const res = await GET(req, { params: Promise.resolve({ slug: 'roxy' }) })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    const store = json.data

    // Whitelisted fields present
    expect(store.id).toBe('store-1')
    expect(store.name).toBe('Affiliate Gadget Roxy Mas')
    expect(store.companyName).toBe('PT Gadget Jaya Sentosa')
    expect(store.taxId).toBe('01.234.567.8-012.000')
    expect(store.schedules).toHaveLength(1)

    // SENSITIVE DATA EXCLUSION AUDIT:
    // Bank accounts must NEVER be leaked in public store endpoint
    expect(store.bankAccounts).toBeUndefined()
    expect(store.commissionRate).toBeUndefined()
    expect(store.kppName).toBeUndefined()
    expect(store.vatRate).toBeUndefined()
    expect(store.taxType).toBeUndefined()
    expect(store.defaultPackingFee).toBeUndefined()
  })
})
