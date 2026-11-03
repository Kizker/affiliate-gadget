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
            returnRequests: {
              select: { id: true, status: true, type: true },
              take: 1,
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

    let resolvedOrder: any = room.order
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

    const isAfterSalesRoom = Boolean(
      resolvedOrder?.status === 'COMPLETED' ||
      resolvedOrder?.status === 'RETURNED' ||
      ((resolvedOrder as any)?.returnRequests &&
        (resolvedOrder as any).returnRequests.length > 0) ||
      room.claimedBy?.role === 'AFTER_SALES'
    )

    let resolvedClaimedBy = room.claimedBy
    if (isAfterSalesRoom && resolvedClaimedBy?.role !== 'AFTER_SALES') {
      const storeGroupAfterSales = (room.store as any)?.group?.afterSalesUser
      let targetAfterSales = storeGroupAfterSales
      if (!targetAfterSales) {
        targetAfterSales = await prisma.user.findFirst({
          where: { role: 'AFTER_SALES', isActive: true },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        })
      }
      if (targetAfterSales) {
        resolvedClaimedBy = targetAfterSales as any
        await prisma.adminChatRoom
          .update({
            where: { id: room.id },
            data: {
              claimedById: targetAfterSales.id,
              claimedAt: new Date(),
            },
          })
          .catch(() => {})
      }
    }

    const mitra = (resolvedClaimedBy as any)?.mitra
    const baseStore = room.store || resolvedOrder?.store || null
    const resolvedStore = baseStore
      ? {
          ...baseStore,
          name: isAfterSalesRoom
            ? `Layanan Purna Jual (${baseStore.name})`
            : baseStore.name,
          companyName: isAfterSalesRoom
            ? 'Admin After Sales & Garansi Terpusat'
            : baseStore.companyName,
          isAfterSales: isAfterSalesRoom,
        }
      : mitra
        ? {
            id: mitra.id,
            name: mitra.businessName,
            companyName: mitra.businessName,
            phone: mitra.phone,
            city: mitra.city,
            logo: mitra.banner || mitra.images?.[0]?.url || null,
            isActive: mitra.isActive,
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

    return NextResponse.json({
      room: {
        ...room,
        claimedBy: resolvedClaimedBy,
        claimedById: resolvedClaimedBy?.id || room.claimedById,
        store: resolvedStore,
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
