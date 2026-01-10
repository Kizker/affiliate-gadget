import { db } from '@/lib/db'
import SewaAlatClientPage from './sewa-alat-client'

// Enable ISR - revalidate every 60 seconds for fresh data
export const revalidate = 60

// Fetch initial data on the server
async function getInitialRentalItems() {
  try {
    const limit = 12
    const page = 1

    const where = {
      isActive: true,
      stock: { gt: 0 },
    }

    const [rawRentalItems, allActiveItems] = await Promise.all([
      db.rentalItem.findMany({
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
      db.rentalItem.findMany({
        where: { isActive: true },
        select: { stock: true },
      }),
    ])

    // Get rental item IDs
    const rentalItemIds = rawRentalItems.map((r) => r.id)

    // Fetch all reviews for these rental items
    const allReviews = await db.review.findMany({
      where: {
        type: 'RENTAL',
        order: {
          items: {
            some: {
              rentalItemId: { in: rentalItemIds },
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
                rentalItemId: true,
              },
            },
          },
        },
      },
    })

    // Group reviews by rental item ID
    const reviewsByRentalItem = new Map<
      string,
      { totalRating: number; count: number }
    >()
    allReviews.forEach((review) => {
      review.order?.items.forEach((item) => {
        if (item.rentalItemId) {
          const existing = reviewsByRentalItem.get(item.rentalItemId) || {
            totalRating: 0,
            count: 0,
          }
          reviewsByRentalItem.set(item.rentalItemId, {
            totalRating: existing.totalRating + review.rating,
            count: existing.count + 1,
          })
        }
      })
    })

    // Calculate totalRented and rating for each item
    const rentalItemsWithStats = rawRentalItems.map((item) => {
      const totalRented = item.orderItems.reduce(
        (sum, orderItem) => sum + orderItem.quantity,
        0
      )
      const reviewData = reviewsByRentalItem.get(item.id) || {
        totalRating: 0,
        count: 0,
      }
      const rating =
        reviewData.count > 0 ? reviewData.totalRating / reviewData.count : 0

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { orderItems, ...itemWithoutOrderItems } = item
      return {
        ...itemWithoutOrderItems,
        images: item.images.map((img) =>
          img.includes('photo-1582719471384-894fbb16f7ce')
            ? 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=550&fit=crop'
            : img
        ),
        totalRented,
        rating: Math.round(rating * 10) / 10,
        reviewCount: reviewData.count,
      }
    })

    // Sort by popularity (totalRented) and take first 12
    rentalItemsWithStats.sort((a, b) => b.totalRented - a.totalRented)
    const rentalItems = rentalItemsWithStats.slice(0, limit)

    // Calculate stats from fetched data
    const stats = {
      total: rawRentalItems.length,
      available: allActiveItems.filter((item) => item.stock > 0).length,
      unavailable: allActiveItems.filter((item) => item.stock === 0).length,
    }

    return {
      rentalItems,
      pagination: {
        page,
        limit,
        total: rawRentalItems.length,
        totalPages: Math.ceil(rawRentalItems.length / limit),
      },
      stats,
    }
  } catch (error) {
    console.error('Error fetching initial rental items:', error)
    return {
      rentalItems: [],
      pagination: {
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 0,
      },
      stats: {
        total: 0,
        available: 0,
        unavailable: 0,
      },
    }
  }
}

export default async function SewaAlatPage() {
  // Fetch data on server - this runs at build time + revalidates every 60s
  const initialData = await getInitialRentalItems()

  return <SewaAlatClientPage initialData={initialData} />
}
