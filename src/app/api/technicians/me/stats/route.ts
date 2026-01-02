import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// GET - Get technician statistics
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get technician
    const technician = await prisma.technician.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!technician) {
      return NextResponse.json(
        { error: 'Technician not found' },
        { status: 404 }
      )
    }

    // Get order statistics
    const [totalOrders, activeOrders, completedOrders] = await Promise.all([
      prisma.order.count({
        where: { technicianId: technician.id },
      }),
      prisma.order.count({
        where: {
          technicianId: technician.id,
          status: { in: ['PENDING_PAYMENT', 'PAID', 'IN_PROGRESS'] },
        },
      }),
      prisma.order.count({
        where: {
          technicianId: technician.id,
          status: 'COMPLETED',
        },
      }),
    ])

    // Get revenue (sum of completed orders)
    const revenueData = await prisma.order.aggregate({
      where: {
        technicianId: technician.id,
        status: 'COMPLETED',
      },
      _sum: {
        total: true,
      },
    })
    const totalRevenue = revenueData._sum?.total || 0

    // Get rating statistics from real reviews
    const reviews = await prisma.review.findMany({
      where: {
        order: {
          technicianId: technician.id,
        },
        type: 'TECHNICIAN',
      },
    })

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0
    const totalReviews = reviews.length

    // Get revenue by day (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const ordersByDay = await prisma.order.groupBy({
      by: ['createdAt'],
      where: {
        technicianId: technician.id,
        status: 'COMPLETED',
        createdAt: { gte: sevenDaysAgo },
      },
      _sum: {
        total: true,
      },
    })

    // Format revenue by day
    const revenueByDay = ordersByDay.map((order) => ({
      date: order.createdAt.toISOString().split('T')[0],
      amount: order._sum?.total || 0,
    }))

    // Get orders by status
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      where: { technicianId: technician.id },
      _count: true,
    })

    const statusCounts = {
      pendingPayment: 0,
      paid: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
    }

    ordersByStatus.forEach((item) => {
      if (item.status === 'PENDING_PAYMENT')
        statusCounts.pendingPayment = item._count
      if (item.status === 'PAID') statusCounts.paid = item._count
      if (item.status === 'IN_PROGRESS') statusCounts.inProgress = item._count
      if (item.status === 'COMPLETED') statusCounts.completed = item._count
      if (item.status === 'CANCELLED') statusCounts.cancelled = item._count
    })

    // Get unread messages count
    const unreadMessages = await prisma.chatMessage.count({
      where: {
        room: {
          technicianId: technician.id,
        },
        senderId: { not: session.user.id },
        isRead: false,
      },
    })

    return NextResponse.json({
      totalOrders,
      activeOrders,
      completedOrders,
      totalRevenue,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      revenueByDay,
      ordersByStatus: statusCounts,
      unreadMessages,
    })
  } catch (error) {
    console.error('Error fetching technician stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
