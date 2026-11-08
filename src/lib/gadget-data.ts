import prisma from '@/lib/db'
import { sortRelatedProductsByRelevance } from '@/lib/relevance-scoring'
import { getEtalaseByIdOrProductId, getEtalases } from '@/lib/etalase-db'

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
  isEtalase?: boolean
  etalaseId?: string
  etalaseName?: string
  etalaseCustomTitle?: string | null
  etalaseCustomCoverImage?: string | null
  etalasePriceMode?: string
  etalaseCustomPrice?: number | null
  etalaseDisplayPrice?: number
  etalaseTotalStock?: number
  etalaseSoldCount?: number
  activeProductId?: string
  etalaseItems?: any[]
  createdAt?: string
  updatedAt?: string
}

/**
 * Fetch complete gadget/etalase detail and scored related etalases/products for instant SSR hydration.
 */
export async function getGadgetDetail(
  id: string
): Promise<GadgetDetailData | null> {
  try {
    // 1. Cek apakah ID adalah Etalase ID atau Product ID yang terdaftar di Etalase
    const etalase = await getEtalaseByIdOrProductId(id)
    if (etalase && etalase.defaultProduct) {
      const defProd = etalase.defaultProduct
      const allEtalases = await getEtalases({ onlyActive: true })
      const otherEtalases = allEtalases.filter((e) => e.id !== etalase.id)

      // Produk lain dari toko yang sama (Etalase lain milik toko ini)
      const sameStoreEtalases = otherEtalases
        .filter((e) => e.storeId === etalase.storeId)
        .slice(0, 6)

      const relatedEtalases = sortRelatedProductsByRelevance(
        otherEtalases.map((e) => ({
          ...e,
          has3in1Bonus: Boolean(
            e.includesCharger && e.includesScreenProtector && e.includesCase
          ),
        })),
        etalase
      )

      const storeWithProducts = etalase.store
        ? {
            ...etalase.store,
            products:
              sameStoreEtalases.length > 0
                ? sameStoreEtalases
                : etalase.etalaseItems
                    .filter((i) => i.productId !== defProd.id)
                    .map((i) => i.product)
                    .slice(0, 6),
          }
        : null

      return JSON.parse(
        JSON.stringify({
          ...defProd,
          id: etalase.id,
          activeProductId: defProd.id,
          name: etalase.name,
          description: etalase.description || defProd.description,
          brand: etalase.brand || defProd.brand,
          category: etalase.category || defProd.category,
          price: defProd.price,
          originalPrice: defProd.originalPrice || etalase.originalPrice,
          stock: defProd.stock,
          images: etalase.images.length > 0 ? etalase.images : defProd.images,
          rating: etalase.rating,
          totalReview: etalase.totalReview,
          store: storeWithProducts,
          variants: defProd.variants || [],
          relatedProducts: relatedEtalases,
          isEtalase: true,
          etalaseId: etalase.id,
          etalaseName: etalase.name,
          etalaseCustomTitle: etalase.customTitle,
          etalaseCustomCoverImage: etalase.customCoverImage,
          etalasePriceMode: etalase.priceMode,
          etalaseCustomPrice: etalase.customPrice,
          etalaseDisplayPrice: etalase.price,
          etalaseTotalStock: etalase.stock,
          etalaseSoldCount: etalase.soldCount,
          etalaseItems: etalase.etalaseItems,
        })
      )
    }
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
