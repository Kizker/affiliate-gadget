import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { updateShippingStatus } from '@/lib/shipping/biteship-client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Simple signature verification via header (Biteship sends X-Webhook-Token)
    const webhookToken = request.headers.get('x-webhook-token')
    const expectedToken = process.env.BITESHIP_WEBHOOK_TOKEN
    if (expectedToken && webhookToken !== expectedToken) {
      console.warn('Webhook: invalid signature token')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { event, order_id, courier, status } = body

    if (!order_id) {
      return NextResponse.json({ received: true })
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: order_id },
          { orderNumber: order_id },
          { trackingNumber: courier?.waybill_id || courier?.tracking_id },
        ],
      },
      include: {
        user: true,
      },
    })

    if (order) {
      let nextStatus = order.status
      let statusLabel = ''

      if (status === 'delivered') {
        nextStatus = 'COMPLETED'
        statusLabel = 'Paket telah diterima oleh customer'

        // Dispatch ORDER_DELIVERED notification
        import('@/lib/notifications').then(({ dispatchTransactional }) => {
          dispatchTransactional({
            event: 'ORDER_DELIVERED',
            orderId: order.id,
            orderNumber: order.orderNumber,
            userId: order.userId,
            customerName: order.user?.name || 'Pelanggan',
            customerPhone: order.user?.phone || undefined,
            customerEmail: order.user?.email || undefined,
          }).catch((err) =>
            console.error('[ORDER_DELIVERED NOTIFICATION ERROR]:', err)
          )
        })
      } else if (status === 'returned' || status === 'return_to_sender') {
        nextStatus = 'RETURNED'
        statusLabel = 'Paket dikembalikan ke toko asal'
      } else if (status === 'cancelled') {
        nextStatus = 'CANCELLED'
        statusLabel = 'Pengiriman dibatalkan'
      } else if (
        [
          'allocated',
          'picking_up',
          'dropping_off',
          'on_transit',
          'with_courier',
        ].includes(status)
      ) {
        nextStatus = 'IN_PROGRESS'
        statusLabel = 'Paket sedang dalam perjalanan'
      } else if (
        ['exception', 'damaged', 'lost', 'address_not_found'].includes(status)
      ) {
        nextStatus = 'COMPLAINED'
        statusLabel = `Kendala pengiriman terdeteksi: ${status}`
      }

      if (nextStatus !== order.status) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: nextStatus,
            trackingNumber: courier?.waybill_id || order.trackingNumber,
          },
        })

        updateShippingStatus(
          order.id,
          nextStatus === 'COMPLETED'
            ? 'DELIVERED'
            : nextStatus === 'CANCELLED'
              ? 'CANCELLED'
              : 'DROPPING_OFF',
          statusLabel,
          statusLabel,
          courier?.current_location || undefined
        )

        try {
          await prisma.auditLog.create({
            data: {
              action: 'SHIPPING_STATUS_UPDATED',
              entityType: 'Order',
              entityId: order.id,
              details: JSON.stringify({
                event,
                fromStatus: order.status,
                toStatus: nextStatus,
                courierStatus: status,
                trackingNumber: courier?.waybill_id || order.trackingNumber,
              }),
            },
          })
        } catch {
          // AuditLog failure is non-critical
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Webhook processed' })
  } catch (error) {
    console.error('Error handling shipping webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error processing webhook' },
      { status: 500 }
    )
  }
}
