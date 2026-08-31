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

    if (order.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Pesanan yang telah dibatalkan tidak dapat dikonfirmasi' },
        { status: 400 }
      )
    }

    if (order.customerConfirmedAt) {
      return NextResponse.json(
        { error: 'Pesanan sudah dikonfirmasi diterima sebelumnya' },
        { status: 400 }
      )
    }

    const now = new Date()
    const warrantyExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    // Confirm the order & activate 30-day warranty
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'COMPLETED',
        completedAt: now,
        customerConfirmedAt: now,
        warrantyExpiryDate: warrantyExpiry,
      },
    })

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: 'Pesanan berhasil dikonfirmasi diterima. Garansi 30 hari tukar unit kini aktif!',
    })
  } catch (error) {
    console.error('Error confirming order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
