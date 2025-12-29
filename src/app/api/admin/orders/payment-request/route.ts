import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/../auth'
import prisma from '@/lib/db'

// Request payment confirmation (Admin Chat -> Super Admin)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (
      !session?.user ||
      (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Check if order exists and is pending payment
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        orderNumber: true,
        claimedById: true,
        paymentRequestedById: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.status !== 'PENDING_PAYMENT') {
      return NextResponse.json(
        { error: 'Order is not pending payment' },
        { status: 400 }
      )
    }

    // Check if already requested
    if (order.paymentRequestedById) {
      return NextResponse.json(
        { error: 'Payment confirmation already requested' },
        { status: 400 }
      )
    }

    // ADMIN can only request for their claimed orders
    if (
      session.user.role === 'ADMIN' &&
      order.claimedById !== session.user.id
    ) {
      return NextResponse.json(
        {
          error:
            'You can only request payment confirmation for your claimed orders',
        },
        { status: 403 }
      )
    }

    // Request payment confirmation
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentRequestedById: session.user.id,
        paymentRequestedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: `Payment confirmation requested for order ${order.orderNumber}`,
    })
  } catch (error) {
    console.error('Error requesting payment confirmation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Approve payment confirmation (Super Admin only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()

    // Only SUPER_ADMIN can approve
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only SUPER_ADMIN can approve payments' },
        { status: 403 }
      )
    }

    const { orderId, action } = await request.json()

    if (!orderId || !action) {
      return NextResponse.json(
        { error: 'Order ID and action are required' },
        { status: 400 }
      )
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        orderNumber: true,
        paymentRequestedById: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (action === 'approve') {
      // Approve payment - change status to PAID
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'PAID',
          paymentRequestedById: null,
          paymentRequestedAt: null,
        },
      })

      return NextResponse.json({
        success: true,
        order: updatedOrder,
        message: `Payment confirmed for order ${order.orderNumber}`,
      })
    } else if (action === 'reject') {
      // Reject request - clear the request fields
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentRequestedById: null,
          paymentRequestedAt: null,
        },
      })

      return NextResponse.json({
        success: true,
        order: updatedOrder,
        message: `Payment request rejected for order ${order.orderNumber}`,
      })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error processing payment confirmation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
