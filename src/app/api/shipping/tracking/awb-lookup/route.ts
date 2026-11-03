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

    // 1b. Check ReturnRequest tracking (Pengiriman balik dari pembeli ke toko)
    if (!record) {
      const returnReq = await prisma.returnRequest.findFirst({
        where: {
          returnTrackingNumber: { equals: cleanInput, mode: 'insensitive' },
        },
        include: {
          order: {
            include: {
              store: true,
              user: true,
              items: {
                include: { product: true, rentalItem: true, service: true },
              },
            },
          },
          user: true,
        },
      })

      if (returnReq && returnReq.order) {
        const order = returnReq.order
        const isGojek = (returnReq.returnCourier || '')
          .toUpperCase()
          .includes('GOJEK')
        const trackingNumber = returnReq.returnTrackingNumber || cleanInput

        record = {
          orderId: order.id,
          orderNumber: order.orderNumber,
          courierCode: isGojek ? 'GOJEK' : 'JNE',
          courierService: isGojek ? 'INSTANT' : 'REG',
          trackingNumber,
          status:
            returnReq.status === 'COMPLETED' ? 'DELIVERED' : 'DROPPING_OFF',
          statusLabel:
            returnReq.status === 'COMPLETED'
              ? 'Paket Retur Telah Diterima Toko Cabang'
              : isGojek
                ? 'Driver Gojek Sedang Mengantar Paket Retur ke Toko Cabang'
                : 'Paket Retur Dalam Pengiriman ke Toko Cabang',
          driver: isGojek
            ? {
                name: 'Andi Saputra (Kurir Retur)',
                phone: '0812-8877-6655',
                plateNumber: 'B 3912 KZZ',
                vehicleModel: 'Honda Vario 160 Hitam',
              }
            : undefined,
          originStore: {
            name: `${returnReq.user?.name || 'Pembeli'} (Pengirim Retur)`,
            companyName: 'Pelanggan Retur',
            address: returnReq.user?.address || 'Alamat Pelanggan',
            city: returnReq.user?.city || 'Alamat Pembeli',
            phone: returnReq.user?.phone || '081289901122',
          },
          destinationCustomer: {
            name: `${order.store?.name || 'Toko Cabang'} (Penerima Retur)`,
            address: order.store?.address || 'Alamat Toko Cabang',
            city: order.store?.city || 'Toko Cabang',
            province: order.store?.city || 'Indonesia',
            phone: order.store?.phone || '081234567890',
          },
          checkpoints: [
            {
              id: 'CP-RET-1',
              status: 'PICKED_UP',
              description: `Paket retur diserahkan oleh pembeli (${returnReq.user?.name || 'Customer'}) ke kurir ${returnReq.returnCourier || 'Ekspedisi'}.`,
              location: 'Gerai Ekspedisi / Lokasi Penjemputan',
              timestamp: new Date(returnReq.createdAt).toISOString(),
            },
            {
              id: 'CP-RET-2',
              status:
                returnReq.status === 'COMPLETED' ? 'DELIVERED' : 'DROPPING_OFF',
              description:
                returnReq.status === 'COMPLETED'
                  ? `Paket retur tiba di ${order.store?.name || 'Toko Cabang'} dan telah diterima untuk verifikasi fisik / QC.`
                  : `Paket retur sedang dalam perjalanan menuju alamat ${order.store?.name || 'Toko Cabang'} (${order.store?.city || ''}).`,
              location: order.store?.city || 'Pusat Logistik',
              timestamp: new Date().toISOString(),
            },
          ],
          bookedAt: new Date(returnReq.createdAt).toISOString(),
          estimatedDelivery: isGojek ? '1-2 Jam' : '2-3 Hari',
          items: (order.items || []).map((i) => ({
            name:
              i.product?.name ||
              i.rentalItem?.name ||
              i.service?.name ||
              'Unit Gadget',
            quantity: i.quantity || 1,
            weightGram: i.product?.weightGram || 500,
          })),
        }
      }
    }

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
