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
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const before = searchParams.get('before') // cursor for pagination

    // Verify user has access to this room
    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            createdAt: true,
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
      },
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Check if user is technician
    const technician = await prisma.technician.findUnique({
      where: { userId: session.user.id },
    })

    const isTechnician = technician?.id === room.technicianId
    const isCustomer = session.user.id === room.customerId

    if (!isTechnician && !isCustomer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get messages
    const messages = await prisma.chatMessage.findMany({
      where: {
        roomId,
        ...(before && {
          createdAt: { lt: new Date(before) },
        }),
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        senderId: true,
        isRead: true,
        mediaUrl: true,
        mediaType: true,
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // Mark unread messages from other party as read
    await prisma.chatMessage.updateMany({
      where: {
        roomId,
        senderId: { not: session.user.id },
        isRead: false,
      },
      data: { isRead: true },
    })

    return NextResponse.json({
      messages: messages.reverse(),
      order: room.order || null,
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
    const { content, mediaUrl, mediaType, mediaSize, mediaName } =
      await request.json()

    // Validate: must have either content or media
    if ((!content || content.trim() === '') && !mediaUrl) {
      return NextResponse.json(
        { error: 'Message content or media required' },
        { status: 400 }
      )
    }

    // Validate media size if provided
    if (mediaSize) {
      const MAX_SIZE = 60 * 1024 * 1024 // 60MB max
      if (mediaSize > MAX_SIZE) {
        return NextResponse.json(
          { error: 'Ukuran file terlalu besar. Maksimal 60MB' },
          { status: 400 }
        )
      }
    }

    // Verify user has access to this room
    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Check if user is technician
    const technician = await prisma.technician.findUnique({
      where: { userId: session.user.id },
    })

    const isTechnician = technician?.id === room.technicianId
    const isCustomer = session.user.id === room.customerId

    if (!isTechnician && !isCustomer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Create message and update room lastMessageAt
    const [message] = await prisma.$transaction([
      prisma.chatMessage.create({
        data: {
          roomId,
          senderId: session.user.id,
          content: content?.trim() || '',
          mediaUrl: mediaUrl || null,
          mediaType: mediaType || null,
          mediaSize: mediaSize || null,
          mediaName: mediaName || null,
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          senderId: true,
          isRead: true,
          sender: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      }),
      prisma.chatRoom.update({
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
    await prisma.chatMessage.updateMany({
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
