import { describe, it, expect, vi, beforeEach } from 'vitest'
import prisma from '@/lib/db'
import { getGadgetDetail } from '@/lib/gadget-data'

vi.mock('@/lib/db', () => ({
  default: {
    product: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    orderItem: {
      groupBy: vi.fn(),
    },
  },
}))

describe('Gadget Detail SSR & Lighthouse Optimization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch product detail and enrich related candidates with clean JSON serialization', async () => {
    const mockProduct = {
      id: 'prod-macbook-15',
      name: 'Apple MacBook Air 15 M3 16GB/512GB',
      brand: 'Apple',
      category: 'Laptop',
      condition: 'LIKE_NEW',
      price: 21999000,
      costPrice: 19000000,
      originalPrice: 24999000,
      stock: 8,
      weightGram: 1500,
      pricePerKg: 20000,
      images: ['https://example.com/macbook.jpg'],
      specs: { Storage: '512GB', RAM: '16GB' },
      warrantyDays: 30,
      includesCharger: true,
      includesScreenProtector: true,
      includesCase: true,
      isPromoted: false,
      rating: 5.0,
      totalReview: 12,
      isActive: true,
      store: {
        id: 'store-1',
        name: 'Affiliate Gadget - Plaza Medan Fair',
        city: 'Medan',
        products: [],
        _count: { products: 10 },
      },
      variants: [
        {
          id: 'var-1',
          name: '16GB / 512GB - Midnight',
          price: 21999000,
          stock: 4,
          image: 'https://example.com/macbook.jpg',
        },
      ],
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    }

    vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any)
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      {
        id: 'prod-iphone-15',
        name: 'Apple iPhone 15 Pro Max',
        brand: 'Apple',
        category: 'Smartphone',
        condition: 'LIKE_NEW',
        price: 18000000,
        originalPrice: 21000000,
        images: ['https://example.com/iphone.jpg'],
        rating: 4.9,
        totalReview: 20,
        stock: 5,
        warrantyDays: 30,
        includesCharger: true,
        includesScreenProtector: true,
        includesCase: true,
        storeId: 'store-1',
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
        store: {
          id: 'store-1',
          name: 'Affiliate Gadget - Plaza Medan Fair',
          city: 'Medan',
        },
      } as any,
    ])
    vi.mocked(prisma.orderItem.groupBy).mockResolvedValue([
      { productId: 'prod-iphone-15', _sum: { quantity: 15 } } as any,
    ])

    const result = await getGadgetDetail('prod-macbook-15')

    expect(result).not.toBeNull()
    expect(result?.id).toBe('prod-macbook-15')
    expect(result?.name).toBe('Apple MacBook Air 15 M3 16GB/512GB')
    expect(result?.relatedProducts).toBeDefined()
    expect(result?.relatedProducts.length).toBeGreaterThan(0)
    // Date must be cleanly serialized to ISO string
    expect(typeof result?.createdAt).toBe('string')
  })

  it('should fall back to name search if id not found', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.product.findFirst).mockResolvedValue({
      id: 'prod-slug-fallback',
      name: 'MacBook Air 15 M3',
      brand: 'Apple',
      category: 'Laptop',
      condition: 'LIKE_NEW',
      price: 21999000,
      stock: 4,
      images: [],
      variants: [],
      store: { id: 's1', name: 'Store' },
    } as any)
    vi.mocked(prisma.product.findMany).mockResolvedValue([])

    const result = await getGadgetDetail('product-macbook-air-15-m3')

    expect(result).not.toBeNull()
    expect(result?.id).toBe('prod-slug-fallback')
    expect(prisma.product.findFirst).toHaveBeenCalled()
  })

  it('should return null when product is not found', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.product.findFirst).mockResolvedValue(null)

    const result = await getGadgetDetail('invalid-id')
    expect(result).toBeNull()
  })
})
