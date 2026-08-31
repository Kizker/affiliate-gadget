import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import { isAdminStaffRole } from '@/lib/dashboard-utils'

// GET - Get all orders for admin with pagination, search, and claim filter
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin, staff, or technician
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || (!isAdminStaffRole(user.role) && user.role !== 'TECHNICIAN')) {
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

    // Build where clause using structured AND array
    const andConditions: import('@prisma/client').Prisma.OrderWhereInput[] = []

    // 1. Store Admin scoping (Akun Toko Mandiri)
    if (user.role === 'STORE_ADMIN' && user.storeId) {
      andConditions.push({
        OR: [
          { storeId: user.storeId },
          { items: { some: { product: { storeId: user.storeId } } } },
        ],
      })
    } else if (user.role === 'TECHNICIAN') {
      const technician = await prisma.technician.findUnique({
        where: { userId: user.id },
      })
      if (technician) {
        andConditions.push({ technicianId: technician.id })
      }
      andConditions.push({ items: { some: { serviceId: { not: null } } } })
    }

    // 2. Search filter (Order number, customer name, email, phone, or product name)
    if (search) {
      andConditions.push({
        OR: [
          { orderNumber: { contains: search, mode: 'insensitive' } },
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
          { user: { phone: { contains: search, mode: 'insensitive' } } },
          { items: { some: { product: { name: { contains: search, mode: 'insensitive' } } } } },
        ],
      })
    }

    // 3. Status filter
    if (status && status !== 'all' && status !== 'ALL') {
      andConditions.push({
        status: status as any,
      })
    }

    // 4. Type filter (for Superadmin)
    if (user.role === 'SUPER_ADMIN' && type && type !== 'all') {
      if (type === 'service') {
        andConditions.push({ items: { some: { serviceId: { not: null } } } })
      } else if (type === 'sparepart') {
        andConditions.push({ items: { some: { productId: { not: null } } } })
      } else if (type === 'rental') {
        andConditions.push({ items: { some: { rentalItemId: { not: null } } } })
      }
    }

    const where: import('@prisma/client').Prisma.OrderWhereInput =
      andConditions.length > 0 ? { AND: andConditions } : {}

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
            address: true,
            city: true,
            province: true,
            postalCode: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            companyName: true,
            city: true,
          },
        },
        payment: {
          select: {
            status: true,
            method: true,
            amount: true,
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
