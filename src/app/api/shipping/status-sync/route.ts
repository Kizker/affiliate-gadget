import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import type { OrderStatus } from '@prisma/client'
import {
  getShippingBooking,
  getDynamicTrackingTimeline,
  updateShippingStatus,
} from '@/lib/shipping/biteship-client'
import { detectShippingException } from '@/lib/shipping/exception-detector'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'STORE_ADMIN']
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId is required' },
        { status: 400 }
      )
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    })
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // STORE_ADMIN: only their own store's orders
    if (
      user.role === 'STORE_ADMIN' &&
      user.storeId &&
      order.storeId !== user.storeId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get current shipping record
    const record = getShippingBooking(orderId)
    if (!record) {
      return NextResponse.json(
        { error: 'No shipping record found for this order' },
        { status: 404 }
      )
    }

    // Apply dynamic timeline (simulate elapsed time)
    const liveRecord = getDynamicTrackingTimeline(record)
    const exception = detectShippingException(liveRecord.checkpoints)

    // Sync order status in DB if changed
    const statusMap: Record<string, string> = {
      DELIVERED: 'COMPLETED',
      CANCELLED: 'CANCELLED',
      DROPPING_OFF: 'IN_PROGRESS',
      ALLOCATED: 'IN_PROGRESS',
      PICKING_UP: 'IN_PROGRESS',
    }
    const newOrderStatus = (statusMap[liveRecord.status] ||
      order.status) as OrderStatus

    if (newOrderStatus !== order.status) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: newOrderStatus },
      })

      // Write AuditLog
      try {
        await prisma.auditLog.create({
          data: {
            action: 'SHIPPING_STATUS_SYNC',
            entityType: 'Order',
            entityId: orderId,
            userId: user.id,
            details: JSON.stringify({
              fromStatus: order.status,
              toStatus: newOrderStatus,
              shippingStatus: liveRecord.status,
              syncedBy: user.email,
            }),
          },
        })
      } catch {
        // Non-critical
      }
    }

    return NextResponse.json({
      success: true,
      message: `Status sinkronisasi berhasil${newOrderStatus !== order.status ? ` (${order.status} → ${newOrderStatus})` : ' (tidak ada perubahan)'}`,
      data: {
        orderId,
        orderStatus: newOrderStatus,
        shippingStatus: liveRecord.status,
        statusLabel: liveRecord.statusLabel,
        checkpoints: liveRecord.checkpoints,
        exception: exception.type !== 'NONE' ? exception : null,
      },
    })
  } catch (error) {
    console.error('Error syncing shipping status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
