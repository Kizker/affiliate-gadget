import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/../auth'
import prisma from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await params

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            address: true,
          },
        },
        items: {
          include: {
            service: {
              select: {
                name: true,
                category: true,
              },
            },
            product: {
              select: {
                id: true,
                name: true,
                images: true,
              },
            },
            rentalItem: {
              select: {
                id: true,
                name: true,
                images: true,
                pricePerDay: true,
              },
            },
          },
        },
        technician: {
          include: {
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check if user owns this order
    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
