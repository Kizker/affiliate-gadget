import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// PATCH - Set final price for order (Technician only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a technician
    const technician = await prisma.technician.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!technician) {
      return NextResponse.json(
        { error: 'Only technicians can set final price' },
        { status: 403 }
      )
    }

    const { orderId } = await params
    const { finalPrice } = await request.json()

    if (typeof finalPrice !== 'number' || finalPrice < 0) {
      return NextResponse.json(
        { error: 'Final price must be a valid positive number' },
        { status: 400 }
      )
    }

    // Check if order exists and belongs to this technician
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        technicianId: true,
        items: {
          select: { id: true },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.technicianId !== technician.id) {
      return NextResponse.json(
        { error: 'You can only set price for your own orders' },
        { status: 403 }
      )
    }

    // Only allow setting final price when order is PENDING_PAYMENT
    if (order.status !== 'PENDING_PAYMENT') {
      return NextResponse.json(
        { error: 'Can only set final price for pending payment orders' },
        { status: 400 }
      )
    }

    // No tax - total equals final price
    const total = finalPrice

    // Update the order total and item final prices
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Update the first item's final price (assuming single service order)
      if (order.items[0]) {
        await tx.orderItem.update({
          where: { id: order.items[0].id },
          data: {
            finalPrice: finalPrice,
            subtotal: finalPrice,
          },
        })
      }

      // Update order totals
      return tx.order.update({
        where: { id: orderId },
        data: {
          subtotal: finalPrice,
          tax: 0,
          total: total,
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
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
            },
          },
        },
      })
    })

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: 'Final price set successfully',
    })
  } catch (error) {
    console.error('Error setting final price:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
