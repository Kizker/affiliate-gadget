import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import { checkMidtransTransactionStatus } from '@/lib/midtrans'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const orderNumber = searchParams.get('orderNumber')
    const midtransOrderId = searchParams.get('midtransOrderId')

    if (!orderNumber) {
      return NextResponse.json(
        { error: 'orderNumber wajib diisi' },
        { status: 400 }
      )
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ orderNumber }, { id: orderNumber }],
      },
      include: { payment: true },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Pesanan tidak ditemukan' },
        { status: 404 }
      )
    }

    // If order is already paid in DB, return success immediately
    if (
      order.status === 'PAID' ||
      order.status === 'IN_PROGRESS' ||
      order.status === 'SHIPPED' ||
      order.status === 'COMPLETED' ||
      order.payment?.status === 'VERIFIED'
    ) {
      return NextResponse.json({
        isPaid: true,
        orderStatus: order.status,
        paymentStatus: 'VERIFIED',
        transactionStatus: 'settlement',
      })
    }

    // Query live transaction status from Midtrans Core API
    let midtransStatus: any = null
    const parsedMidtransId = order.payment?.notes?.match(
      /Midtrans Transaction ID:\s*([^\s]+)/
    )?.[1]
    const idToCheck = midtransOrderId || parsedMidtransId || order.orderNumber

    try {
      midtransStatus = await checkMidtransTransactionStatus(idToCheck)
    } catch (err: any) {
      // If attempt ID wasn't found, try checking base orderNumber as fallback
      if (idToCheck !== order.orderNumber) {
        try {
          midtransStatus = await checkMidtransTransactionStatus(
            order.orderNumber
          )
        } catch {}
      }

      if (!midtransStatus) {
        return NextResponse.json({
          isPaid: false,
          orderStatus: order.status,
          paymentStatus: order.payment?.status || 'PENDING',
          transactionStatus: 'not_found',
        })
      }
    }

    const txStatus = midtransStatus?.transaction_status
    const fraudStatus = midtransStatus?.fraud_status

    const isSuccess =
      txStatus === 'settlement' ||
      (txStatus === 'capture' && fraudStatus === 'accept')

    if (isSuccess) {
      // Atomically update DB order and payment
      await prisma.$transaction(async (tx: any) => {
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: 'PAID',
            updatedAt: new Date(),
          },
        })

        if (order.payment) {
          await tx.payment.update({
            where: { id: order.payment.id },
            data: {
              status: 'VERIFIED',
              updatedAt: new Date(),
              notes: `Midtrans Core API Settlement - TxID: ${midtransStatus.transaction_id}`,
            },
          })
        }
      })

      return NextResponse.json({
        isPaid: true,
        orderStatus: 'PAID',
        paymentStatus: 'VERIFIED',
        transactionStatus: txStatus,
      })
    }

    const isFailed =
      txStatus === 'cancel' || txStatus === 'expire' || txStatus === 'deny'

    if (isFailed) {
      return NextResponse.json({
        isPaid: false,
        isFailed: true,
        orderStatus: order.status,
        paymentStatus: 'FAILED',
        transactionStatus: txStatus,
      })
    }

    return NextResponse.json({
      isPaid: false,
      orderStatus: order.status,
      paymentStatus: 'PENDING',
      transactionStatus: txStatus || 'pending',
    })
  } catch (error: any) {
    console.error('[Payment Status API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Gagal memeriksa status pembayaran' },
      { status: 500 }
    )
  }
}
