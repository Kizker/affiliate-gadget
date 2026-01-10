import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const search = searchParams.get('search') || ''
    const availability = searchParams.get('availability') // 'available' or 'all'
    const sortBy = searchParams.get('sortBy') || 'popular'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const minPrice = searchParams.get('minPrice')
      ? parseFloat(searchParams.get('minPrice')!)
      : undefined
    const maxPrice = searchParams.get('maxPrice')
      ? parseFloat(searchParams.get('maxPrice')!)
      : undefined

    // Build where clause - only show items with stock > 0
    const where: Record<string, unknown> = {
      isActive: true,
      stock: { gt: 0 },
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

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.pricePerDay = {}
      if (minPrice !== undefined)
        (where.pricePerDay as Record<string, unknown>).gte = minPrice
      if (maxPrice !== undefined)
        (where.pricePerDay as Record<string, unknown>).lte = maxPrice
    }

    // Fetch ALL rental items with order items for popularity calculation
    const allRentalItems = await prisma.rentalItem.findMany({
      where,
      include: {
        orderItems: {
          select: {
            quantity: true,
            rentalDays: true,
            orderId: true,
          },
        },
      },
    })

    const total = allRentalItems.length

    // Get rental item IDs
    const rentalItemIds = allRentalItems.map((r) => r.id)

    // Fetch all reviews for these rental items
    const allReviews = await prisma.review.findMany({
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
    const rentalItemsWithStats = allRentalItems.map((item) => {
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

      // Sanitize images (Hotfix for broken seed data) and remove orderItems from response
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

    // Sort based on sortBy parameter
    let sortedItems = rentalItemsWithStats
    if (sortBy === 'popular') {
      sortedItems = [...rentalItemsWithStats].sort(
        (a, b) => b.totalRented - a.totalRented
      )
    } else if (sortBy === 'rating') {
      sortedItems = [...rentalItemsWithStats].sort(
        (a, b) => b.rating - a.rating
      )
    } else if (sortBy === 'pricePerDay' || sortBy === 'price') {
      sortedItems = [...rentalItemsWithStats].sort((a, b) =>
        sortOrder === 'asc'
          ? a.pricePerDay - b.pricePerDay
          : b.pricePerDay - a.pricePerDay
      )
    } else {
      // Default: createdAt desc
      sortedItems = [...rentalItemsWithStats].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    }

    // Apply pagination
    const paginatedItems = sortedItems.slice((page - 1) * limit, page * limit)

    // Calculate stats
    const stats = {
      total: total,
      available: rentalItemsWithStats.filter((item) => item.stock > 0).length,
      unavailable: rentalItemsWithStats.filter((item) => item.stock === 0)
        .length,
    }

    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    }

    return NextResponse.json(
      {
        rentalItems: paginatedItems,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
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
