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

      // Create order reference message as first message
      try {
        await prisma.adminChatMessage.create({
          data: {
            roomId: room.id,
            senderId: session.user.id,
            content: JSON.stringify({
              type: 'order_reference',
              orderId: order.id,
              orderNumber: order.orderNumber,
              status: order.status,
              total: order.total,
              createdAt: order.createdAt.toISOString(),
              items: order.items.map((item) => ({
                type: item.type,
                product: item.product,
                rentalItem: item.rentalItem,
              })),
            }),
            messageType: 'order_reference',
          },
        })
        // Order reference message created successfully
      } catch (error) {
        console.error('Error creating order reference message:', error)
        // Don't fail room creation if order message fails
      }
    }

    // Get messages for this room
    const messages = await prisma.adminChatMessage.findMany({
      where: { roomId: room.id },
      select: {
        id: true,
        content: true,
        messageType: true,
        mediaUrl: true,
        mediaType: true,
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
          total: order.total,
          createdAt: order.createdAt,
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
