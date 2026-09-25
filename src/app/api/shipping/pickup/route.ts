import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import { bookShippingPickup } from '@/lib/shipping/biteship-client'

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

    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId is required' },
        { status: 400 }
      )
    }

    // Get order with store, user, and items
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        store: true,
        user: {
          include: {
            addresses: {
              where: { isDefault: true },
              take: 1,
            },
          },
        },
        items: {
          include: {
            product: true,
            rentalItem: true,
            service: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Authorization check
    const isSuperOrAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN'
    const isStoreAdminOfOrder =
      user.role === 'STORE_ADMIN' &&
      user.storeId &&
      order.storeId === user.storeId

    if (!isSuperOrAdmin && !isStoreAdminOfOrder) {
      return NextResponse.json(
        {
          error: 'Forbidden - not authorized to request pickup for this order',
        },
        { status: 403 }
      )
    }

    // Prepare origin store details
    const originStore = {
      name: order.store?.name || 'Toko Gadget Pusat',
      companyName: order.store?.companyName || 'PT Gadget Jaya Sentosa',
      address: order.store?.address || 'ITC Roxy Mas Lt. 2 No. 15',
      city: order.store?.city || 'Jakarta',
      phone: order.store?.phone || '081234567890',
      latitude: order.store?.latitude,
      longitude: order.store?.longitude,
      postalCode: order.store?.postalCode,
    }

    // Prepare destination customer details
    const defaultAddress = order.user?.addresses?.[0]
    const destinationCustomer = {
      name: order.user?.name || 'Customer',
      address:
        defaultAddress?.fullAddress ||
        order.user?.address ||
        'Alamat Lengkap Customer Belum Terisi',
      city: defaultAddress?.city || order.user?.city || 'Jakarta',
      province:
        defaultAddress?.province || order.user?.province || 'DKI Jakarta',
      postalCode: defaultAddress?.postalCode || order.user?.postalCode,
      phone: defaultAddress?.phone || order.user?.phone || '081298765432',
      latitude: defaultAddress?.latitude,
      longitude: defaultAddress?.longitude,
    }

    // Prepare items list
    const items = order.items.map((item) => ({
      name:
        item.product?.name ||
        item.rentalItem?.name ||
        item.service?.name ||
        'Gadget Smartphone',
      quantity: item.quantity,
      weightGram: item.product?.weightGram || 500,
      price: item.price,
    }))

    const courierCode =
      (order.courierCode || 'JNE').toUpperCase() === 'GOJEK' ? 'GOJEK' : 'JNE'
    const courierService =
      order.courierService || (courierCode === 'GOJEK' ? 'INSTANT' : 'REG')

    // Call Biteship Booking / Sandbox Simulator
    const booking = await bookShippingPickup({
      orderId: order.id,
      orderNumber: order.orderNumber,
      courierCode,
      courierService,
      originStore,
      destinationCustomer,
      items,
    })

    // Update order in database to IN_PROGRESS and save trackingNumber
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'IN_PROGRESS',
        trackingNumber: booking.trackingNumber,
      },
    })

    // Dispatch non-blocking ORDER_SHIPPED notification
    import('@/lib/notifications').then(({ dispatchTransactional }) => {
      dispatchTransactional({
        event: 'ORDER_SHIPPED',
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId: order.userId,
        customerName: destinationCustomer.name,
        customerPhone: destinationCustomer.phone,
        customerEmail: order.user?.email || undefined,
        courierName: `${courierCode} ${courierService}`,
        awbNumber: booking.trackingNumber,
      }).catch((err) =>
        console.error('[SHIPPING PICKUP NOTIFICATION ERROR]:', err)
      )
    })

    return NextResponse.json({
      success: true,
      data: booking,
      message:
        courierCode === 'GOJEK'
          ? `Driver Gojek (${booking.driver?.name} - ${booking.driver?.plateNumber}) berhasil dialokasikan.`
          : `Resi JNE (${booking.trackingNumber}) berhasil diterbitkan.`,
    })
  } catch (error) {
    console.error('Error requesting shipping pickup:', error)
    return NextResponse.json(
      { error: 'Internal server error while booking courier' },
      { status: 500 }
    )
  }
}
