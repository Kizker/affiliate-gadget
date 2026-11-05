import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// GET - Get all admin and store chat rooms for current customer
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Non-blocking cleanup of abandoned empty rooms in background
    prisma.adminChatRoom
      .deleteMany({
        where: {
          messages: { none: {} },
          createdAt: { lt: new Date(Date.now() - 30 * 1000) },
        },
      })
      .catch(() => {})

    // Get all admin chat rooms for this customer that have messages
    const rooms = await prisma.adminChatRoom.findMany({
      where: {
        customerId: session.user.id,
        messages: { some: {} },
      },
      include: {
        claimedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            mitra: {
              select: {
                id: true,
                businessName: true,
                banner: true,
                city: true,
                phone: true,
                isActive: true,
                images: {
                  where: { isBanner: true },
                  take: 1,
                  select: { url: true },
                },
              },
            },
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            companyName: true,
            phone: true,
            city: true,
            logo: true,
            isActive: true,
            group: {
              select: {
                afterSalesUser: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    role: true,
                  },
                },
              },
            },
            schedules: {
              select: {
                day: true,
                openTime: true,
                closeTime: true,
                isClosed: true,
              },
            },
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            createdAt: true,
            store: {
              select: {
                id: true,
                name: true,
                companyName: true,
                phone: true,
                city: true,
                logo: true,
                isActive: true,
                schedules: {
                  select: {
                    day: true,
                    openTime: true,
                    closeTime: true,
                    isClosed: true,
                  },
                },
              },
            },
            claimedBy: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            technician: {
              select: {
                id: true,
                isAvailable: true,
                user: {
                  select: {
                    name: true,
                    image: true,
                  },
                },
              },
            },
            returnRequests: {
              select: { id: true, status: true, type: true },
              take: 1,
            },
            items: {
              select: {
                type: true,
                quantity: true,
                product: { select: { name: true } },
                service: { select: { name: true } },
                rentalItem: { select: { name: true } },
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            senderId: true,
            content: true,
            messageType: true,
            mediaUrl: true,
            mediaType: true,
            isRead: true,
            createdAt: true,
            sender: {
              select: {
                id: true,
                name: true,
                image: true,
                role: true,
              },
            },
          },
        },
        _count: {
          select: {
            messages: {
              where: {
                isRead: false,
                senderId: { not: session.user.id },
              },
            },
          },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    })

    const roomIds = rooms.map((r) => r.id)

    // Lookup orders for rooms that don't have direct order relation
    const roomsNeedingOrder = rooms.filter((r) => !r.order)
    const orderLookupMap: Record<string, any> = {}

    if (roomsNeedingOrder.length > 0) {
      const orderMsgs = await prisma.adminChatMessage.findMany({
        where: {
          roomId: { in: roomsNeedingOrder.map((r) => r.id) },
          OR: [
            { messageType: 'order_reference' },
            { messageType: 'order' },
            { content: { contains: '"type":"order_reference"' } },
            { content: { contains: '"orderNumber"' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
      })

      const orderIdsToFetch = new Set<string>()
      const orderNumbersToFetch = new Set<string>()
      const roomToOrderKey: Record<
        string,
        { orderId?: string; orderNumber?: string }
      > = {}

      for (const msg of orderMsgs) {
        if (!roomToOrderKey[msg.roomId]) {
          try {
            const parsed = JSON.parse(msg.content)
            if (parsed.orderId) {
              orderIdsToFetch.add(parsed.orderId)
              roomToOrderKey[msg.roomId] = { orderId: parsed.orderId }
            } else if (parsed.orderNumber) {
              orderNumbersToFetch.add(parsed.orderNumber)
              roomToOrderKey[msg.roomId] = { orderNumber: parsed.orderNumber }
            }
          } catch {}
        }
      }

      if (orderIdsToFetch.size > 0 || orderNumbersToFetch.size > 0) {
        const foundOrders = await prisma.order.findMany({
          where: {
            OR: [
              ...(orderIdsToFetch.size > 0
                ? [{ id: { in: Array.from(orderIdsToFetch) } }]
                : []),
              ...(orderNumbersToFetch.size > 0
                ? [{ orderNumber: { in: Array.from(orderNumbersToFetch) } }]
                : []),
            ],
          },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            createdAt: true,
            store: {
              select: {
                id: true,
                name: true,
                companyName: true,
                phone: true,
                city: true,
                logo: true,
                isActive: true,
                schedules: {
                  select: {
                    day: true,
                    openTime: true,
                    closeTime: true,
                    isClosed: true,
                  },
                },
              },
            },
            returnRequests: {
              select: { id: true, status: true, type: true },
              take: 1,
            },
            items: {
              select: {
                type: true,
                quantity: true,
                product: { select: { name: true } },
                service: { select: { name: true } },
                rentalItem: { select: { name: true } },
              },
            },
          },
        })

        for (const [roomId, keys] of Object.entries(roomToOrderKey)) {
          const match = foundOrders.find(
            (o) => o.id === keys.orderId || o.orderNumber === keys.orderNumber
          )
          if (match) {
            orderLookupMap[roomId] = match

            // Optional DB synchronization: link orderId if room.orderId is null and not claimed
            const targetRoom = rooms.find((r) => r.id === roomId)
            if (targetRoom && !targetRoom.orderId) {
              prisma.adminChatRoom
                .update({
                  where: { id: roomId },
                  data: { orderId: match.id },
                })
                .catch(() => {})
            }
          }
        }
      }
    }

    // Get unread message count per room (all unread in room)
    const unreadStats = await prisma.adminChatMessage.groupBy({
      by: ['roomId'],
      where: {
        roomId: { in: roomIds },
        isRead: false,
      },
      _count: {
        id: true,
      },
    })
    const unreadMap = new Map(unreadStats.map((s) => [s.roomId, s._count.id]))

    const defaultAfterSalesUser = await prisma.user.findFirst({
      where: { role: 'AFTER_SALES', isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
    })

    const enrichedRooms = rooms.map((room) => {
      const resolvedOrder = room.order || orderLookupMap[room.id] || null
      const totalUnreadCount = unreadMap.get(room.id) || 0
      const hasOrder = !!resolvedOrder

      const isAfterSalesRoom = Boolean(
        resolvedOrder?.status === 'COMPLETED' ||
        resolvedOrder?.status === 'RETURNED' ||
        (resolvedOrder?.returnRequests &&
          resolvedOrder.returnRequests.length > 0) ||
        room.claimedBy?.role === 'AFTER_SALES'
      )

      const storeGroupAfterSales = (room.store as any)?.group?.afterSalesUser
      let resolvedClaimedBy = room.claimedBy
      if (isAfterSalesRoom && resolvedClaimedBy?.role !== 'AFTER_SALES') {
        const targetAfterSales = storeGroupAfterSales || defaultAfterSalesUser
        if (targetAfterSales) {
          resolvedClaimedBy = targetAfterSales as any
        }
      }

      const isMitraChat =
        (resolvedClaimedBy as any)?.role === 'MITRA' ||
        Boolean((resolvedClaimedBy as any)?.mitra)
      const mitra = (resolvedClaimedBy as any)?.mitra
      const baseStore = room.store || resolvedOrder?.store || null

      const resolvedStore = isAfterSalesRoom
        ? {
            id: (resolvedClaimedBy as any)?.id || 'aftersales-group',
            name: baseStore
              ? `Layanan Purna Jual (${baseStore.name})`
              : 'Layanan Purna Jual Resmi',
            companyName: 'Admin After Sales & Garansi Terpusat',
            phone: '0812-3456-7890',
            city: 'Pusat Garansi',
            logo: (resolvedClaimedBy as any)?.image || null,
            isAfterSales: true,
          }
        : baseStore
          ? {
              ...baseStore,
              name: baseStore.name,
              companyName: baseStore.companyName,
              isAfterSales: false,
            }
          : isMitraChat
            ? {
                id: mitra?.id || (resolvedClaimedBy as any)?.id || 'mitra',
                name:
                  mitra?.businessName ||
                  (resolvedClaimedBy as any)?.name ||
                  'Mitra Servis',
                companyName:
                  mitra?.businessName || 'Mitra Servis Resmi Platform',
                phone: mitra?.phone || '0812-3456-7890',
                city: mitra?.city || 'Workshop',
                logo:
                  mitra?.banner ||
                  mitra?.images?.[0]?.url ||
                  (resolvedClaimedBy as any)?.image ||
                  null,
                isActive: true,
                isMitra: true,
              }
            : {
                id: 'superadmin',
                name: 'Customer Service (Superadmin)',
                companyName: 'Pusat Bantuan CS Platform',
                phone: '0812-3456-7890',
                city: 'Kantor Pusat',
                logo: null,
                isActive: true,
                isCs: true,
              }

      return {
        ...room,
        claimedBy: resolvedClaimedBy,
        claimedById: resolvedClaimedBy?.id || room.claimedById,
        store: resolvedStore,
        order: resolvedOrder,
        hasOrder,
        totalUnread: totalUnreadCount,
      }
    })

    // Deduplikasi defensif:
    // 1. After Sales: 1 Pelanggan + 1 After Sales Grup Cabang = 1 Room
    // 2. Mitra: 1 Pelanggan + 1 Mitra Servis = 1 Room
    // 3. Toko: 1 Pelanggan + 1 Toko = 1 Room
    // 4. CS: 1 Pelanggan + CS = 1 Room
    const seenStoreKeys = new Set<string>()
    const deduplicatedRooms: typeof enrichedRooms = []

    for (const room of enrichedRooms) {
      const isAfterSales = (room.store as any)?.isAfterSales
      const isMitra =
        (room.store as any)?.isMitra ||
        (room.claimedBy as any)?.role === 'MITRA'
      const key = isAfterSales
        ? `${room.customerId}_aftersales_${room.claimedById || 'group'}`
        : isMitra
          ? `${room.customerId}_mitra_${room.claimedById || room.store?.id}`
          : `${room.customerId}_${room.storeId || room.store?.id || 'cs'}`

      if (!seenStoreKeys.has(key)) {
        seenStoreKeys.add(key)
        deduplicatedRooms.push(room)
      }
    }

    return NextResponse.json({ rooms: deduplicatedRooms })
  } catch (error) {
    console.error('Error fetching customer admin chat rooms:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
