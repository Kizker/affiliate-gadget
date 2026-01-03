import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const search = searchParams.get('search') || ''
    const availability = searchParams.get('availability') // 'available' or 'all'
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const minPrice = searchParams.get('minPrice')
      ? parseFloat(searchParams.get('minPrice')!)
      : undefined
    const maxPrice = searchParams.get('maxPrice')
      ? parseFloat(searchParams.get('maxPrice')!)
      : undefined

    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = {
      isActive: true, // Only show active items to public
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (availability === 'available') {
      where.stock = { gt: 0 }
    }

    // Add price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.pricePerDay = {}
      if (minPrice !== undefined)
        (where.pricePerDay as Record<string, unknown>).gte = minPrice
      if (maxPrice !== undefined)
        (where.pricePerDay as Record<string, unknown>).lte = maxPrice
    }

    // Build orderBy clause
    const orderBy: Record<string, 'asc' | 'desc'> = {}
    orderBy[sortBy] = sortOrder as 'asc' | 'desc'

    // Fetch rental items
    const [rawRentalItems, total] = await Promise.all([
      prisma.rentalItem.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.rentalItem.count({ where }),
    ])

    // Sanitize images (Hotfix for broken seed data)
    const rentalItems = rawRentalItems.map((item) => ({
      ...item,
      images: item.images.map((img) =>
        img.includes('photo-1582719471384-894fbb16f7ce')
          ? 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=550&fit=crop'
          : img
      ),
    }))

    const totalPages = Math.ceil(total / limit)

    // Optimized: Calculate stats from already fetched data instead of 3 separate queries
    const allActiveItems = await prisma.rentalItem.findMany({
      where: { isActive: true },
      select: { stock: true },
    })

    const stats = {
      total: allActiveItems.length,
      available: allActiveItems.filter((item) => item.stock > 0).length,
      unavailable: allActiveItems.filter((item) => item.stock === 0).length,
    }

    // Cache response for 60 seconds, serve stale for up to 5 minutes while revalidating
    const headers = {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    }

    return NextResponse.json(
      {
        rentalItems,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
        stats,
      },
      { headers }
    )
  } catch (error) {
    console.error('Error fetching rental items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rental items' },
      { status: 500 }
    )
  }
}
