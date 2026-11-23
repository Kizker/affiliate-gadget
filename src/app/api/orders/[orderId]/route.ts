import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import { cancelExpiredOrderIfDue } from '@/lib/order-expiration'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await params
    const { role, id: userId, storeId } = session.user

    // Scoped query filter by role to prevent IDOR & ID enumeration at database level
    let whereClause: any = { id: orderId }

    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      whereClause = { id: orderId }
    } else if (role === 'STORE_ADMIN' || role === 'STORE_SALES') {
      let userStoreId = storeId
      if (!userStoreId) {
        const u = await prisma.user.findUnique({
          where: { id: userId },
          select: { storeId: true },
        })
        userStoreId = u?.storeId || null
      }
      whereClause = {
        id: orderId,
        storeId: userStoreId || 'none',
      }
    } else if (role === 'AFTER_SALES') {
      const group = await prisma.storeGroup.findFirst({
        where: { afterSalesUserId: userId },
        include: { stores: { select: { id: true } } },
      })
      const storeIds = group?.stores.map((s) => s.id) || []
      whereClause = {
        id: orderId,
        storeId: storeIds.length > 0 ? { in: storeIds } : undefined,
      }
    } else {
      whereClause = {
        id: orderId,
        OR: [{ userId }, { technician: { userId } }],
      }
    }

    const order = await prisma.order.findFirst({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        items: {
          select: {
            id: true,
            type: true,
            quantity: true,
            price: true,
            subtotal: true,
            finalPrice: true,
            rentalDays: true,
            service: {
              select: {
                name: true,
                category: true,
                minPrice: true,
                maxPrice: true,
              },
            },
            product: {
              select: {
                id: true,
                name: true,
                images: true,
                price: true,
              },
            },
            rentalItem: {
              select: {
                id: true,
                name: true,
                images: true,
                pricePerDay: true,
                depositAmount: true,
              },
            },
          },
        },
        technician: {
          include: {
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
        payment: true,
        store: {
          select: {
            id: true,
            name: true,
            city: true,
            bankAccounts: {
              select: {
                bankName: true,
                accountNumber: true,
                accountName: true,
                isPrimary: true,
              },
            },
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Auto-cancel jika pesanan PENDING_PAYMENT sudah melebihi batas 24 jam
    if (order.status === 'PENDING_PAYMENT') {
      const cancelCheck = await cancelExpiredOrderIfDue(order.id)
      if (cancelCheck.wasCancelled && cancelCheck.order) {
        return NextResponse.json(
          {
            order: {
              ...order,
              status: 'CANCELLED',
              notes: cancelCheck.order.notes,
              payment: order.payment
                ? { ...order.payment, status: 'EXPIRED' }
                : null,
            },
          },
          {
            headers: {
              'Cache-Control': 'no-store, must-revalidate',
            },
          }
        )
      }

      // Live reconciliation: Jika sudah ada tagihan Midtrans, cek apakah sudah dibayar di Midtrans
      const parsedMidtransId = order.payment?.notes?.match(
        /"midtransOrderId"\s*:\s*"([^"]+)"/
      )?.[1]
      if (parsedMidtransId) {
        try {
          const { checkMidtransTransactionStatus } =
            await import('@/lib/midtrans')
          const midtransStatus =
            await checkMidtransTransactionStatus(parsedMidtransId)
          const isSettled =
            midtransStatus?.transaction_status === 'settlement' ||
            (midtransStatus?.transaction_status === 'capture' &&
              midtransStatus?.fraud_status === 'accept')

          if (isSettled) {
            const related = await prisma.order.findMany({
              where: {
                payment: { notes: { contains: parsedMidtransId } },
                status: 'PENDING_PAYMENT',
              },
              include: { payment: true },
            })
            const toUpdate = related.length > 0 ? related : [order]
            await prisma.$transaction(async (tx) => {
              for (const ord of toUpdate) {
                await tx.order.update({
                  where: { id: ord.id },
                  data: { status: 'PAID', updatedAt: new Date() },
                })
                if (ord.payment) {
                  await tx.payment.update({
                    where: { id: ord.payment.id },
                    data: {
                      status: 'VERIFIED',
                      notes: `Midtrans Core API Settlement - TxID: ${midtransStatus.transaction_id}`,
                      updatedAt: new Date(),
                    },
                  })
                }
              }
            })
            order.status = 'PAID'
            if (order.payment) {
              order.payment.status = 'VERIFIED'
            }
          }
        } catch (_) {}
      }
    }

    // No cache for order data to ensure price updates are reflected immediately
    return NextResponse.json(
      { order },
      {
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
