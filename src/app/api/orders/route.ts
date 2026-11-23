import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import { batchCancelExpiredOrders } from '@/lib/order-expiration'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Auto-cancel any overdue (>24h) pending orders before querying
    await batchCancelExpiredOrders().catch((err) => {
      console.error('[Orders API] Error running batchCancelExpiredOrders:', err)
    })

    // Rekonsiliasi otomatis live status Midtrans untuk pesanan pending pengguna ini
    try {
      const pendingOrdersWithPayment = await prisma.order.findMany({
        where: {
          userId: session.user.id,
          status: 'PENDING_PAYMENT',
          payment: { isNot: null },
        },
        include: { payment: true },
        take: 10,
      })

      if (pendingOrdersWithPayment.length > 0) {
        const { checkMidtransTransactionStatus } =
          await import('@/lib/midtrans')
        for (const ord of pendingOrdersWithPayment) {
          const parsedId = ord.payment?.notes?.match(
            /"midtransOrderId"\s*:\s*"([^"]+)"/
          )?.[1]
          if (parsedId) {
            try {
              const tx = await checkMidtransTransactionStatus(parsedId)
              const isPaid =
                tx?.transaction_status === 'settlement' ||
                (tx?.transaction_status === 'capture' &&
                  tx?.fraud_status === 'accept')
              if (isPaid) {
                const siblings = await prisma.order.findMany({
                  where: {
                    payment: { notes: { contains: parsedId } },
                    status: 'PENDING_PAYMENT',
                  },
                  include: { payment: true },
                })
                const listToUpdate = siblings.length > 0 ? siblings : [ord]
                await prisma.$transaction(async (dbTx) => {
                  for (const s of listToUpdate) {
                    await dbTx.order.update({
                      where: { id: s.id },
                      data: { status: 'PAID', updatedAt: new Date() },
                    })
                    if (s.payment) {
                      await dbTx.payment.update({
                        where: { id: s.payment.id },
                        data: {
                          status: 'VERIFIED',
                          notes: `Midtrans Settlement - TxID: ${tx.transaction_id}`,
                          updatedAt: new Date(),
                        },
                      })
                    }
                  }
                })
              }
            } catch (_) {}
          }
        }
      }
    } catch (_) {}

    // Get all orders for this user with reviews included (fixes N+1 problem)
    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      include: {
        items: {
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            type: true,
            notes: true,
            service: {
              select: {
                name: true,
                category: true,
              },
            },
            product: {
              select: {
                name: true,
                images: true,
              },
            },
            rentalItem: {
              select: {
                name: true,
                images: true,
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
                image: true,
              },
            },
          },
        },
        // Include reviews directly - fixes N+1 query problem
        reviews: {
          where: {
            type: 'TECHNICIAN',
          },
          take: 1,
          select: {
            id: true,
            rating: true,
            comment: true,
          },
        },
        // Include complaints with details for customer view
        complaints: {
          select: {
            id: true,
            status: true,
            subject: true,
            description: true,
            images: true,
            resolution: true,
            rejectionNote: true,
            createdAt: true,
            resolvedAt: true,
            assignedTo: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
        returnRequests: {
          select: {
            id: true,
            status: true,
            type: true,
            reason: true,
          },
        },
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    })

    // Cache for 15 seconds - order list can change frequently but benefit from short cache
    return NextResponse.json(
      { orders },
      {
        headers: {
          'Cache-Control': 'private, max-age=15, stale-while-revalidate=30',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
