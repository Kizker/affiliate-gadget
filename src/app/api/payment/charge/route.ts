import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import { chargeMidtransTransaction, CustomPaymentMethod } from '@/lib/midtrans'
import { cancelExpiredOrderIfDue } from '@/lib/order-expiration'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const orderId =
      searchParams.get('orderId') || searchParams.get('orderNumber')

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId wajib diisi' },
        { status: 400 }
      )
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
      },
      include: {
        payment: true,
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Pesanan tidak ditemukan' },
        { status: 404 }
      )
    }

    // Auto-cancel if expired
    const cancelCheck = await cancelExpiredOrderIfDue(order.id)
    if (cancelCheck.wasCancelled || order.status === 'CANCELLED') {
      return NextResponse.json({
        success: false,
        isExpired: true,
        orderStatus: 'CANCELLED',
        data: null,
      })
    }

    // Parse active charge from payment.notes if present
    if (order.payment?.notes && order.payment.notes.startsWith('{')) {
      try {
        const parsed = JSON.parse(order.payment.notes)
        if (parsed.expiryTime) {
          const expMs = new Date(parsed.expiryTime).getTime()
          const remainingSeconds = Math.max(
            0,
            Math.floor((expMs - Date.now()) / 1000)
          )
          if (remainingSeconds > 0) {
            return NextResponse.json({
              success: true,
              data: parsed,
              remainingSeconds,
            })
          }
        }
      } catch (_) {}
    }

    return NextResponse.json({
      success: true,
      data: null,
    })
  } catch (err: any) {
    console.error('[Payment Charge GET] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

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

    // Periksa apakah batas waktu pembayaran telah habis
    const cancelCheck = await cancelExpiredOrderIfDue(order.id)
    if (cancelCheck.wasCancelled || order.status === 'CANCELLED') {
      return NextResponse.json(
        {
          error:
            'Batas waktu pembayaran telah berakhir. Pesanan ini telah otomatis dibatalkan.',
        },
        { status: 400 }
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

    // Jika sudah ada tagihan aktif untuk metode yang sama dan belum kedaluwarsa, kembalikan data yang sama agar timer & VA tidak tereset!
    if (order.payment?.notes && order.payment.notes.startsWith('{')) {
      try {
        const existing = JSON.parse(order.payment.notes)
        if (existing.type === paymentType && existing.expiryTime) {
          const expMs = new Date(existing.expiryTime).getTime()
          const remainingSeconds = Math.max(
            0,
            Math.floor((expMs - Date.now()) / 1000)
          )
          if (remainingSeconds > 0) {
            return NextResponse.json({
              success: true,
              data: existing,
              remainingSeconds,
              resumed: true,
            })
          }
        }
      } catch (_) {}
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

    // Calculate standardized expiryTime
    const isShort =
      paymentType === 'qris' ||
      paymentType === 'gopay' ||
      paymentType === 'shopeepay'
    let calculatedExpiry: string
    if (chargeRes.expiry_time) {
      const formatted = chargeRes.expiry_time.includes('T')
        ? chargeRes.expiry_time
        : chargeRes.expiry_time.replace(' ', 'T') + '+07:00'
      calculatedExpiry = new Date(formatted).toISOString()
    } else {
      calculatedExpiry = new Date(
        Date.now() + (isShort ? 15 * 60 * 1000 : 24 * 60 * 60 * 1000)
      ).toISOString()
    }

    // Extract standardized response based on payment type
    const result: {
      type: CustomPaymentMethod
      orderNumber: string
      midtransOrderId: string
      grossAmount: number
      expiryTime: string
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
      expiryTime: calculatedExpiry,
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

    // Record the full active charge details in the order payment record so it persists across refreshes
    try {
      if (order.payment) {
        await prisma.payment.update({
          where: { id: order.payment.id },
          data: {
            notes: JSON.stringify(result),
            updatedAt: new Date(),
          },
        })
      } else {
        await prisma.payment.create({
          data: {
            orderId: order.id,
            method: 'MIDTRANS',
            amount: order.total,
            status: 'PENDING',
            notes: JSON.stringify(result),
          },
        })
      }
    } catch (dbErr) {
      console.warn(
        '[Payment Charge API] Failed to update payment notes:',
        dbErr
      )
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

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const orderId =
      searchParams.get('orderId') || searchParams.get('orderNumber')

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId wajib diisi' },
        { status: 400 }
      )
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
      },
      include: {
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
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    // Reset notes di payment record
    if (order.payment) {
      await prisma.payment.update({
        where: { id: order.payment.id },
        data: {
          notes: null,
          updatedAt: new Date(),
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Tagihan pembayaran aktif berhasil direset',
    })
  } catch (err: any) {
    console.error('[Payment Charge DELETE] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
