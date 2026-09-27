import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// POST - Send message to admin chat
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { roomId, content, messageType = 'text', mediaUrl } = body

    if (!roomId || (!content?.trim() && !mediaUrl)) {
      return NextResponse.json(
        { error: 'Room ID and content/media required' },
        { status: 400 }
      )
    }

    // Verify room belongs to this customer
    const room = await prisma.adminChatRoom.findFirst({
      where: {
        id: roomId,
        customerId: session.user.id,
      },
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Create message
    const message = await prisma.adminChatMessage.create({
      data: {
        roomId: room.id,
        senderId: session.user.id,
        content: content?.trim() || '',
        messageType,
        mediaUrl: mediaUrl || null,
      },
      select: {
        id: true,
        content: true,
        messageType: true,
        mediaUrl: true,
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
    })

    // Update room's lastMessageAt and optionally orderId if order_reference sent
    let orderIdToLink: string | null = null
    if (messageType === 'order_reference' && !room.orderId) {
      try {
        const parsed = JSON.parse(content?.trim() || '{}')
        if (parsed.orderId) {
          const existingClaim = await prisma.adminChatRoom.findFirst({
            where: { orderId: parsed.orderId },
          })
          if (!existingClaim) {
            orderIdToLink = parsed.orderId
          }
        }
      } catch {}
    }

    await prisma.adminChatRoom.update({
      where: { id: room.id },
      data: {
        lastMessageAt: new Date(),
        ...(orderIdToLink ? { orderId: orderIdToLink } : {}),
      },
    })

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Error sending customer message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
