import { db } from '@/lib/db'
import TeknisiClientPage from './teknisi-client'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

// Enable ISR - revalidate every 60 seconds for fresh data
export const revalidate = 60

// Fetch initial data on the server
async function getInitialTechnicians() {
  try {
    const limit = 12
    const page = 1

    // Show all technicians (online and offline) with active user accounts
    const where = {
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

    // Calculate IMDB-style weighted rating for better sorting
    // Formula: WR = (v ÷ (v+m)) × R + (m ÷ (v+m)) × C
    // v = number of reviews, R = average rating
    // m = minimum reviews threshold, C = mean rating of all technicians
    const m = 1 // Minimum reviews threshold
    const allRatings = techniciansWithRealRatings.filter(
      (t) => t.totalReview > 0
    )
    const C =
      allRatings.length > 0
        ? allRatings.reduce((sum, t) => sum + t.rating, 0) / allRatings.length
        : 0

    const techniciansWithWeightedRating = techniciansWithRealRatings.map(
      (tech) => {
        const v = tech.totalReview
        const R = tech.rating
        const weightedRating = v > 0 ? (v / (v + m)) * R + (m / (v + m)) * C : 0

        return { ...tech, weightedRating }
      }
    )

    // Sort by weighted rating (considers both rating AND number of reviews)
    techniciansWithWeightedRating.sort(
      (a, b) => b.weightedRating - a.weightedRating
    )

    return {
      technicians: techniciansWithWeightedRating,
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

function TeknisiLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  )
}

export default async function TeknisiPage() {
  // Fetch data on server - this runs at build time + revalidates every 60s
  const initialData = await getInitialTechnicians()

  return (
    <Suspense fallback={<TeknisiLoading />}>
      <TeknisiClientPage initialData={initialData} />
    </Suspense>
  )
}
