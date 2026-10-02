import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import { isAdminStaffRole } from '@/lib/dashboard-utils'
import { getStoreWithdrawals } from '@/lib/store-withdrawal-store'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id || !isAdminStaffRole(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, storeId: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isStoreAdmin = user.role === 'STORE_ADMIN'
    const storeId = isStoreAdmin ? user.storeId : undefined

    // Run all count queries concurrently for maximum performance
    const [
      ordersNeedProcessing,
      ordersPendingPayment,
      unreadChat,
      complaints,
      returns,
      ads,
      liveStreams,
      pendingMitras,
    ] = await Promise.all([
      // 1. Orders needing processing (status: PAID)
      prisma.order.count({
        where: {
          ...(storeId
            ? {
                OR: [
                  { storeId },
                  { items: { some: { product: { storeId } } } },
                ],
              }
            : {}),
          status: 'PAID',
        },
      }),

      // 2. Orders awaiting payment (status: PENDING_PAYMENT)
      prisma.order.count({
        where: {
          ...(storeId
            ? {
                OR: [
                  { storeId },
                  { items: { some: { product: { storeId } } } },
                ],
              }
            : {}),
          status: 'PENDING_PAYMENT',
        },
      }),

      // 3. Unread chat messages from customers
      prisma.adminChatMessage.count({
        where: {
          isRead: false,
          senderId: { not: user.id },
          ...(storeId
            ? {
                room: {
                  OR: [
                    { storeId },
                    { order: { storeId } },
                    { claimedById: user.id },
                  ],
                },
              }
            : {}),
        },
      }),

      // 4. Active warranty claims / complaints
      prisma.complaint.count({
        where: {
          status: { in: ['OPEN', 'IN_PROGRESS'] },
          ...(storeId ? { order: { storeId } } : {}),
        },
      }),

      // 5. Pending return / refund requests
      prisma.returnRequest.count({
        where: {
          status: { in: ['PENDING', 'IN_REVIEW'] },
          ...(storeId
            ? {
                OR: [{ storeId }, { order: { storeId } }],
              }
            : {}),
        },
      }),

      // 6. Pending internal ads
      prisma.internalAd.count({
        where: {
          status: 'PENDING',
          ...(storeId ? { storeId } : {}),
        },
      }),

      // 7. Active live streams
      prisma.liveStream.count({
        where: {
          status: 'LIVE',
          ...(storeId ? { storeId } : {}),
        },
      }),

      // 8. Pending partner/store registrations (Superadmin only)
      !isStoreAdmin
        ? prisma.user.count({
            where: { role: 'MITRA', mitraStatus: 'PENDING' },
          })
        : Promise.resolve(0),
    ])

    // 9. Finance / Pending withdrawals from store-withdrawals store
    const allWithdrawals = await getStoreWithdrawals(storeId || undefined)
    const pendingFinance = allWithdrawals.filter(
      (w) => w.status === 'PENDING'
    ).length

    // Actionable orders count: prioritize paid orders (perlu diproses) + pending payment
    const totalOrdersActionable = ordersNeedProcessing + ordersPendingPayment

    const counts = {
      orders: totalOrdersActionable,
      ordersNeedProcessing,
      ordersPendingPayment,
      chat: unreadChat,
      finance: pendingFinance,
      complaints,
      returns,
      ads,
      live: liveStreams,
      mitras: pendingMitras,
      total:
        totalOrdersActionable +
        unreadChat +
        pendingFinance +
        complaints +
        returns +
        ads +
        liveStreams +
        pendingMitras,
    }

    return NextResponse.json({
      success: true,
      counts,
    })
  } catch (error) {
    console.error('[Admin Nav Notifications API] Error fetching counts:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch notification counts',
        counts: {
          orders: 0,
          ordersNeedProcessing: 0,
          ordersPendingPayment: 0,
          chat: 0,
          finance: 0,
          complaints: 0,
          returns: 0,
          ads: 0,
          live: 0,
          mitras: 0,
          total: 0,
        },
      },
      { status: 500 }
    )
  }
}
