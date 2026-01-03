import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/mitra/[id] - Get detailed mitra profile by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch mitra with all relations
    const mitra = await prisma.mitra.findUnique({
      where: { id },
      include: {
        services: {
          orderBy: { createdAt: 'asc' },
        },
        images: {
          orderBy: { createdAt: 'asc' },
        },
        reviews: {
          include: {
            user: {
              select: {
                name: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    if (!mitra) {
      return NextResponse.json({ error: 'Mitra not found' }, { status: 404 })
    }

    // Only return approved mitras for public access
    if (!mitra.isApproved || !mitra.isActive) {
      return NextResponse.json(
        { error: 'Mitra not available' },
        { status: 404 }
      )
    }

    // Transform reviews data
    const transformedReviews = mitra.reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      userName: review.user.name || 'Anonymous',
      userImage: review.user.image,
    }))

    // Calculate if currently open
    const now = new Date()
    const dayOfWeek = now.getDay() // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const currentHours = isWeekend ? mitra.weekendHours : mitra.weekdayHours

    let isOpen = false
    if (currentHours) {
      // Simple check - you can make this more sophisticated
      isOpen = true // For now, assume open if hours are set
    }

    // Cache mitra details for 2 minutes - semi-static content
    return NextResponse.json(
      {
        id: mitra.id,
        businessName: mitra.businessName,
        tagline: mitra.tagline,
        description: mitra.description,
        banner: mitra.banner,
        address: mitra.address,
        city: mitra.city,
        province: mitra.province,
        phone: mitra.phone,
        whatsapp: mitra.whatsapp,
        email: mitra.email,
        website: mitra.website,
        features: mitra.features,
        weekdayHours: mitra.weekdayHours,
        weekendHours: mitra.weekendHours,
        latitude: mitra.latitude,
        longitude: mitra.longitude,
        rating: mitra.rating,
        totalReview: mitra.totalReview,
        isOpen,
        services: mitra.services,
        images: mitra.images,
        reviews: transformedReviews,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching mitra detail:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
