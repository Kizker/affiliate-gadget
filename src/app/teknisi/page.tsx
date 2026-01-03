import { db } from '@/lib/db'
import TeknisiClientPage from './teknisi-client'

// Enable ISR - revalidate every 60 seconds for fresh data
export const revalidate = 60

// Fetch initial data on the server
async function getInitialTechnicians() {
  try {
    const limit = 12
    const page = 1

    const where = {
      isAvailable: true,
      user: {
        isActive: true,
      },
    }

    const [total, technicians] = await Promise.all([
      db.technician.count({ where }),
      db.technician.findMany({
        where,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              phone: true,
            },
          },
          services: {
            where: {
              isActive: true,
            },
            select: {
              id: true,
              name: true,
              description: true,
              category: true,
              price: true,
              duration: true,
            },
          },
        },
        orderBy: { rating: 'desc' },
      }),
    ])

    // Fetch all reviews for these technicians in a single query
    const technicianIds = technicians.map((t) => t.id)
    const allReviews = await db.review.findMany({
      where: {
        type: 'TECHNICIAN',
        order: {
          technicianId: { in: technicianIds },
        },
      },
      select: {
        rating: true,
        order: {
          select: {
            technicianId: true,
          },
        },
      },
    })

    // Group reviews by technician ID in memory
    const reviewsByTechnician = new Map<
      string,
      { totalRating: number; count: number }
    >()

    allReviews.forEach((review) => {
      const techId = review.order?.technicianId
      if (!techId) return

      const existing = reviewsByTechnician.get(techId) || {
        totalRating: 0,
        count: 0,
      }
      reviewsByTechnician.set(techId, {
        totalRating: existing.totalRating + review.rating,
        count: existing.count + 1,
      })
    })

    // Calculate ratings for each technician
    const techniciansWithRealRatings = technicians.map((tech) => {
      const reviewData = reviewsByTechnician.get(tech.id) || {
        totalRating: 0,
        count: 0,
      }
      const averageRating =
        reviewData.count > 0 ? reviewData.totalRating / reviewData.count : 0

      return {
        ...tech,
        rating: averageRating,
        totalReview: reviewData.count,
      }
    })

    return {
      technicians: techniciansWithRealRatings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  } catch (error) {
    console.error('Error fetching initial technicians:', error)
    return {
      technicians: [],
      pagination: {
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 0,
      },
    }
  }
}

export default async function TeknisiPage() {
  // Fetch data on server - this runs at build time + revalidates every 60s
  const initialData = await getInitialTechnicians()

  return <TeknisiClientPage initialData={initialData} />
}
