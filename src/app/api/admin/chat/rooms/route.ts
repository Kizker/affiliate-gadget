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

    // Build where clause
    // STORE_ADMIN: lihat chat direct store (storeId), chat order di toko mereka, atau chat yang di-claim
    // Admin/SuperAdmin: lihat semua room yang di-claim mereka atau unclaimed
    let whereClause: Record<string, unknown>

    if (user.role === 'STORE_ADMIN' && user.storeId) {
      whereClause = {
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
        ],
      }
    } else {
      whereClause = {
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

    // Get stats
    const totalRooms = rooms.length
    const unreadRooms = rooms.filter((r) => r._count.messages > 0).length

    return NextResponse.json({
      rooms,
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

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID required' },
        { status: 400 }
      )
    }

    // STORE_ADMIN: validasi bahwa order yang di-chat adalah milik tokonya
    if (orderId && user.role === 'STORE_ADMIN' && user.storeId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          storeId: true,
          items: { select: { product: { select: { storeId: true } } } },
        },
      })

      if (order) {
        const orderStoreId = order.storeId
        const itemStoreId = order.items.find((i) => i.product?.storeId)?.product
          ?.storeId
        const belongsToThisStore =
          orderStoreId === user.storeId || itemStoreId === user.storeId

        if (!belongsToThisStore) {
          return NextResponse.json(
            { error: 'Pesanan ini bukan milik toko Anda' },
            { status: 403 }
          )
        }
      }
    }

    // Check if room with this order already exists
    if (orderId) {
      const existingRoom = await prisma.adminChatRoom.findUnique({
        where: { orderId },
      })

      if (existingRoom) {
        return NextResponse.json({ room: existingRoom })
      }
    }

    // Check if room with this customer (without order) already exists
    const existingCustomerRoom = await prisma.adminChatRoom.findFirst({
      where: {
        customerId,
        orderId: null,
      },
    })

    if (existingCustomerRoom && !orderId) {
      return NextResponse.json({ room: existingCustomerRoom })
    }

    // Create new room
    const room = await prisma.adminChatRoom.create({
      data: {
        customerId,
        orderId: orderId || null,
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
