import { db } from '@/lib/db'
import SparepartClientPage from './sparepart-client'

// Enable ISR - revalidate every 60 seconds for fresh data
export const revalidate = 60

// Fetch initial data on the server
async function getInitialProducts() {
  try {
    const limit = 12
    const page = 1

    const where = {
      isActive: true,
      stock: { gt: 0 },
    }

    const [rawProducts, total, categories, brands] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          orderItems: {
            select: {
              quantity: true,
              orderId: true,
            },
          },
        },
      }),
      db.product.count({ where }),
      db.product.groupBy({
        by: ['category'],
        where: { isActive: true },
        _count: true,
      }),
      db.product.groupBy({
        by: ['brand'],
        where: { isActive: true, brand: { not: null } },
        _count: true,
      }),
    ])

    // Get product IDs
    const productIds = rawProducts.map((p) => p.id)

    // Fetch all reviews for these products
    const allReviews = await db.review.findMany({
      where: {
        type: 'PRODUCT',
        order: {
          items: {
            some: {
              productId: { in: productIds },
            },
          },
        },
      },
      select: {
        rating: true,
        order: {
          select: {
            items: {
              select: {
                productId: true,
              },
            },
          },
        },
      },
    })

    // Group reviews by product ID
    const reviewsByProduct = new Map<
      string,
      { totalRating: number; count: number }
    >()
    allReviews.forEach((review) => {
      review.order?.items.forEach((item) => {
        if (item.productId) {
          const existing = reviewsByProduct.get(item.productId) || {
            totalRating: 0,
            count: 0,
          }
          reviewsByProduct.set(item.productId, {
            totalRating: existing.totalRating + review.rating,
            count: existing.count + 1,
          })
        }
      })
    })

    // Calculate totalSold and rating for each product
    const productsWithStats = rawProducts.map((product) => {
      const totalSold = product.orderItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      )
      const reviewData = reviewsByProduct.get(product.id) || {
        totalRating: 0,
        count: 0,
      }
      const rating =
        reviewData.count > 0 ? reviewData.totalRating / reviewData.count : 0

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { orderItems, ...productWithoutItems } = product
      return {
        ...productWithoutItems,
        totalSold,
        rating: Math.round(rating * 10) / 10,
        reviewCount: reviewData.count,
      }
    })

    // Sort by sales (popular) and take first 12
    productsWithStats.sort((a, b) => b.totalSold - a.totalSold)
    const products = productsWithStats.slice(0, limit)

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        categories: categories.map((c) => ({
          value: c.category,
          label: c.category,
          count: c._count,
        })),
        brands: brands.map((b) => ({
          value: b.brand || '',
          label: b.brand || '',
          count: b._count,
        })),
      },
    }
  } catch (error) {
    console.error('Error fetching initial products:', error)
    return {
      products: [],
      pagination: {
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 0,
      },
      filters: {
        categories: [],
        brands: [],
      },
    }
  }
}

export default async function SparepartPage() {
  // Fetch data on server - this runs at build time + revalidates every 60s
  const initialData = await getInitialProducts()

  return <SparepartClientPage initialData={initialData} />
}
