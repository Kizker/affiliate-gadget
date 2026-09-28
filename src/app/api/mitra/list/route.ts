import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { ensureMitrasExist } from '@/lib/mitra-seed-data'

export const dynamic = 'force-dynamic'

// Haversine formula to calculate distance between two points
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// GET /api/mitra/list - Get public list of approved mitras
export async function GET(request: NextRequest) {
  try {
    // Ensure default official mitras exist if database table is currently empty
    await ensureMitrasExist().catch((err) => {
      console.error('Failed to auto-seed default mitras:', err)
    })

    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    const search = searchParams.get('search')
    const service = searchParams.get('service')
    const sortBy = searchParams.get('sortBy') || 'rating' // 'rating' | 'distance' | 'review'
    const userLat = searchParams.get('lat')
    const userLng = searchParams.get('lng')

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

    // If sorting by distance, only include mitras with coordinates
    if (sortBy === 'distance' && userLat && userLng) {
      where.latitude = { not: null }
      where.longitude = { not: null }
    }

    // Determine order by
    let orderBy: Record<string, string>[] = [
      { rating: 'desc' },
      { totalReview: 'desc' },
    ]
    if (sortBy === 'review') {
      orderBy = [{ totalReview: 'desc' }, { rating: 'desc' }]
    }
    // Distance sorting is handled post-query

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
        orderBy,
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
        orderBy,
      })
    }

    // Transform data for frontend
    let transformedMitras = mitras.map((mitra) => {
      let distance: number | null = null

      // Calculate distance if user location is provided and mitra has coordinates
      if (userLat && userLng && mitra.latitude && mitra.longitude) {
        distance = calculateDistance(
          parseFloat(userLat),
          parseFloat(userLng),
          mitra.latitude,
          mitra.longitude
        )
      }

      // Build Google Maps URL from coordinates or address
      const googleMapsUrl =
        mitra.latitude && mitra.longitude
          ? `https://maps.google.com/?q=${mitra.latitude},${mitra.longitude}`
          : `https://maps.google.com/?q=${encodeURIComponent(mitra.address + ', ' + mitra.city)}`

      return {
        id: mitra.id,
        businessName: mitra.businessName,
        tagline: mitra.tagline,
        description: mitra.description,
        banner: mitra.banner || mitra.images[0]?.url || null,
        city: mitra.city,
        province: mitra.province,
        address: mitra.address,
        phone: mitra.phone,
        whatsapp: mitra.whatsapp,
        rating: mitra.rating,
        totalReview: mitra.totalReview,
        reviewCount: mitra._count.reviews,
        features: mitra.features,
        services: mitra.services,
        weekdayHours: mitra.weekdayHours,
        weekendHours: mitra.weekendHours,
        latitude: mitra.latitude,
        longitude: mitra.longitude,
        googleMapsUrl,
        distance,
      }
    })

    // Sort by distance if requested
    if (sortBy === 'distance' && userLat && userLng) {
      transformedMitras = transformedMitras
        .filter((m) => m.distance !== null)
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
    }

    // Ensure fresh response on every request
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
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
