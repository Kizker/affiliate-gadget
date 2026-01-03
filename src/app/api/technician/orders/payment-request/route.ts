import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// Request payment confirmation (Technician -> Super Admin)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a technician
    const technician = await prisma.technician.findUnique({
      where: { userId: session.user.id },
    })

    if (!technician) {
      return NextResponse.json(
        { error: 'Only technicians can request payment confirmation' },
        { status: 403 }
      )
    }

    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Check if order exists and belongs to this technician
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        orderNumber: true,
        technicianId: true,
        technicianPaymentRequestedById: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check if this order belongs to the technician
    if (order.technicianId !== technician.id) {
      return NextResponse.json(
        { error: 'You can only request payment for your own orders' },
        { status: 403 }
      )
    }

    if (order.status !== 'PENDING_PAYMENT') {
      return NextResponse.json(
        { error: 'Order is not pending payment' },
        { status: 400 }
      )
    }

    // Check if already requested
    if (order.technicianPaymentRequestedById) {
      return NextResponse.json(
        { error: 'Payment confirmation already requested' },
        { status: 400 }
      )
    }

    // Request payment confirmation
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        technicianPaymentRequestedById: session.user.id,
        technicianPaymentRequestedAt: new Date(),
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

// Approve/Reject payment confirmation (Super Admin only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()

    // Only SUPER_ADMIN can approve
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only SUPER_ADMIN can approve technician payments' },
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
        technicianPaymentRequestedById: true,
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
          technicianPaymentRequestedById: null,
          technicianPaymentRequestedAt: null,
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
          technicianPaymentRequestedById: null,
          technicianPaymentRequestedAt: null,
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
