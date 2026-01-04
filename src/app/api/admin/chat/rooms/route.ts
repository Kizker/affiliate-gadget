import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// GET - Get all admin chat rooms
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Build where clause - show rooms claimed by this admin OR unclaimed rooms
    const whereClause = {
      OR: [
        { claimedById: session.user.id }, // Rooms claimed by this admin
        { claimedById: null }, // Unclaimed rooms (new customer chats)
      ],
    }

    // Fetch admin chat rooms with customer info and order info
    const rooms = await prisma.adminChatRoom.findMany({
      where: whereClause,
      include: {
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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { customerId, orderId } = await request.json()

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID required' },
        { status: 400 }
      )
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
