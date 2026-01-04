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

    const skip = (page - 1) * limit

    // Build where clause - only technicians with active users (show all regardless of availability)
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

    // Determine sort order
    let orderBy: Record<string, 'asc' | 'desc'> = { rating: 'desc' }
    if (sortBy === 'experience') {
      orderBy = { experience: 'desc' }
    } else if (sortBy === 'reviews') {
      orderBy = { totalReview: 'desc' }
    }

    const total = await db.technician.count({ where })

    const technicians = await db.technician.findMany({
      where,
      skip,
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
      orderBy,
    })

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

    // Cache response for 60 seconds, serve stale for up to 5 minutes while revalidating
    const headers = {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    }

    return NextResponse.json(
      {
        technicians: techniciansWithRealRatings,
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
