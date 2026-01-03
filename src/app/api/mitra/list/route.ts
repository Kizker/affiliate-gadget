import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/mitra/list - Get public list of approved mitras
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    const search = searchParams.get('search')
    const service = searchParams.get('service')

    // Build where clause
    const where: Record<string, unknown> = {
      isApproved: true,
      isActive: true,
    }

    // Filter by city
    if (city && city !== 'all') {
      where.city = city
    }

    // Search by business name or description
    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tagline: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Filter by service (search in services relation)
    let mitras
    if (service && service !== 'all') {
      mitras = await prisma.mitra.findMany({
        where: {
          ...where,
          services: {
            some: {
              name: { contains: service, mode: 'insensitive' },
            },
          },
        },
        include: {
          services: {
            select: {
              id: true,
              name: true,
              icon: true,
              price: true,
            },
            take: 5,
          },
          images: {
            where: { isBanner: true },
            take: 1,
          },
          _count: {
            select: {
              reviews: true,
            },
          },
        },
        orderBy: [{ rating: 'desc' }, { totalReview: 'desc' }],
      })
    } else {
      mitras = await prisma.mitra.findMany({
        where,
        include: {
          services: {
            select: {
              id: true,
              name: true,
              icon: true,
              price: true,
            },
            take: 5,
          },
          images: {
            where: { isBanner: true },
            take: 1,
          },
          _count: {
            select: {
              reviews: true,
            },
          },
        },
        orderBy: [{ rating: 'desc' }, { totalReview: 'desc' }],
      })
    }

    // Transform data for frontend
    const transformedMitras = mitras.map((mitra) => ({
      id: mitra.id,
      businessName: mitra.businessName,
      tagline: mitra.tagline,
      description: mitra.description,
      banner: mitra.banner || mitra.images[0]?.url || null,
      city: mitra.city,
      address: mitra.address,
      phone: mitra.phone,
      rating: mitra.rating,
      totalReview: mitra.totalReview,
      reviewCount: mitra._count.reviews,
      services: mitra.services,
      weekdayHours: mitra.weekdayHours,
      weekendHours: mitra.weekendHours,
    }))

    // Cache response for 60 seconds, serve stale for up to 5 minutes while revalidating
    const headers = {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    }

    return NextResponse.json(
      {
        mitras: transformedMitras,
        total: transformedMitras.length,
      },
      { headers }
    )
  } catch (error) {
    console.error('Error fetching mitra list:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
