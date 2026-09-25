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
        orderNumber: true,
        userId: true,
        status: true,
        customerConfirmedAt: true,
        total: true,
        subtotal: true,
        shippingCost: true,
        insuranceFee: true,
        discountAmount: true,
        courierCode: true,
        courierService: true,
        trackingNumber: true,
        user: true,
        store: { select: { name: true, companyName: true } },
        items: {
          select: {
            id: true,
            price: true,
            quantity: true,
            variantName: true,
            product: { select: { name: true } },
            service: { select: { name: true } },
            rentalItem: { select: { name: true } },
          },
        },
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

    // Kirim tanda bukti transaksi selesai via email (Resend) & notifikasi WhatsApp
    try {
      const { dispatchTransactional } = await import('@/lib/notifications')
      const itemsList = order.items.map((it) => ({
        name:
          it.product?.name ||
          it.service?.name ||
          it.rentalItem?.name ||
          'Gadget Smartphone',
        variant: it.variantName || undefined,
        quantity: it.quantity || 1,
        price: it.price,
      }))

      const formattedWarranty = new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(warrantyExpiry)

      await dispatchTransactional({
        event: 'ORDER_COMPLETED',
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId: order.userId,
        customerName: order.user?.name || session.user.name || 'Pelanggan',
        customerPhone:
          order.user?.phone ||
          (session.user as { phone?: string })?.phone ||
          undefined,
        customerEmail: order.user?.email || session.user.email || undefined,
        storeName: order.store?.companyName || order.store?.name,
        courierName: order.courierCode || 'Kurir Logistik',
        courierService: order.courierService || undefined,
        awbNumber: order.trackingNumber || undefined,
        totalAmount: order.total,
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        insuranceFee: order.insuranceFee,
        discountAmount: order.discountAmount,
        items: itemsList,
        warrantyExpiryDate: formattedWarranty,
      })
    } catch (notifErr) {
      console.error('Failed to send order completed notification:', notifErr)
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message:
        'Pesanan berhasil dikonfirmasi diterima. Garansi 30 hari tukar unit kini aktif!',
    })
  } catch (error) {
    console.error('Error confirming order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
