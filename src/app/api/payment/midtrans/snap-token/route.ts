import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import { createMidtransSnapTransaction } from '@/lib/midtrans'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId wajib diisi' },
        { status: 400 }
      )
    }

    // Query order by UUID or orderNumber
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
      },
      include: {
        payment: true,
        user: true,
        items: {
          include: {
            product: { select: { name: true } },
            service: { select: { name: true } },
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Pesanan tidak ditemukan' },
        { status: 404 }
      )
    }

    // RBAC: Customer owner, or store admin / platform admin
    if (
      order.userId !== session.user.id &&
      session.user.role !== 'SUPER_ADMIN' &&
      session.user.role !== 'ADMIN'
    ) {
      return NextResponse.json(
        { error: 'Akses ditolak ke pesanan ini' },
        { status: 403 }
      )
    }

    // Build Item Details for Midtrans
    const itemDetails = [
      ...order.items.map((it) => ({
        id: (it.productId || it.serviceId || it.id).substring(0, 50),
        price: it.price,
        quantity: it.quantity,
        name: (
          it.variantName ||
          it.product?.name ||
          it.service?.name ||
          'Gadget Item'
        ).substring(0, 50),
      })),
      ...(order.shippingCost > 0
        ? [
            {
              id: 'SHIPPING',
              price: order.shippingCost,
              quantity: 1,
              name: `Ongkir (${order.courierCode || 'Kurir'})`,
            },
          ]
        : []),
      ...(order.insuranceFee > 0
        ? [
            {
              id: 'INSURANCE',
              price: order.insuranceFee,
              quantity: 1,
              name: 'Asuransi Pengiriman',
            },
          ]
        : []),
    ]

    const snapRes = await createMidtransSnapTransaction({
      orderId: order.orderNumber,
      grossAmount: order.total,
      customerDetails: {
        firstName: session.user.name || 'Pelanggan',
        email: session.user.email || 'customer@affiliategadget.com',
        phone: order.user?.phone || (session.user as any).phone || '',
      },
      itemDetails,
    })

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      grossAmount: order.total,
      snapToken: snapRes.token,
      snapRedirectUrl: snapRes.redirect_url,
    })
  } catch (error: any) {
    console.error('[Midtrans Snap Token API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Gagal membuat token pembayaran Midtrans' },
      { status: 500 }
    )
  }
}
