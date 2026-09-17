import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { verifyMidtransSignature } from '@/lib/midtrans'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type,
    } = body

    if (!order_id || !status_code || !gross_amount || !signature_key) {
      return NextResponse.json(
        { error: 'Missing required webhook parameters' },
        { status: 400 }
      )
    }

    // 1. Verify Midtrans cryptographic SHA512 signature
    const isValid = verifyMidtransSignature({
      orderId: order_id,
      statusCode: status_code,
      grossAmount: gross_amount,
      signatureKey: signature_key,
    })

    if (!isValid) {
      console.warn(
        '[Midtrans Webhook] Invalid signature received for order:',
        order_id
      )
      return NextResponse.json(
        { error: 'Invalid signature key' },
        { status: 403 }
      )
    }

    // 2. Locate order in database (support direct match, base order number, or payment notes)
    let order = await prisma.order.findUnique({
      where: { orderNumber: order_id },
      include: {
        items: true,
        payment: true,
      },
    })

    // If order_id contains attempt/channel suffix (e.g. SPR-20260917-ECB20C80-BCA-5185)
    if (!order) {
      const parts = String(order_id).split('-')
      if (parts.length > 3) {
        const baseOrderNumber = `${parts[0]}-${parts[1]}-${parts[2]}`
        order = await prisma.order.findUnique({
          where: { orderNumber: baseOrderNumber },
          include: {
            items: true,
            payment: true,
          },
        })
      }
    }

    // Fallback: match via payment notes
    if (!order) {
      order = await prisma.order.findFirst({
        where: {
          payment: {
            notes: { contains: order_id },
          },
        },
        include: {
          items: true,
          payment: true,
        },
      })
    }

    if (!order) {
      console.warn(
        '[Midtrans Webhook] Order not found for orderNumber:',
        order_id
      )
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // 3. Determine payment & order status
    let paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' = 'PENDING'
    let orderStatus: 'PENDING_PAYMENT' | 'PROCESSING' | 'CANCELLED' =
      'PENDING_PAYMENT'

    if (transaction_status === 'capture') {
      if (fraud_status === 'challenge') {
        paymentStatus = 'PENDING'
        orderStatus = 'PENDING_PAYMENT'
      } else if (fraud_status === 'accept') {
        paymentStatus = 'PAID'
        orderStatus = 'PROCESSING'
      }
    } else if (transaction_status === 'settlement') {
      paymentStatus = 'PAID'
      orderStatus = 'PROCESSING'
    } else if (transaction_status === 'pending') {
      paymentStatus = 'PENDING'
      orderStatus = 'PENDING_PAYMENT'
    } else if (
      transaction_status === 'deny' ||
      transaction_status === 'cancel' ||
      transaction_status === 'expire'
    ) {
      paymentStatus = transaction_status === 'expire' ? 'EXPIRED' : 'FAILED'
      orderStatus = 'CANCELLED'
    }

    // 4. Update database in atomic transaction
    await prisma.$transaction(async (tx: any) => {
      // Update order status
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: orderStatus,
        },
      })

      // Update or create payment record
      if (order.payment) {
        await tx.payment.update({
          where: { id: order.payment.id },
          data: {
            status: paymentStatus,
            referenceNumber: body.transaction_id || undefined,
          },
        })
      } else {
        await tx.payment.create({
          data: {
            orderId: order.id,
            method: 'MIDTRANS',
            amount: order.total,
            status: paymentStatus,
            referenceNumber: body.transaction_id || undefined,
          },
        })
      }

      // If payment failed or expired, restore stock back to inventory
      if (orderStatus === 'CANCELLED' && order.status !== 'CANCELLED') {
        for (const item of order.items) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            })
          }
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            })
          }
        }
      }
    })

    console.log(
      `[Midtrans Webhook] Successfully processed ${order_id}: ${transaction_status} -> Payment: ${paymentStatus}, Order: ${orderStatus}`
    )

    return NextResponse.json({
      status: 'OK',
      message: 'Notification processed successfully',
      orderNumber: order_id,
      paymentStatus,
    })
  } catch (error: any) {
    console.error('[Midtrans Webhook] Error processing notification:', error)
    return NextResponse.json(
      {
        error: 'Internal server error processing webhook',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
