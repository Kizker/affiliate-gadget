import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

import { isAdminStaffRole } from '@/lib/dashboard-utils'

// GET - Get all admin chat rooms
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin or staff
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, storeId: true },
    })

    if (!user || !isAdminStaffRole(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Clean up abandoned empty rooms (older than 30 seconds and 0 messages)
    await prisma.adminChatRoom
      .deleteMany({
        where: {
          messages: { none: {} },
          createdAt: { lt: new Date(Date.now() - 30 * 1000) },
        },
      })
      .catch(() => {})

    // Build where clause
    // Only return rooms that actually have messages (non-empty rooms)
    let whereClause: Record<string, unknown>

    if (
      (user.role === 'STORE_ADMIN' || user.role === 'STORE_SALES') &&
      user.storeId
    ) {
      whereClause = {
        messages: { some: {} },
        OR: [
          // Rooms direct chat dengan toko cabang ini
          { storeId: user.storeId },
          // Rooms terkait order di toko ini
          { order: { storeId: user.storeId } },
          // Rooms terkait order dengan item produk dari toko ini
          {
            order: { items: { some: { product: { storeId: user.storeId } } } },
          },
          // Rooms tanpa order (general inquiry) yang di-claim admin ini
          { claimedById: session.user.id },
          // Rooms bantuan admin toko ini langsung ke Superadmin
          { customerId: session.user.id, storeId: null },
        ],
      }
    } else if (user.role === 'SUPER_ADMIN') {
      whereClause = {
        messages: { some: {} },
        OR: [
          // Seluruh percakapan bantuan CS platform (pelanggan & bantuan admin toko)
          { storeId: null },
          // Percakapan yang di-claim atau belum di-claim
          { claimedById: session.user.id },
          { claimedById: null },
        ],
      }
    } else {
      whereClause = {
        messages: { some: {} },
        OR: [
          { claimedById: session.user.id }, // Rooms claimed by this admin
          { claimedById: null }, // Unclaimed rooms (new customer chats)
        ],
      }
    }

    // Fetch admin chat rooms with customer info, order info, and store info
    const rooms = await prisma.adminChatRoom.findMany({
      where: whereClause,
      include: {
        store: {
          select: {
            id: true,
            name: true,
            companyName: true,
            phone: true,
            city: true,
            logo: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            phone: true,
            role: true,
            store: {
              select: {
                id: true,
                name: true,
                city: true,
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
                city: true,
                phone: true,
              },
            },
            items: {
              include: {
                product: {
                  select: { name: true, images: true },
                },
                rentalItem: {
                  select: { name: true, images: true },
                },
                service: {
                  select: { name: true },
                },
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
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            content: true,
            createdAt: true,
            senderId: true,
            messageType: true,
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

    const enrichedRooms = rooms.map((room) => {
      const isStoreHelpToSuperAdmin =
        room.customerId === session.user.id && room.storeId === null

      const isStoreAdminUser =
        room.customer.role === 'STORE_ADMIN' ||
        room.customer.role === 'STORE_SALES'

      return {
        ...room,
        isStoreHelpToSuperAdmin,
        isStoreAdminUser,
      }
    })

    // Get stats
    const totalRooms = enrichedRooms.length
    const unreadRooms = enrichedRooms.filter(
      (r) => r._count.messages > 0
    ).length

    return NextResponse.json({
      rooms: enrichedRooms,
      stats: { totalRooms, unreadRooms },
    })
  } catch (error) {
    console.error('Error fetching admin chat rooms:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new admin chat room
export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin or staff
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, storeId: true },
    })

    if (!user || !isAdminStaffRole(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { customerId, orderId } = await request.json()

    let effectiveCustomerId = customerId
    let orderStoreId: string | null = null

    if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          userId: true,
          storeId: true,
          items: { select: { product: { select: { storeId: true } } } },
        },
      })

      if (order) {
        if (!effectiveCustomerId) {
          effectiveCustomerId = order.userId
        }
        orderStoreId =
          order.storeId ||
          order.items.find((i) => i.product?.storeId)?.product?.storeId ||
          null

        // STORE_ADMIN: validasi bahwa order yang di-chat adalah milik tokonya
        if (user.role === 'STORE_ADMIN' && user.storeId) {
          const belongsToThisStore =
            order.storeId === user.storeId ||
            order.items.some((i) => i.product?.storeId === user.storeId)

          if (!belongsToThisStore) {
            return NextResponse.json(
              { error: 'Pesanan ini bukan milik toko Anda' },
              { status: 403 }
            )
          }
        }
      }
    }

    if (!effectiveCustomerId) {
      return NextResponse.json(
        { error: 'Customer ID required' },
        { status: 400 }
      )
    }

    const targetStoreId = user.storeId || orderStoreId || null

    // 1. Check if a room already exists for this customer + store (Unified Room)
    let existingRoom = await prisma.adminChatRoom.findFirst({
      where: {
        customerId: effectiveCustomerId,
        ...(targetStoreId ? { storeId: targetStoreId } : {}),
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            items: {
              include: {
                product: {
                  select: { name: true, images: true },
                },
              },
            },
          },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    })

    if (existingRoom) {
      // If customer asks about another order from the same store, update orderId to the latest order context
      const updates: any = {}
      if (orderId && existingRoom.orderId !== orderId) {
        updates.orderId = orderId
      }
      if (targetStoreId && !existingRoom.storeId) {
        updates.storeId = targetStoreId
      }
      if (!existingRoom.claimedById) {
        updates.claimedById = session.user.id
        updates.claimedAt = new Date()
      }

      if (Object.keys(updates).length > 0) {
        existingRoom = await prisma.adminChatRoom.update({
          where: { id: existingRoom.id },
          data: updates,
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            order: {
              select: {
                id: true,
                orderNumber: true,
                status: true,
                total: true,
                items: {
                  include: {
                    product: {
                      select: { name: true, images: true },
                    },
                  },
                },
              },
            },
          },
        })
      }

      return NextResponse.json({ room: existingRoom })
    }

    // 2. No room exists between this customer and store -> create 1 new room
    const room = await prisma.adminChatRoom.create({
      data: {
        customerId: effectiveCustomerId,
        storeId: targetStoreId,
        orderId: orderId || null,
        claimedById: session.user.id,
        claimedAt: new Date(),
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            items: {
              include: {
                product: {
                  select: { name: true, images: true },
                },
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ room }, { status: 201 })
  } catch (error) {
    console.error('Error creating admin chat room:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
