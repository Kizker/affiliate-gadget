import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import {
  getShippingBooking,
  ShippingBookingRecord,
} from '@/lib/shipping/biteship-client'
import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), '.data')
const SHIPPING_STORE_FILE = path.join(DATA_DIR, 'shipping-store.json')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Biteship sends events like 'order.status_updated' or 'order.waybill_updated'
    const { event, order_id, courier, status } = body

    if (!order_id) {
      return NextResponse.json({ received: true })
    }

    // Try finding the order in database by orderId or orderNumber or trackingNumber
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: order_id },
          { orderNumber: order_id },
          { trackingNumber: courier?.waybill_id || courier?.tracking_id },
        ],
      },
    })

    if (order) {
      // Map Biteship status to Order status
      // allocated -> IN_PROGRESS
      // picking_up -> IN_PROGRESS
      // dropping_off -> IN_PROGRESS
      // delivered -> COMPLETED
      // cancelled -> CANCELLED
      let nextStatus = order.status
      if (status === 'delivered') {
        nextStatus = 'COMPLETED'
      } else if (status === 'cancelled') {
        nextStatus = 'CANCELLED'
      } else if (['allocated', 'picking_up', 'dropping_off'].includes(status)) {
        nextStatus = 'IN_PROGRESS'
      }

      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: nextStatus,
          trackingNumber: courier?.waybill_id || order.trackingNumber,
        },
      })
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
