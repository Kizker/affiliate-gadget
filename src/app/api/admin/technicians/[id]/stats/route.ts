import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// GET - Get technician statistics
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const technicianId = resolvedParams.id

    // Get technician
    const technician = await prisma.technician.findUnique({
      where: { id: technicianId },
      select: { id: true },
    })

    if (!technician) {
      return NextResponse.json(
        { error: 'Technician not found' },
        { status: 404 }
      )
    }

    // Get order statistics
    const [totalOrders, completedOrders] = await Promise.all([
      prisma.order.count({
        where: { technicianId: technician.id },
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

    return NextResponse.json({
      totalOrders,
      completedOrders,
      totalRevenue,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
    })
  } catch (error) {
    console.error('Error fetching technician stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
