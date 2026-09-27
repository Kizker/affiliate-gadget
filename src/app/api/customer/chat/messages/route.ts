import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// GET - Get messages in a room for customer
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const roomId = searchParams.get('roomId')

    if (!roomId) {
      return NextResponse.json({ error: 'Room ID required' }, { status: 400 })
    }

    // Verify room belongs to this customer
    const room = await prisma.adminChatRoom.findFirst({
      where: {
        id: roomId,
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
          },
        },
      },
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Get messages
    const messages = await prisma.adminChatMessage.findMany({
      where: { roomId: room.id },
      select: {
        id: true,
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
      orderBy: { createdAt: 'asc' },
    })

    // Mark unread messages as read
    await prisma.adminChatMessage.updateMany({
      where: {
        roomId: room.id,
        senderId: { not: session.user.id },
        isRead: false,
      },
      data: { isRead: true },
    })

    let resolvedOrder = room.order
    if (!resolvedOrder) {
      const orderRefMsg = messages.find(
        (m) =>
          m.messageType === 'order_reference' ||
          m.messageType === 'order' ||
          m.content.includes('"type":"order_reference"')
      )
      if (orderRefMsg) {
        try {
          const parsed = JSON.parse(orderRefMsg.content)
          if (parsed.orderId || parsed.orderNumber) {
            resolvedOrder = await prisma.order.findFirst({
              where: {
                OR: [
                  ...(parsed.orderId ? [{ id: parsed.orderId }] : []),
                  ...(parsed.orderNumber
                    ? [{ orderNumber: parsed.orderNumber }]
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
            })

            if (resolvedOrder && !room.orderId) {
              const existingClaim = await prisma.adminChatRoom.findFirst({
                where: { orderId: resolvedOrder.id },
              })
              if (!existingClaim) {
                await prisma.adminChatRoom
                  .update({
                    where: { id: room.id },
                    data: { orderId: resolvedOrder.id },
                  })
                  .catch(() => {})
              }
            }
          }
        } catch {}
      }
    }

    return NextResponse.json({
      room: {
        ...room,
        order: resolvedOrder,
        hasOrder: !!resolvedOrder,
      },
      messages,
    })
  } catch (error) {
    console.error('Error fetching customer chat messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
