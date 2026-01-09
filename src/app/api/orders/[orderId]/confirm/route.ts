import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// POST - Customer confirms order completion
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await params

    // Check if order exists and belongs to this customer
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        status: true,
        customerConfirmedAt: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only confirm your own orders' },
        { status: 403 }
      )
    }

    if (order.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Order must be completed before confirmation' },
        { status: 400 }
      )
    }

    if (order.customerConfirmedAt) {
      return NextResponse.json(
        { error: 'Order already confirmed' },
        { status: 400 }
      )
    }

    // Confirm the order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        customerConfirmedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: 'Order confirmed successfully',
    })
  } catch (error) {
    console.error('Error confirming order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
