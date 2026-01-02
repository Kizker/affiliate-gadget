import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// GET - Get messages in a room
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roomId } = await params

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const before = searchParams.get('before')

    // Check room exists
    const room = await prisma.adminChatRoom.findUnique({
      where: { id: roomId },
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
                  select: { id: true, name: true, images: true, price: true },
                },
                rentalItem: {
                  select: {
                    id: true,
                    name: true,
                    images: true,
                    pricePerDay: true,
                  },
                },
                service: {
                  select: { id: true, name: true, price: true },
                },
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
      where: {
        roomId,
        ...(before && {
          createdAt: { lt: new Date(before) },
        }),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({
      room,
      messages: messages.reverse(),
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Send message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roomId } = await params

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { content, messageType, attachmentId, mediaUrl, mediaType } =
      await request.json()

    // Validate: must have content or attachment
    if ((!content || content.trim() === '') && !attachmentId && !mediaUrl) {
      return NextResponse.json(
        { error: 'Message content, attachment, or media required' },
        { status: 400 }
      )
    }

    // Check room exists
    const room = await prisma.adminChatRoom.findUnique({
      where: { id: roomId },
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Check if room is claimed by current admin
    if (!room.claimedById) {
      return NextResponse.json(
        { error: 'Room must be claimed before sending messages' },
        { status: 403 }
      )
    }

    if (room.claimedById !== session.user.id) {
      return NextResponse.json(
        { error: 'You are not the owner of this chat room' },
        { status: 403 }
      )
    }

    // Create message and update room lastMessageAt
    const [message] = await prisma.$transaction([
      prisma.adminChatMessage.create({
        data: {
          roomId,
          senderId: session.user.id,
          content: content?.trim() || '',
          messageType: messageType || 'text',
          attachmentId: attachmentId || null,
          mediaUrl: mediaUrl || null,
          mediaType: mediaType || null,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              image: true,
              role: true,
            },
          },
        },
      }),
      prisma.adminChatRoom.update({
        where: { id: roomId },
        data: { lastMessageAt: new Date() },
      }),
    ])

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Mark messages as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roomId } = await params

    // Mark all unread messages in this room (not sent by current user) as read
    await prisma.adminChatMessage.updateMany({
      where: {
        roomId,
        senderId: { not: session.user.id },
        isRead: false,
      },
      data: { isRead: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking messages as read:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
