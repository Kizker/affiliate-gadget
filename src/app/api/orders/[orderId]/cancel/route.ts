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

    // Check authorization: customer owner, store admin of order, or superadmin
    const userRole = session.user.role || 'CUSTOMER'
    const isCustomer = userRole === 'CUSTOMER'
    const isSuperOrAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN'
    const isStoreStaff =
      userRole === 'STORE_ADMIN' || userRole === 'STORE_SALES'

    let userStoreId = (session.user as any).storeId || null
    if (isStoreStaff && !userStoreId) {
      const u = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { storeId: true },
      })
      userStoreId = u?.storeId || null
    }

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payment: true,
        user: true,
        store: true,
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Pesanan tidak ditemukan' },
        { status: 404 }
      )
    }

    if (isCustomer && order.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Pesanan tidak ditemukan' },
        { status: 404 }
      )
    }

    if (isStoreStaff && (!userStoreId || order.storeId !== userStoreId)) {
      return NextResponse.json(
        { error: 'Pesanan tidak ditemukan' },
        { status: 404 }
      )
    }

    if (!isCustomer && !isStoreStaff && !isSuperOrAdmin) {
      return NextResponse.json(
        { error: 'Tidak memiliki izin membatalkan pesanan ini' },
        { status: 403 }
      )
    }

    // Only allow cancellation if order is not yet shipped / completed
    const cancellableStatuses = [
      'PENDING_PAYMENT',
      'PAID',
      'PROCESSING',
      'IN_PROGRESS',
    ]
    if (!cancellableStatuses.includes(order.status)) {
      return NextResponse.json(
        {
          error:
            'Pesanan sudah dalam pengiriman kurir atau telah selesai dan tidak dapat dibatalkan.',
        },
        { status: 400 }
      )
    }

    const cancellerActor = isCustomer
      ? 'Pembeli'
      : isStoreStaff
        ? `Toko (${order.store?.name || 'Admin Toko'})`
        : 'Superadmin'

    const updatedNotes = order.notes
      ? `${order.notes}\n[Pembatalan oleh ${cancellerActor} ${new Date().toLocaleDateString('id-ID')}]: ${reason}`
      : `[Pembatalan oleh ${cancellerActor} ${new Date().toLocaleDateString('id-ID')}]: ${reason}`

    // Eksekusi atomik: batalkan pesanan & kembalikan stok fisik produk dan varian
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const cancelled = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          notes: updatedNotes,
        },
      })

      // Kembalikan stok unit produk dan varian
      for (const item of order.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          })
        }
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          })
        }
      }

      // Update payment note/status jika status masih PENDING_PAYMENT
      if (order.status === 'PENDING_PAYMENT' && order.payment) {
        await tx.payment.update({
          where: { id: order.payment.id },
          data: {
            status: 'REJECTED',
            notes: order.payment.notes
              ? `${order.payment.notes} - Pesanan dibatalkan`
              : 'Pesanan dibatalkan',
          },
        })
      }

      return cancelled
    })

    // Kirim bukti pembatalan transaksi ke email pengguna
    try {
      const { sendOrderCancelledEmail } = await import('@/lib/email')
      await sendOrderCancelledEmail({ orderId, reason })
    } catch (emailErr) {
      console.error('Failed to send order cancelled email:', emailErr)
    }

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
