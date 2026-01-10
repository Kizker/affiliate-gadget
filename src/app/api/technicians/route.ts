import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/technicians - Public list of active technicians
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const search = searchParams.get('search') || ''
    const specialty = searchParams.get('specialty') || ''
    const sortBy = searchParams.get('sortBy') || 'rating' // rating, experience, reviews

    // Build where clause - only technicians with active users
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      user: {
        isActive: true,
      },
    }

    if (search) {
      where.user = {
        ...where.user,
        name: {
          contains: search,
          mode: 'insensitive',
        },
      }
    }

    if (specialty) {
      where.specialties = {
        has: specialty,
      }
    }

    // For rating/reviews sorting, we MUST fetch ALL technicians first
    // because we need to calculate real ratings from reviews before sorting
    const needsFullFetch = sortBy === 'rating' || sortBy === 'reviews'

    // Determine database order (only for experience which doesn't need calculation)
    let orderBy: Record<string, 'asc' | 'desc'> = { createdAt: 'desc' }
    if (sortBy === 'experience') {
      orderBy = { experience: 'desc' }
    }

    const total = await db.technician.count({ where })

    // Fetch technicians - either all (for rating/reviews) or paginated (for experience)
    const technicians = await db.technician.findMany({
      where,
      ...(needsFullFetch ? {} : { skip: (page - 1) * limit, take: limit }),
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
      orderBy,
    })

    // Fetch ALL reviews for technicians (need all for proper calculation)
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

    // Group reviews by technician ID
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

    // Calculate IMDB-style weighted rating
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

        return {
          ...tech,
          weightedRating,
        }
      }
    )

    // Sort based on sortBy parameter
    let sortedTechnicians = techniciansWithWeightedRating
    if (sortBy === 'rating') {
      sortedTechnicians = [...techniciansWithWeightedRating].sort(
        (a, b) => b.weightedRating - a.weightedRating
      )
    } else if (sortBy === 'reviews') {
      sortedTechnicians = [...techniciansWithWeightedRating].sort(
        (a, b) => b.totalReview - a.totalReview
      )
    }
    // experience is already sorted by database orderBy

    // Apply pagination manually for rating/reviews sort
    const paginatedTechnicians = needsFullFetch
      ? sortedTechnicians.slice((page - 1) * limit, page * limit)
      : sortedTechnicians

    // Cache response
    const headers = {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    }

    return NextResponse.json(
      {
        technicians: paginatedTechnicians,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { headers }
    )
  } catch (error) {
    console.error('Error fetching technicians:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
