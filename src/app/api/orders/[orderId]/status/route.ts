import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await params
    const body = await request.json()
    const { status, finalPrice } = body

    // Get user with role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get order with items
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check authorization
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      const technician = await prisma.technician.findUnique({
        where: { userId: user.id },
      })

      if (!technician || order.technicianId !== technician.id) {
        return NextResponse.json(
          { error: 'Forbidden - not authorized to update this order' },
          { status: 403 }
        )
      }
    }

    // Handle setting final price on service items
    if (finalPrice !== undefined && typeof finalPrice === 'number') {
      // Find the service item
      const serviceItem = order.items.find((item) => item.serviceId !== null)

      if (serviceItem) {
        // Update the order item with final price
        await prisma.orderItem.update({
          where: { id: serviceItem.id },
          data: {
            finalPrice: finalPrice,
            subtotal: finalPrice,
          },
        })

        // Recalculate order total
        const newTotal = order.items.reduce((sum, item) => {
          if (item.id === serviceItem.id) {
            return sum + finalPrice
          }
          return sum + item.subtotal
        }, 0)

        await prisma.order.update({
          where: { id: orderId },
          data: {
            total: newTotal,
            subtotal: newTotal,
          },
        })
      }

      // Fetch updated order
      const updatedOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      })

      return NextResponse.json({
        order: updatedOrder,
        message: 'Harga final berhasil disimpan',
      })
    }

    // Handle status update
    if (status) {
      // ONLY SUPER_ADMIN can confirm payment (PENDING_PAYMENT -> PAID)
      if (status === 'PAID' && order.status === 'PENDING_PAYMENT') {
        if (user.role !== 'SUPER_ADMIN') {
          return NextResponse.json(
            { error: 'Only Super Admin can confirm payments' },
            { status: 403 }
          )
        }
        // Clear the payment request flag when confirming
        const updatedOrder = await prisma.order.update({
          where: { id: orderId },
          data: {
            status,
            technicianPaymentRequestedById: null,
            technicianPaymentRequestedAt: null,
          },
        })
        return NextResponse.json({ order: updatedOrder })
      }

      // When technician sends order to PENDING_PAYMENT, set the payment request flag
      if (status === 'PENDING_PAYMENT' && order.status === 'IN_PROGRESS') {
        const technician = await prisma.technician.findUnique({
          where: { userId: user.id },
        })

        if (technician) {
          const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
              status,
              technicianPaymentRequestedById: user.id,
              technicianPaymentRequestedAt: new Date(),
            },
          })
          return NextResponse.json({ order: updatedOrder })
        }
      }

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status },
      })

      return NextResponse.json({ order: updatedOrder })
    }

    return NextResponse.json({ error: 'No update provided' }, { status: 400 })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
