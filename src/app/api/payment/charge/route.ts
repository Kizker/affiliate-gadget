import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import { chargeMidtransTransaction, CustomPaymentMethod } from '@/lib/midtrans'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { orderId, paymentType } = body as {
      orderId: string
      paymentType: CustomPaymentMethod
    }

    if (!orderId || !paymentType) {
      return NextResponse.json(
        { error: 'orderId dan paymentType wajib diisi' },
        { status: 400 }
      )
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
      },
      include: {
        user: true,
        payment: true,
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Pesanan tidak ditemukan' },
        { status: 404 }
      )
    }

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

    // Generate unique Midtrans transaction attempt ID per channel/attempt to prevent 406 Conflict
    const methodTag = paymentType.replace('_va', '').slice(0, 4).toUpperCase()
    const midtransOrderId = `${order.orderNumber}-${methodTag}-${Date.now().toString().slice(-4)}`

    // Call Midtrans Core API Charge
    const chargeRes = await chargeMidtransTransaction({
      orderId: midtransOrderId,
      grossAmount: order.total,
      paymentType,
      customerDetails: {
        firstName: session.user.name || 'Pelanggan',
        email: session.user.email || 'customer@affiliategadget.com',
        phone: order.user?.phone || (session.user as any).phone || '',
      },
    })

    // Record the active Midtrans transaction ID in the order payment record
    try {
      await prisma.payment.updateMany({
        where: { orderId: order.id },
        data: {
          notes: `Midtrans Transaction ID: ${midtransOrderId}`,
        },
      })
    } catch (dbErr) {
      console.warn(
        '[Payment Charge API] Failed to update payment notes:',
        dbErr
      )
    }

    // Extract standardized response based on payment type
    const result: {
      type: CustomPaymentMethod
      orderNumber: string
      midtransOrderId: string
      grossAmount: number
      expiryTime?: string
      qrCodeUrl?: string
      qrString?: string
      vaNumber?: string
      bank?: string
      billKey?: string
      billerCode?: string
      deepLinkUrl?: string
    } = {
      type: paymentType,
      orderNumber: order.orderNumber,
      midtransOrderId,
      grossAmount: order.total,
      expiryTime: chargeRes.expiry_time,
    }

    if (paymentType === 'qris') {
      const qrAction = chargeRes.actions?.find(
        (a: any) => a.name === 'generate-qr-code'
      )
      result.qrCodeUrl = qrAction?.url || chargeRes.actions?.[0]?.url
      result.qrString = chargeRes.qr_string
    } else if (
      paymentType === 'bca_va' ||
      paymentType === 'bni_va' ||
      paymentType === 'bri_va'
    ) {
      const va = chargeRes.va_numbers?.[0]
      result.vaNumber = va?.va_number
      result.bank = va?.bank?.toUpperCase()
    } else if (paymentType === 'mandiri_va') {
      result.billKey = chargeRes.bill_key
      result.billerCode = chargeRes.biller_code || '70012'
      result.bank = 'MANDIRI'
    } else if (paymentType === 'gopay' || paymentType === 'shopeepay') {
      const deepLink = chargeRes.actions?.find(
        (a: any) => a.name === 'deeplink-redirect'
      )
      const qrAction = chargeRes.actions?.find(
        (a: any) => a.name === 'generate-qr-code'
      )
      result.deepLinkUrl = deepLink?.url
      result.qrCodeUrl = qrAction?.url
      result.qrString = chargeRes.qr_string
    }

    return NextResponse.json({
      success: true,
      data: result,
      raw: chargeRes,
    })
  } catch (error: any) {
    console.error('[Payment Charge API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Gagal memproses pembayaran via Core API' },
      { status: 500 }
    )
  }
}
