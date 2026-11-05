import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: NO_CACHE_HEADERS }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'AFTER_SALES' && user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403, headers: NO_CACHE_HEADERS }
      )
    }

    // Find the group managed by this user
    let group = await prisma.storeGroup.findFirst({
      where: { afterSalesUserId: session.user.id },
      include: {
        stores: {
          select: {
            id: true,
            name: true,
            city: true,
            slug: true,
          },
        },
      },
    })

    // Fallback if not specifically assigned: load default group
    if (!group) {
      group = await prisma.storeGroup.findFirst({
        include: {
          stores: {
            select: {
              id: true,
              name: true,
              city: true,
              slug: true,
            },
          },
        },
      })
    }

    const storeIds = group?.stores.map((s) => s.id) || []

    // Fetch active completed order chat rooms
    const chatRoomsWhere: any = {
      messages: { some: {} },
      order: {
        status: 'COMPLETED',
      },
    }

    if (storeIds.length > 0) {
      chatRoomsWhere.order.OR = [
        { storeId: { in: storeIds } },
        { items: { some: { product: { storeId: { in: storeIds } } } } },
      ]
    }

    const chatRooms = await prisma.adminChatRoom.findMany({
      where: chatRoomsWhere,
      include: {
        customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            store: { select: { id: true, name: true, city: true } },
            items: {
              select: {
                product: { select: { name: true } },
              },
              take: 1,
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: 'desc' },
      take: 10,
    })

    // Fetch returns for these stores
    const returnWhere: any = {}
    if (storeIds.length > 0) {
      returnWhere.OR = [
        { storeId: { in: storeIds } },
        { order: { storeId: { in: storeIds } } },
      ]
    }

    const returnRequests = await prisma.returnRequest.findMany({
      where: returnWhere,
      include: {
        order: {
          select: {
            orderNumber: true,
            store: { select: { name: true, city: true } },
          },
        },
        user: {
          select: { name: true, email: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    const pendingReturnsCount = await prisma.returnRequest.count({
      where: {
        status: { in: ['PENDING', 'IN_REVIEW'] },
        ...returnWhere,
      },
    })

    const approvedReturnsCount = await prisma.returnRequest.count({
      where: {
        status: { in: ['APPROVED', 'COMPLETED'] },
        ...returnWhere,
      },
    })

    return NextResponse.json(
      {
        success: true,
        group: group
          ? {
              id: group.id,
              name: group.name,
              description: group.description,
              stores: group.stores,
            }
          : null,
        stats: {
          activeChats: chatRooms.length,
          pendingReturns: pendingReturnsCount,
          approvedReturns: approvedReturnsCount,
          totalStoresInGroup: storeIds.length,
        },
        recentChats: chatRooms.map((r) => {
          const rawMsg = r.messages[0]?.content || ''
          const productName = r.order?.items?.[0]?.product?.name || null

          let preview = rawMsg
          const trimmed = rawMsg.trim()
          if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            try {
              const data = JSON.parse(trimmed)
              if (data.type === 'order_reference' || data.orderNumber) {
                preview = `📋 Rincian Pesanan: ${productName || data.productName || '#' + (data.orderNumber || r.order?.orderNumber)}`
              } else if (
                data.type === 'product_reference' ||
                data.productName ||
                data.name
              ) {
                preview = `📦 Produk: ${data.productName || data.name}`
              } else if (
                data.type === 'return_reference' ||
                data.returnReason
              ) {
                preview = `🔄 Pengajuan Retur: ${data.reasonLabel || data.returnReason || 'Komplain Unit'}`
              }
            } catch {}
          }

          return {
            id: r.id,
            orderId: r.orderId,
            orderNumber: r.order?.orderNumber || '-',
            productName,
            storeName: r.order?.store?.name || 'Affiliate Gadget',
            customerName: r.customer?.name || r.customer?.email || 'Pelanggan',
            lastMessage: preview || 'Mengirim media/foto',
            lastMessageAt: r.lastMessageAt,
          }
        }),
        recentReturns: returnRequests,
      },
      { headers: NO_CACHE_HEADERS }
    )
  } catch (error: any) {
    console.error('Error fetching after sales dashboard data:', error)
    return NextResponse.json(
      {
        error: error?.message || 'Gagal memuat data after sales',
        details: String(error),
      },
      { status: 500, headers: NO_CACHE_HEADERS }
    )
  }
}
