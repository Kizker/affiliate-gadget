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

    // Get all admin chat rooms for this customer
    const rooms = await prisma.adminChatRoom.findMany({
      where: {
        customerId: session.user.id,
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

    const enrichedRooms = rooms.map((room) => {
      const resolvedOrder = room.order || orderLookupMap[room.id] || null
      const totalUnreadCount = unreadMap.get(room.id) || 0
      const hasOrder = !!resolvedOrder

      const mitra = (room.claimedBy as any)?.mitra
      const resolvedStore =
        room.store ||
        (mitra
          ? {
              id: mitra.id,
              name: mitra.businessName,
              companyName: mitra.businessName,
              phone: mitra.phone,
              city: mitra.city,
              logo: mitra.banner || mitra.images?.[0]?.url || null,
              isActive: mitra.isActive,
            }
          : null)

      return {
        ...room,
        store: resolvedStore,
        order: resolvedOrder,
        hasOrder,
        totalUnread: totalUnreadCount,
      }
    })

    return NextResponse.json({ rooms: enrichedRooms })
  } catch (error) {
    console.error('Error fetching customer admin chat rooms:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
