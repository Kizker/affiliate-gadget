import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import {
  getShippingBooking,
  getDynamicTrackingTimeline,
  getTrackingByAWB,
  ShippingBookingRecord,
} from '@/lib/shipping/biteship-client'
import { detectShippingException } from '@/lib/shipping/exception-detector'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    const { searchParams } = new URL(request.url)
    const awbParam = searchParams.get('awb')

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId is required' },
        { status: 400 }
      )
    }

    // 0. Try AWB-based lookup first (query ?awb=JNExxxxxxxx)
    if (awbParam) {
      const awbRecord = getTrackingByAWB(awbParam)
      if (awbRecord) {
        const liveRecord = getDynamicTrackingTimeline(awbRecord)
        const exception = detectShippingException(liveRecord.checkpoints)
        return NextResponse.json({
          success: true,
          data: liveRecord,
          exception: exception.type !== 'NONE' ? exception : null,
        })
      }
    }

    // 1. Check if booking exists in shipping store
    let record = getShippingBooking(orderId)

    // 2. If not found in store, fetch from database to construct dynamic record
    if (!record) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          store: true,
          user: true,
          items: {
            include: { product: true, rentalItem: true, service: true },
          },
        },
      })

      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }

      const isGojek = (order.courierCode || '').toUpperCase() === 'GOJEK'
      const trackingNumber =
        order.trackingNumber || (isGojek ? 'GK-2609210001' : 'JNE2609210001')

      record = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        courierCode: isGojek ? 'GOJEK' : 'JNE',
        courierService: order.courierService || (isGojek ? 'INSTANT' : 'REG'),
        trackingNumber,
        status: order.status === 'COMPLETED' ? 'DELIVERED' : 'ALLOCATED',
        statusLabel:
          order.status === 'COMPLETED'
            ? 'Paket Telah Diterima'
            : isGojek
              ? 'Driver Sedang Menuju Lokasi'
              : 'Paket Dalam Perjalanan Ekspedisi',
        driver: isGojek
          ? {
              name: 'Budi Santoso',
              phone: '0812-8841-9023',
              plateNumber: 'B 4821 KZZ',
              vehicleModel: 'Honda Vario 160 Hitam',
            }
          : undefined,
        checkpoints: [
          {
            id: 'cp-init',
            status: order.status === 'COMPLETED' ? 'DELIVERED' : 'MANIFESTED',
            description:
              order.status === 'COMPLETED'
                ? 'Paket telah diterima dengan baik oleh penerima.'
                : isGojek
                  ? 'Driver sedang mengantar paket ke alamat tujuan.'
                  : `Paket telah diproses oleh ekspedisi JNE (${trackingNumber}).`,
            location: order.store?.city || 'Jakarta',
            timestamp: order.updatedAt.toISOString(),
          },
        ],
        bookedAt: order.createdAt.toISOString(),
        estimatedDelivery: isGojek ? '1-2 Jam' : '2-3 Hari',
        originStore: {
          name: order.store?.name || 'Toko Cabang',
          companyName: order.store?.companyName || 'PT Gadget Jaya Sentosa',
          address: order.store?.address || 'Jakarta',
          city: order.store?.city || 'Jakarta',
          phone: order.store?.phone || '081234567890',
        },
        destinationCustomer: {
          name: order.user?.name || 'Customer',
          address: order.user?.address || 'Alamat Customer',
          city: order.user?.city || 'Jakarta',
          province: order.user?.province || 'DKI Jakarta',
          postalCode: order.user?.postalCode || undefined,
          phone: order.user?.phone || '081298765432',
        },
        items: order.items.map((i) => ({
          name:
            i.product?.name ||
            i.rentalItem?.name ||
            i.service?.name ||
            'Gadget Smartphone',
          quantity: i.quantity,
          weightGram: i.product?.weightGram || 500,
        })),
      }
    }

    // 3. Apply dynamic timeline progression
    const liveRecord = getDynamicTrackingTimeline(record)
    const exception = detectShippingException(liveRecord.checkpoints)

    return NextResponse.json({
      success: true,
      data: liveRecord,
      exception: exception.type !== 'NONE' ? exception : null,
    })
  } catch (error) {
    console.error('Error fetching shipping tracking:', error)
    return NextResponse.json(
      { error: 'Internal server error fetching tracking' },
      { status: 500 }
    )
  }
}
