import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

// Combined dashboard API - returns all data in a single request
export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get technician record
    const technician = await prisma.technician.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true,
            phone: true,
          },
        },
        services: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!technician) {
      return NextResponse.json(
        { error: 'Technician profile not found' },
        { status: 404 }
      )
    }

    // Parse URL for order status filter
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '5') // Default 5 items per page for dashboard
    const search = searchParams.get('q') || ''

    // Build order where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderWhere: any = { technicianId: technician.id }

    if (statusFilter && statusFilter !== 'ALL') {
      orderWhere.status = statusFilter
    }

    if (search) {
      orderWhere.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const skip = (page - 1) * limit

    // Parallel fetch: stats + orders (profile & services already loaded above)
    // Parallel fetch: stats + orders (profile & services already loaded above)
    const [orders, totalFilteredOrders, statsData, reviewStats] =
      await Promise.all([
        // Recent orders with pagination
        prisma.order.findMany({
          where: orderWhere,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: skip,
          include: {
            user: {
              select: { name: true, email: true, image: true },
            },
            items: {
              include: {
                service: {
                  select: { name: true, category: true },
                },
              },
            },
          },
        }),
        // Total count for current filter (pagination)
        prisma.order.count({ where: orderWhere }),
        // Order stats aggregation
        prisma.order.groupBy({
          by: ['status'],
          where: { technicianId: technician.id },
          _count: { id: true },
          _sum: { total: true },
        }),
        // Review stats
        prisma.review.aggregate({
          where: {
            type: 'TECHNICIAN',
            order: { technicianId: technician.id },
          },
          _avg: { rating: true },
          _count: { id: true },
        }),
      ])

    // Process stats
    const ordersByStatus = {
      pending: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
    }
    let totalOrders = 0
    let totalRevenue = 0
    let activeOrders = 0
    let completedOrders = 0

    for (const stat of statsData) {
      const count = stat._count.id
      const revenue = stat._sum.total || 0
      totalOrders += count

      switch (stat.status) {
        case 'PENDING_PAYMENT':
          ordersByStatus.pending += count
          activeOrders += count
          break
        case 'PAID':
        case 'IN_PROGRESS':
          ordersByStatus.inProgress += count
          activeOrders += count
          break
        case 'COMPLETED':
          ordersByStatus.completed += count
          completedOrders += count
          // Only count revenue from COMPLETED orders
          totalRevenue += revenue
          break
        case 'CANCELLED':
          ordersByStatus.cancelled += count
          break
      }
    }

    const stats = {
      totalOrders,
      activeOrders,
      completedOrders,
      totalRevenue,
      averageRating: reviewStats._avg.rating || 0,
      totalReviews: reviewStats._count.id,
      unreadMessages: 0, // TODO: implement if needed
      ordersByStatus,
    }

    // Return combined response with cache headers
    return NextResponse.json(
      {
        profile: {
          id: technician.id,
          bio: technician.bio,
          experience: technician.experience,
          specialties: technician.specialties,
          rating: technician.rating,
          totalReview: technician.totalReview,
          isAvailable: technician.isAvailable,
          user: technician.user,
        },
        services: technician.services,
        orders,
        pagination: {
          page,
          limit,
          total: totalFilteredOrders,
          totalPages: Math.ceil(totalFilteredOrders / limit),
        },
        stats,
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=10, stale-while-revalidate=30',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching technician dashboard:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
