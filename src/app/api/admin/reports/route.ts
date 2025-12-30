import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/../auth'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only SUPER_ADMIN can access reports
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build date filter
    const dateFilter: {
      createdAt?: {
        gte: Date
        lte: Date
      }
    } = {}
    if (startDate && endDate) {
      dateFilter.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    // 1. REVENUE OVERVIEW
    const orders = await prisma.order.findMany({
      where: {
        status: { in: ['PAID', 'IN_PROGRESS', 'COMPLETED'] },
        ...dateFilter,
      },
      include: {
        items: {
          include: {
            service: true,
            product: true,
            rentalItem: true,
          },
        },
      },
    })

    let totalRevenue = 0
    const revenueByCategory = {
      JASA: 0,
      SPAREPART: 0,
      SEWA: 0,
    }

    orders.forEach((order) => {
      totalRevenue += order.total
      order.items.forEach((item) => {
        if (item.service) {
          revenueByCategory.JASA += item.price * item.quantity
        } else if (item.product) {
          revenueByCategory.SPAREPART += item.price * item.quantity
        } else if (item.rentalItem) {
          revenueByCategory.SEWA += item.price * (item.rentalDays || 1)
        }
      })
    })

    // 2. ORDER STATISTICS
    const orderStats = await prisma.order.groupBy({
      by: ['status'],
      where: dateFilter,
      _count: true,
    })

    const ordersByStatus = {
      PENDING_PAYMENT: 0,
      PAID: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    }

    orderStats.forEach((stat) => {
      ordersByStatus[stat.status as keyof typeof ordersByStatus] = stat._count
    })

    const totalOrders = Object.values(ordersByStatus).reduce(
      (sum, count) => sum + count,
      0
    )

    // 3. TECHNICIAN PERFORMANCE
    const technicians = await prisma.technician.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        orders: {
          where: {
            status: { in: ['PAID', 'IN_PROGRESS', 'COMPLETED'] },
            ...dateFilter,
          },
          select: {
            total: true,
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    })

    const technicianPerformance = technicians
      .map((tech) => ({
        id: tech.id,
        name: tech.user.name || tech.user.email,
        email: tech.user.email,
        totalOrders: tech._count.orders,
        totalRevenue: tech.orders.reduce((sum, order) => sum + order.total, 0),
        rating: tech.rating,
        totalReviews: tech.totalReview,
      }))
      .sort((a, b) => {
        // Sort by total orders first (descending)
        if (b.totalOrders !== a.totalOrders) {
          return b.totalOrders - a.totalOrders
        }
        // If orders are equal, sort by total reviews (descending)
        return b.totalReviews - a.totalReviews
      })
      .slice(0, 10)

    // 4. CUSTOMER ANALYTICS
    const totalCustomers = await prisma.user.count({
      where: { role: 'CUSTOMER' },
    })

    const newCustomers = await prisma.user.count({
      where: {
        role: 'CUSTOMER',
        ...dateFilter,
      },
    })

    const customersWithOrders = await prisma.user.count({
      where: {
        role: 'CUSTOMER',
        orders: {
          some: {},
        },
      },
    })

    // 5. PRODUCT PERFORMANCE
    const productStats = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        productId: { not: null },
        order: {
          status: { in: ['PAID', 'IN_PROGRESS', 'COMPLETED'] },
          ...dateFilter,
        },
      },
      _sum: {
        quantity: true,
        subtotal: true,
      },
      _count: true,
    })

    const topProductsData = await Promise.all(
      productStats
        .sort((a, b) => (b._sum.subtotal || 0) - (a._sum.subtotal || 0))
        .slice(0, 5)
        .map(async (stat) => {
          const product = await prisma.product.findUnique({
            where: { id: stat.productId! },
            select: {
              name: true,
              stock: true,
              images: true,
            },
          })
          return {
            id: stat.productId,
            name: product?.name || 'Unknown',
            totalSold: stat._sum.quantity || 0,
            revenue: stat._sum.subtotal || 0,
            stock: product?.stock || 0,
            image: product?.images?.[0] || null,
          }
        })
    )

    // Low stock products
    const lowStockProducts = await prisma.product.findMany({
      where: {
        stock: { lt: 10 },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        stock: true,
        images: true,
      },
      orderBy: {
        stock: 'asc',
      },
      take: 10,
    })

    // 6. MITRA STATISTICS
    const mitraStats = await prisma.mitra.groupBy({
      by: ['isApproved'],
      _count: true,
    })

    const mitraByStatus = {
      approved: 0,
      pending: 0,
    }

    mitraStats.forEach((stat) => {
      if (stat.isApproved) {
        mitraByStatus.approved = stat._count
      } else {
        mitraByStatus.pending = stat._count
      }
    })

    const totalMitras = mitraByStatus.approved + mitraByStatus.pending

    // Top rated mitras
    const topMitras = await prisma.mitra.findMany({
      where: {
        isApproved: true,
        isActive: true,
      },
      select: {
        id: true,
        businessName: true,
        city: true,
        rating: true,
        totalReview: true,
        totalViews: true,
      },
      orderBy: {
        rating: 'desc',
      },
      take: 5,
    })

    // 7. STOCK SUMMARY
    const totalProducts = await prisma.product.count()
    const lowStockCount = await prisma.product.count({
      where: { stock: { lt: 10 }, isActive: true },
    })
    const outOfStockCount = await prisma.product.count({
      where: { stock: 0, isActive: true },
    })

    // 8. RECENT ACTIVITY
    const recentOrders = await prisma.order.findMany({
      where: dateFilter,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: { name: true },
            },
            service: {
              select: { name: true },
            },
            rentalItem: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    })

    // 9. WARRANTY ANALYTICS
    const now = new Date()

    // Active warranties
    const activeWarranties = await prisma.warranty.count({
      where: {
        isActive: true,
        endDate: { gte: now },
      },
    })

    // Expired warranties
    const expiredWarranties = await prisma.warranty.count({
      where: {
        endDate: { lt: now },
      },
    })

    // Total warranties
    const totalWarranties = await prisma.warranty.count()

    // Warranty claims (tickets related to warranties)
    const warrantyClaims = await prisma.ticket.count({
      where: {
        warrantyId: { not: null },
        ...dateFilter,
      },
    })

    // Warranty claim rate
    const warrantyClaimRate =
      totalWarranties > 0
        ? ((warrantyClaims / totalWarranties) * 100).toFixed(1)
        : 0

    // 10. TICKET & COMPLAINT MANAGEMENT
    const ticketStats = await prisma.ticket.groupBy({
      by: ['status'],
      where: dateFilter,
      _count: true,
    })

    const ticketsByStatus = {
      OPEN: 0,
      PENDING_APPROVAL: 0,
      APPROVED: 0,
      REJECTED: 0,
      RESOLVED: 0,
      CLOSED: 0,
    }

    ticketStats.forEach((stat) => {
      ticketsByStatus[stat.status as keyof typeof ticketsByStatus] = stat._count
    })

    const totalTickets = Object.values(ticketsByStatus).reduce(
      (sum, count) => sum + count,
      0
    )

    // Calculate average resolution time
    const resolvedTickets = await prisma.ticket.findMany({
      where: {
        status: { in: ['RESOLVED', 'CLOSED'] },
        resolvedAt: { not: null },
        ...dateFilter,
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
    })

    let avgResolutionTime = 0
    if (resolvedTickets.length > 0) {
      const totalResolutionTime = resolvedTickets.reduce((sum, ticket) => {
        const resolutionTime =
          ticket.resolvedAt!.getTime() - ticket.createdAt.getTime()
        return sum + resolutionTime
      }, 0)
      avgResolutionTime =
        totalResolutionTime / resolvedTickets.length / (1000 * 60 * 60) // Convert to hours
    }

    // Recent tickets
    const recentTickets = await prisma.ticket.findMany({
      where: dateFilter,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        order: {
          select: {
            orderNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    })

    // Return comprehensive report data
    return NextResponse.json({
      success: true,
      data: {
        revenue: {
          total: totalRevenue,
          byCategory: revenueByCategory,
        },
        orders: {
          total: totalOrders,
          byStatus: ordersByStatus,
        },
        technicians: {
          performance: technicianPerformance,
        },
        customers: {
          total: totalCustomers,
          new: newCustomers,
          withOrders: customersWithOrders,
          activeRate:
            totalCustomers > 0
              ? ((customersWithOrders / totalCustomers) * 100).toFixed(1)
              : 0,
        },
        products: {
          topSelling: topProductsData,
          lowStock: lowStockProducts,
          total: totalProducts,
          lowStockCount,
          outOfStockCount,
        },
        mitras: {
          total: totalMitras,
          approved: mitraByStatus.approved,
          pending: mitraByStatus.pending,
          topRated: topMitras,
        },
        warranties: {
          active: activeWarranties,
          expired: expiredWarranties,
          total: totalWarranties,
          claims: warrantyClaims,
          claimRate: warrantyClaimRate,
        },
        tickets: {
          total: totalTickets,
          byStatus: ticketsByStatus,
          avgResolutionTime: avgResolutionTime.toFixed(1),
          recent: recentTickets,
        },
        recentActivity: recentOrders,
      },
    })
  } catch (error) {
    console.error('Error fetching report data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch report data' },
      { status: 500 }
    )
  }
}
