import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

export async function GET() {
  try {
    const session = await auth()

    // Only ADMIN and SUPER_ADMIN can access
    if (
      !session?.user ||
      (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all stats in parallel
    const [
      totalUsers,
      totalTechnicians,
      totalMitras,
      totalProducts,
      totalOrders,
      pendingMitras,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.technician.count(),
      prisma.user.count({ where: { role: 'MITRA' } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.user.count({ where: { role: 'MITRA', mitraStatus: 'PENDING' } }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          technician: {
            select: { id: true },
          },
        },
      }),
    ])

    // Get role distribution
    const roleStats = await prisma.user.groupBy({
      by: ['role'],
      _count: true,
    })

    // Get monthly revenue data (all historical data for now)
    const allOrders = await prisma.order.findMany({
      where: {
        status: { in: ['PAID', 'IN_PROGRESS', 'COMPLETED'] },
      },
      select: {
        createdAt: true,
        total: true,
      },
    })

    // Process monthly data - group by YYYY-MM
    const monthlyData: Record<string, { revenue: number; orders: number }> = {}
    allOrders.forEach((order) => {
      const date = new Date(order.createdAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { revenue: 0, orders: 0 }
      }
      monthlyData[monthKey].revenue += order.total
      monthlyData[monthKey].orders += 1
    })

    // Get top products (by order items)
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        productId: { not: null },
        order: { status: { in: ['PAID', 'IN_PROGRESS', 'COMPLETED'] } },
      },
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { subtotal: 'desc' } },
      take: 5,
    })

    const topProductsDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId! },
          select: { name: true },
        })
        return {
          name: product?.name || 'Unknown Product',
          sold: item._sum.quantity || 0,
          revenue: item._sum.subtotal || 0,
        }
      })
    )

    // Get top services (by order items)
    const topServices = await prisma.orderItem.groupBy({
      by: ['serviceId'],
      where: {
        serviceId: { not: null },
        order: { status: { in: ['PAID', 'IN_PROGRESS', 'COMPLETED'] } },
      },
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { subtotal: 'desc' } },
      take: 4,
    })

    const topServicesDetails = await Promise.all(
      topServices.map(async (item) => {
        const service = await prisma.service.findUnique({
          where: { id: item.serviceId! },
          select: { name: true },
        })
        return {
          name: service?.name || 'Unknown Service',
          orders: item._sum.quantity || 0,
          revenue: item._sum.subtotal || 0,
        }
      })
    )

    // Get top rental items
    const topRentals = await prisma.orderItem.groupBy({
      by: ['rentalItemId'],
      where: {
        rentalItemId: { not: null },
        order: { status: { in: ['PAID', 'IN_PROGRESS', 'COMPLETED'] } },
      },
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { subtotal: 'desc' } },
      take: 4,
    })

    const topRentalsDetails = await Promise.all(
      topRentals.map(async (item) => {
        const rental = await prisma.rentalItem.findUnique({
          where: { id: item.rentalItemId! },
          select: { name: true },
        })
        return {
          name: rental?.name || 'Unknown Rental',
          rentals: item._sum.quantity || 0,
          revenue: item._sum.subtotal || 0,
        }
      })
    )

    return NextResponse.json({
      stats: {
        totalUsers,
        totalTechnicians,
        totalMitras,
        totalProducts,
        totalOrders,
        pendingMitras,
        byRole: roleStats.reduce((acc: Record<string, number>, stat) => {
          acc[stat.role] = stat._count
          return acc
        }, {}),
      },
      recentUsers,
      charts: {
        monthlyData,
        topProducts: topProductsDetails,
        topServices: topServicesDetails,
        topRentals: topRentalsDetails,
      },
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
