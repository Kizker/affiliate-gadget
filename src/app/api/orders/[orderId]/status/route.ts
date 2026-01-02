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
    const { status } = body

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    // Get user with role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // ONLY SUPER_ADMIN can confirm payment (PENDING_PAYMENT -> PAID)
    if (status === 'PAID' && order.status === 'PENDING_PAYMENT') {
      if (user.role !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { error: 'Only Super Admin can confirm payments' },
          { status: 403 }
        )
      }
    }

    // For other status updates, check if user is SUPER_ADMIN or ADMIN
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      // Check if user is technician assigned to this order
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

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    })

    return NextResponse.json({ order: updatedOrder })
  } catch (error) {
    console.error('Error updating order status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
