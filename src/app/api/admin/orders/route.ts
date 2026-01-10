import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// GET - Get all orders for admin with pagination, search, and claim filter
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (
      !user ||
      (user.role !== 'ADMIN' &&
        user.role !== 'SUPER_ADMIN' &&
        user.role !== 'TECHNICIAN')
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''
    const status = searchParams.get('status') || ''
    const claimFilter = searchParams.get('claim') || 'all' // 'mine', 'unclaimed', 'all'

    const skip = (page - 1) * limit

    // Build where clause
    interface OrderWhereInput {
      OR?: Array<{
        orderNumber?: { contains: string; mode: 'insensitive' }
        user?: {
          name?: { contains: string; mode: 'insensitive' }
          email?: { contains: string; mode: 'insensitive' }
        }
      }>
      status?:
        | 'PENDING_PAYMENT'
        | 'PAID'
        | 'IN_PROGRESS'
        | 'COMPLETED'
        | 'CANCELLED'
      claimedById?: string | null
      paymentRequestedById?: { not: null } | null
      technicianPaymentRequestedById?: { not: null } | null
      items?: {
        some: {
          serviceId?: { not: null } | null
          productId?: { not: null } | null
          rentalItemId?: { not: null } | null
        }
      }
      // For TECHNICIAN role - only show service orders assigned to them
      technicianId?: string
    }

    const where: OrderWhereInput = {}

    // Role-based type filtering
    // ADMIN (Admin Chat) can ONLY see sparepart and rental orders
    // TECHNICIAN can ONLY see service orders (their own)
    if (user.role === 'ADMIN') {
      // Admin Chat sees sparepart and rental only - not service
      // We need to use a different approach - filter out service orders
      where.items = { some: { serviceId: null } }
    } else if (user.role === 'TECHNICIAN') {
      // Technician sees only service orders assigned to them
      const technician = await prisma.technician.findUnique({
        where: { userId: user.id },
      })
      if (technician) {
        where.technicianId = technician.id
      }
      where.items = { some: { serviceId: { not: null } } }
    }

    // Search filter (order number, user name, user email)
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ]
    }

    // Status filter
    if (status && status !== 'all') {
      where.status = status as
        | 'PENDING_PAYMENT'
        | 'PAID'
        | 'IN_PROGRESS'
        | 'COMPLETED'
        | 'CANCELLED'
    }

    // Claim filter (only for ADMIN, SUPER_ADMIN sees all)
    if (user.role === 'ADMIN') {
      if (claimFilter === 'mine') {
        where.claimedById = user.id
      } else if (claimFilter === 'unclaimed') {
        where.claimedById = null
      }
      // 'all' shows everything for admin - they can see but not edit others' orders
    } else if (user.role === 'SUPER_ADMIN') {
      // SUPER_ADMIN can filter but sees all by default
      if (claimFilter === 'mine') {
        where.claimedById = user.id
      } else if (claimFilter === 'unclaimed') {
        where.claimedById = null
      } else if (claimFilter === 'payment_requests') {
        // Filter for pending payment requests (SUPER_ADMIN only)
        where.paymentRequestedById = { not: null }
      } else if (claimFilter === 'technician_payment_requests') {
        // Filter for pending technician payment requests (SUPER_ADMIN only)
        where.technicianPaymentRequestedById = { not: null }
      }
    }

    // Type filter (only for SUPER_ADMIN - others are auto-filtered)
    if (user.role === 'SUPER_ADMIN' && type && type !== 'all') {
      if (type === 'service') {
        where.items = { some: { serviceId: { not: null } } }
      } else if (type === 'sparepart') {
        where.items = { some: { productId: { not: null } } }
      } else if (type === 'rental') {
        where.items = { some: { rentalItemId: { not: null } } }
      }
    }

    // Get total count for pagination
    const total = await prisma.order.count({ where })
    const totalPages = Math.ceil(total / limit)

    // Get orders with pagination
    const orders = await prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        claimedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        paymentRequestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        technicianPaymentRequestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        technician: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                images: true,
              },
            },
            service: {
              select: {
                name: true,
              },
            },
            rentalItem: {
              select: {
                name: true,
                images: true,
              },
            },
          },
        },
      },
    })

    // Get stats for tabs - filtered by role
    // Build base stats filter based on role
    interface StatsWhereInput {
      claimedById?: string | null
      technicianId?: string
      items?: {
        some: {
          serviceId?: { not: null } | null
        }
      }
      paymentRequestedById?: { not: null }
      technicianPaymentRequestedById?: { not: null }
    }

    const baseStatsWhere: StatsWhereInput = {}

    // Apply role-based filtering to stats
    if (user.role === 'ADMIN') {
      // ADMIN only counts sparepart/rental orders
      baseStatsWhere.items = { some: { serviceId: null } }
    } else if (user.role === 'TECHNICIAN') {
      // TECHNICIAN only counts their service orders
      const technician = await prisma.technician.findUnique({
        where: { userId: user.id },
      })
      if (technician) {
        baseStatsWhere.technicianId = technician.id
      }
      baseStatsWhere.items = { some: { serviceId: { not: null } } }
    }

    const [
      totalOrders,
      myOrders,
      unclaimedOrders,
      pendingPaymentRequests,
      pendingTechnicianPaymentRequests,
    ] = await Promise.all([
      prisma.order.count({ where: baseStatsWhere }),
      prisma.order.count({
        where: { ...baseStatsWhere, claimedById: user.id },
      }),
      prisma.order.count({ where: { ...baseStatsWhere, claimedById: null } }),
      prisma.order.count({ where: { paymentRequestedById: { not: null } } }),
      prisma.order.count({
        where: { technicianPaymentRequestedById: { not: null } },
      }),
    ])

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      stats: {
        total: totalOrders,
        mine: myOrders,
        unclaimed: unclaimedOrders,
        pendingPaymentRequests: pendingPaymentRequests,
        pendingTechnicianPaymentRequests: pendingTechnicianPaymentRequests,
      },
      currentUserId: user.id,
      currentUserRole: user.role,
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
