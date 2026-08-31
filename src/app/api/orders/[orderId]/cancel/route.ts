import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// POST - Customer cancels an order (if not yet shipped)
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
    const body = await request.json().catch(() => ({}))
    const { reason = 'Dibatalkan oleh pembeli' } = body

    // Check if order exists and belongs to this customer
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        status: true,
        notes: true,
        orderNumber: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 })
    }

    if (order.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Anda hanya dapat membatalkan pesanan milik Anda sendiri' },
        { status: 403 }
      )
    }

    // Only allow cancellation if order is not yet shipped / completed
    const cancellableStatuses = ['PENDING_PAYMENT', 'PAID', 'PROCESSING']
    if (!cancellableStatuses.includes(order.status)) {
      return NextResponse.json(
        {
          error:
            'Pesanan sudah dalam pengiriman/selesai dan tidak dapat dibatalkan secara otomatis. Silakan hubungi penjual via WhatsApp.',
        },
        { status: 400 }
      )
    }

    // Update order status to CANCELLED
    const updatedNotes = order.notes
      ? `${order.notes}\n[Pembatalan ${new Date().toLocaleDateString('id-ID')}]: ${reason}`
      : `[Pembatalan ${new Date().toLocaleDateString('id-ID')}]: ${reason}`

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        notes: updatedNotes,
      },
    })

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: 'Pesanan berhasil dibatalkan',
    })
  } catch (error) {
    console.error('Error cancelling order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
