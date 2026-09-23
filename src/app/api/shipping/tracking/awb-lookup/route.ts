/**
 * Public AWB & Order Tracking Lookup API
 * Melacak paket berdasarkan nomor resi (JNE, Gojek, Biteship WYB) atau nomor pesanan tanpa login
 * Digunakan oleh halaman publik /resi
 */
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import {
  getTrackingByAWB,
  getDynamicTrackingTimeline,
  ShippingBookingRecord,
} from '@/lib/shipping/biteship-client'
import { detectShippingException } from '@/lib/shipping/exception-detector'
import { validateAWB } from '@/lib/shipping/awb-validator'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const rawInput = searchParams.get('awb') || searchParams.get('q')

    if (!rawInput) {
      return NextResponse.json(
        {
          success: false,
          error: 'Parameter nomor resi atau nomor order wajib diisi',
        },
        { status: 400 }
      )
    }

    const cleanInput = rawInput.trim().toUpperCase().replace(/^#/, '')

    // Validate AWB / Order Number format
    const validation = validateAWB(cleanInput)
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error:
            validation.error ||
            'Format nomor resi atau nomor pesanan tidak valid',
        },
        { status: 400 }
      )
    }

    // 1. Look up in shipping store (Biteship simulation / records)
    let record: ShippingBookingRecord | null = getTrackingByAWB(cleanInput)

    // 2. If not found in shipping store, check Prisma database
    if (!record) {
      const order = await prisma.order.findFirst({
        where: {
          OR: [
            { trackingNumber: { equals: cleanInput, mode: 'insensitive' } },
            { orderNumber: { equals: cleanInput, mode: 'insensitive' } },
            { id: cleanInput },
          ],
        },
        include: {
          store: true,
          user: true,
          items: {
            include: { product: true, rentalItem: true, service: true },
          },
        },
      })

      if (order) {
        const isGojek = (order.courierCode || '').toUpperCase() === 'GOJEK'
        const trackingNumber =
          order.trackingNumber || (isGojek ? 'GK-2609230001' : 'JNE2609230001')

        record = {
          orderId: order.id,
          orderNumber: order.orderNumber,
          courierCode: isGojek ? 'GOJEK' : 'JNE',
          courierService: order.courierService || (isGojek ? 'INSTANT' : 'REG'),
          trackingNumber,
          status:
            order.status === 'COMPLETED'
              ? 'DELIVERED'
              : order.status === 'SHIPPED'
                ? 'DROPPING_OFF'
                : 'ALLOCATED',
          statusLabel:
            order.status === 'COMPLETED'
              ? 'Paket Telah Diterima'
              : order.status === 'SHIPPED'
                ? 'Paket Sedang Diantar Kurir'
                : isGojek
                  ? 'Driver Sedang Menuju Toko'
                  : 'Resi Terbit — Menunggu Pickup Ekspedisi',
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
                  : order.status === 'SHIPPED'
                    ? `Paket sedang dalam perjalanan bersama kurir (${trackingNumber}).`
                    : `Paket telah diproses oleh ${isGojek ? 'Gojek' : 'JNE Express'} (${trackingNumber}).`,
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
    }

    if (!record) {
      return NextResponse.json(
        {
          success: false,
          error: `Nomor resi atau pesanan "${cleanInput}" tidak ditemukan dalam sistem kami`,
        },
        { status: 404 }
      )
    }

    // Apply dynamic timeline
    const liveRecord = getDynamicTrackingTimeline(record)
    const exception = detectShippingException(liveRecord.checkpoints)

    return NextResponse.json({
      success: true,
      data: liveRecord,
      exception: exception.type !== 'NONE' ? exception : null,
    })
  } catch (error) {
    console.error('Error in AWB lookup:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server saat melacak paket' },
      { status: 500 }
    )
  }
}
