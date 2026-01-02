import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// GET - Get or create chat room for an order
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    // Verify the order belongs to this customer
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id,
      },
      include: {
        items: {
          select: {
            type: true,
            product: { select: { name: true } },
            rentalItem: { select: { name: true } },
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Find existing room or create one
    let room = await prisma.adminChatRoom.findFirst({
      where: {
        orderId: orderId,
        customerId: session.user.id,
      },
    })

    if (!room) {
      // Create new room
      room = await prisma.adminChatRoom.create({
        data: {
          customerId: session.user.id,
          orderId: orderId,
        },
      })
    }

    // Get messages for this room
    const messages = await prisma.adminChatMessage.findMany({
      where: { roomId: room.id },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Mark messages as read
    await prisma.adminChatMessage.updateMany({
      where: {
        roomId: room.id,
        senderId: { not: session.user.id },
        isRead: false,
      },
      data: { isRead: true },
    })

    return NextResponse.json({
      room: {
        id: room.id,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          items: order.items,
        },
      },
      messages,
    })
  } catch (error) {
    console.error('Error fetching customer chat room:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
