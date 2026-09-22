import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// Canonical revenue statuses — excludes CANCELLED, RETURNED, PENDING_PAYMENT
const REVENUE_STATUSES = [
  'PAID',
  'IN_PROGRESS',
  'SHIPPED',
  'COMPLETED',
  'COMPLAINED',
] as const

/** Parse and validate a date string. Returns null if invalid. */
function parseDate(value: string | null): Date | null {
  if (!value) return null
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin roles can access reports
    if (
      !['SUPER_ADMIN', 'ADMIN', 'STORE_ADMIN', 'FINANCE_ADMIN'].includes(
        session.user.role
      )
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const startRaw = searchParams.get('startDate')
    const endRaw = searchParams.get('endDate')

    // Validate date inputs — 400 on bad format
    const startDate = parseDate(startRaw)
    const endDate = parseDate(endRaw)
    if ((startRaw && !startDate) || (endRaw && !endDate)) {
      return NextResponse.json(
        { error: 'Invalid date format for startDate or endDate' },
        { status: 400 }
      )
    }

    // Build date filter
    const dateFilter: { createdAt?: { gte: Date; lte: Date } } = {}
    if (startDate && endDate) {
      dateFilter.createdAt = { gte: startDate, lte: endDate }
    }

    // STORE_ADMIN scope isolation — restrict all queries to their own store
    const isStoreAdmin = session.user.role === 'STORE_ADMIN'
    const storeId: string | undefined = isStoreAdmin
      ? ((session.user as { storeId?: string }).storeId ?? undefined)
      : undefined

    // Shared store scope filter for order-level queries
    const storeScope = storeId ? { storeId } : {}

    // PARALLEL BATCH 1: Revenue orders + Order stats
    const [orders, orderStats] = await Promise.all([
      prisma.order.findMany({
        where: {
          status: { in: [...REVENUE_STATUSES] },
          ...dateFilter,
          ...storeScope,
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
      }),
      prisma.order.groupBy({
        by: ['status'],
        where: { ...dateFilter, ...storeScope },
        _count: true,
      }),
    ])

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

    const ordersByStatus = {
      PENDING_PAYMENT: 0,
      PAID: 0,
      IN_PROGRESS: 0,
      SHIPPED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
      RETURNED: 0,
      COMPLAINED: 0,
    }
    orderStats.forEach((stat) => {
      if (stat.status in ordersByStatus) {
        ordersByStatus[stat.status as keyof typeof ordersByStatus] = stat._count
      }
    })
    const totalOrders = Object.values(ordersByStatus).reduce(
      (sum, count) => sum + count,
      0
    )

    // PARALLEL BATCH 2: All independent queries
    const [
      totalCustomers,
      newCustomers,
      customersWithOrders,
      productStats,
      lowStockProducts,
      totalProducts,
      lowStockCount,
      outOfStockCount,
      totalStores,
      activeStores,
      topStores,
      activeWarranties,
      expiredWarranties,
      totalWarranties,
      returnClaims,
      returnStats,
      complaintStats,
      resolvedComplaints,
      recentComplaints,
      recentOrders,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.user.count({ where: { role: 'CUSTOMER', ...dateFilter } }),
      prisma.user.count({
        where: { role: 'CUSTOMER', orders: { some: {} } },
      }),
      prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          productId: { not: null },
          order: {
            status: { in: [...REVENUE_STATUSES] },
            ...dateFilter,
            ...storeScope,
          },
        },
        _sum: { quantity: true, subtotal: true },
        _count: true,
      }),
      prisma.product.findMany({
        where: {
          stock: { lt: 10 },
          isActive: true,
          ...(storeId ? { storeId } : {}),
        },
        select: { id: true, name: true, stock: true, images: true },
        orderBy: { stock: 'asc' },
        take: 10,
      }),
      prisma.product.count({ where: storeId ? { storeId } : {} }),
      prisma.product.count({
        where: {
          stock: { lt: 10 },
          isActive: true,
          ...(storeId ? { storeId } : {}),
        },
      }),
      prisma.product.count({
        where: { stock: 0, isActive: true, ...(storeId ? { storeId } : {}) },
      }),
      prisma.store.count({ where: storeId ? { id: storeId } : {} }),
      prisma.store.count({
        where: { isActive: true, ...(storeId ? { id: storeId } : {}) },
      }),
      prisma.store.findMany({
        where: { isActive: true, ...(storeId ? { id: storeId } : {}) },
        select: {
          id: true,
          name: true,
          companyName: true,
          city: true,
          rating: true,
          totalReview: true,
          totalSales: true,
          commissionRate: true,
          isOwnerStore: true,
        },
        orderBy: { rating: 'desc' },
        take: 5,
      }),
      prisma.warranty.count({
        where: { isActive: true, endDate: { gte: new Date() } },
      }),
      prisma.warranty.count({ where: { endDate: { lt: new Date() } } }),
      prisma.warranty.count(),
      prisma.returnRequest.count({
        where: { ...dateFilter, ...(storeId ? { order: { storeId } } : {}) },
      }),
      prisma.returnRequest.groupBy({
        by: ['status'],
        where: { ...dateFilter, ...(storeId ? { order: { storeId } } : {}) },
        _count: true,
      }),
      prisma.complaint.groupBy({
        by: ['status'],
        where: { ...dateFilter, ...(storeId ? { order: { storeId } } : {}) },
        _count: true,
      }),
      prisma.complaint.findMany({
        where: {
          status: 'RESOLVED',
          resolvedAt: { not: null },
          ...dateFilter,
          ...(storeId ? { order: { storeId } } : {}),
        },
        select: { createdAt: true, resolvedAt: true },
      }),
      prisma.complaint.findMany({
        where: { ...dateFilter, ...(storeId ? { order: { storeId } } : {}) },
        include: {
          user: { select: { name: true, email: true } },
          order: { select: { orderNumber: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.order.findMany({
        where: { ...dateFilter, ...storeScope },
        include: {
          user: { select: { name: true, email: true } },
          items: {
            include: {
              product: { select: { name: true } },
              service: { select: { name: true } },
              rentalItem: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ])

    // N+1 eliminated: resolve top products via single findMany
    const topProductsSorted = productStats
      .sort((a, b) => (b._sum.subtotal || 0) - (a._sum.subtotal || 0))
      .slice(0, 5)
    const topProductIds = topProductsSorted
      .map((s) => s.productId)
      .filter(Boolean) as string[]
    const productDetails = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true, stock: true, images: true },
    })
    const productMap = new Map(productDetails.map((p) => [p.id, p]))
    const topProductsData = topProductsSorted.map((stat) => {
      const product = productMap.get(stat.productId!)
      return {
        id: stat.productId,
        name: product?.name || 'Unknown',
        totalSold: stat._sum.quantity || 0,
        revenue: stat._sum.subtotal || 0,
        stock: product?.stock || 0,
        image: product?.images?.[0] || null,
      }
    })

    // Aggregate return stats
    const returnsByStatus = {
      PENDING: 0,
      IN_REVIEW: 0,
      APPROVED: 0,
      REJECTED: 0,
      COMPLETED: 0,
    }
    returnStats.forEach((stat) => {
      if (stat.status in returnsByStatus) {
        returnsByStatus[stat.status as keyof typeof returnsByStatus] =
          stat._count
      }
    })

    // Aggregate complaint stats
    const complaintsByStatus = {
      OPEN: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      REJECTED: 0,
    }
    complaintStats.forEach((stat) => {
      if (stat.status in complaintsByStatus) {
        complaintsByStatus[stat.status as keyof typeof complaintsByStatus] =
          stat._count
      }
    })
    const totalComplaints = Object.values(complaintsByStatus).reduce(
      (sum, c) => sum + c,
      0
    )

    // Avg resolution time (hours)
    let avgResolutionTime = 0
    if (resolvedComplaints.length > 0) {
      const totalMs = resolvedComplaints.reduce(
        (sum, item) =>
          sum + (item.resolvedAt!.getTime() - item.createdAt.getTime()),
        0
      )
      avgResolutionTime = totalMs / resolvedComplaints.length / (1000 * 60 * 60)
    }

    const warrantyClaimRate =
      totalWarranties > 0
        ? ((returnClaims / totalWarranties) * 100).toFixed(1)
        : '0.0'

    // Return comprehensive report data with cache-prevention headers
    return NextResponse.json(
      {
        success: true,
        data: {
          revenue: {
            total: totalRevenue,
            byCategory: revenueByCategory,
            storeCount: activeStores,
          },
          orders: {
            total: totalOrders,
            byStatus: ordersByStatus,
          },
          technicians: {
            performance: [],
          },
          customers: {
            total: totalCustomers,
            new: newCustomers,
            withOrders: customersWithOrders,
            activeRate:
              totalCustomers > 0
                ? ((customersWithOrders / totalCustomers) * 100).toFixed(1)
                : '0.0',
          },
          products: {
            topSelling: topProductsData,
            lowStock: lowStockProducts,
            total: totalProducts,
            lowStockCount,
            outOfStockCount,
          },
          stores: {
            total: totalStores,
            active: activeStores,
            topRated: topStores,
          },
          mitras: {
            total: totalStores,
            approved: activeStores,
            pending: Math.max(0, totalStores - activeStores),
            topRated: topStores.map((s) => ({
              id: s.id,
              businessName: s.name,
              city: s.city,
              rating: s.rating,
              totalReview: s.totalReview,
              totalViews: s.totalSales,
            })),
          },
          warranties: {
            active: activeWarranties,
            expired: expiredWarranties,
            total: totalWarranties,
            claims: returnClaims,
            claimRate: warrantyClaimRate,
          },
          tickets: {
            total: totalComplaints + returnClaims,
            byStatus: {
              OPEN: complaintsByStatus.OPEN,
              PENDING_APPROVAL: returnsByStatus.PENDING,
              APPROVED: returnsByStatus.APPROVED,
              REJECTED: complaintsByStatus.REJECTED + returnsByStatus.REJECTED,
              RESOLVED: complaintsByStatus.RESOLVED + returnsByStatus.COMPLETED,
              CLOSED: complaintsByStatus.RESOLVED,
            },
            avgResolutionTime: avgResolutionTime.toFixed(1),
            recent: recentComplaints.map((c) => ({
              id: c.id,
              subject: c.subject,
              status: c.status,
              createdAt: c.createdAt.toISOString(),
              user: c.user,
              order: c.order,
            })),
          },
          complaints: {
            total: totalComplaints,
            byStatus: complaintsByStatus,
            avgResolutionTime: avgResolutionTime.toFixed(1),
            recent: recentComplaints,
          },
          returns: {
            total: returnClaims,
            byStatus: returnsByStatus,
          },
          recentActivity: recentOrders,
        },
      },
      {
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching report data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch report data' },
      { status: 500 }
    )
  }
}
