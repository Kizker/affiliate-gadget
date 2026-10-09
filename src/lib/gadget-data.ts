import prisma from '@/lib/db'
import { sortRelatedProductsByRelevance } from '@/lib/relevance-scoring'

export interface GadgetDetailData {
  id: string
  name: string
  description: string | null
  category: string
  brand: string | null
  model: string | null
  condition: string
  price: number
  costPrice: number
  originalPrice: number | null
  stock: number
  weightGram: number
  pricePerKg: number
  images: string[]
  specs: any
  warrantyDays: number
  includesCharger: boolean
  includesScreenProtector: boolean
  includesCase: boolean
  isPromoted: boolean
  rating: number
  totalReview: number
  isActive: boolean
  store: any
  variants: any[]
  relatedProducts: any[]
  createdAt?: string
  updatedAt?: string
}

/**
 * Fetch complete gadget detail and scored related products for instant SSR hydration.
 */
export async function getGadgetDetail(
  id: string
): Promise<GadgetDetailData | null> {
  try {
    let product = await prisma.product.findUnique({
      where: { id },
      include: {
        store: {
          include: {
            bankAccounts: true,
            schedules: true,
            products: {
              where: { isActive: true, id: { not: id } },
              take: 6,
              select: {
                id: true,
                name: true,
                price: true,
                originalPrice: true,
                images: true,
                rating: true,
                totalReview: true,
                stock: true,
              },
            },
            _count: {
              select: {
                products: true,
              },
            },
          },
        },
        variants: true,
      },
    })

    if (!product) {
      const searchName = id.replace(/^product-/, '').replace(/-/g, ' ')
      product = await prisma.product.findFirst({
        where: {
          name: { contains: searchName, mode: 'insensitive' },
          isActive: true,
        },
        include: {
          store: {
            include: {
              bankAccounts: true,
              schedules: true,
              products: {
                where: { isActive: true },
                take: 6,
                select: {
                  id: true,
                  name: true,
                  price: true,
                  originalPrice: true,
                  images: true,
                  rating: true,
                  totalReview: true,
                  stock: true,
                },
              },
              _count: {
                select: {
                  products: true,
                },
              },
            },
          },
          variants: true,
        },
      })
    }

    if (!product) {
      return null
    }

    const actualId = product.id

    // Ambil seluruh produk aktif untuk rekomendasi bertingkat relevansi
    const allCandidates = await prisma.product.findMany({
      where: {
        isActive: true,
        id: { not: actualId },
      },
      select: {
        id: true,
        name: true,
        brand: true,
        category: true,
        condition: true,
        price: true,
        originalPrice: true,
        images: true,
        rating: true,
        totalReview: true,
        stock: true,
        warrantyDays: true,
        includesCharger: true,
        includesScreenProtector: true,
        includesCase: true,
        storeId: true,
        createdAt: true,
        store: {
          select: { id: true, name: true, city: true },
        },
      },
    })

    // Agregasi penjualan riil untuk skor relevansi
    const candidateIds = allCandidates.map((c) => c.id)
    const salesMap = new Map<string, number>()
    if (candidateIds.length > 0) {
      const salesGroup = await prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          productId: { in: candidateIds },
          order: {
            status: { not: 'CANCELLED' },
          },
        },
        _sum: {
          quantity: true,
        },
      })
      salesGroup.forEach((s) => {
        if (s.productId) {
          salesMap.set(s.productId, s._sum.quantity || 0)
        }
      })
    }

    const enrichedCandidates = allCandidates.map((c) => ({
      ...c,
      has3in1Bonus: Boolean(
        c.includesCharger && c.includesScreenProtector && c.includesCase
      ),
      soldCount: salesMap.get(c.id) || 0,
    }))

    // Urutkan berdasarkan kemiripan merek, kategori, harga, dan performa
    const relatedProducts = sortRelatedProductsByRelevance(
      enrichedCandidates,
      product
    )

    // Kembalikan objek yang ter-serialize bersih JSON
    return JSON.parse(
      JSON.stringify({
        ...product,
        relatedProducts,
      })
    )
  } catch (error) {
    console.error('[getGadgetDetail Error]:', error)
    return null
  }
}
