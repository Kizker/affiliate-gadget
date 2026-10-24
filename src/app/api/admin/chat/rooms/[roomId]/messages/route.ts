import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

import { isAdminStaffRole } from '@/lib/dashboard-utils'

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

    // Check if user is admin or staff
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, storeId: true },
    })

    if (!user || !isAdminStaffRole(user.role)) {
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

    if (user.role === 'STORE_ADMIN' || user.role === 'STORE_SALES') {
      let userStoreId = user.storeId
      if (!userStoreId) {
        const s = await prisma.store.findFirst({
          where: { email: session.user.email || undefined },
          select: { id: true },
        })
        userStoreId = s?.id || null
      }
      const isStoreRoom =
        (userStoreId && room.storeId === userStoreId) ||
        (userStoreId && (room as any).order?.storeId === userStoreId) ||
        (userStoreId &&
          (room as any).order?.items?.some(
            (i: any) => i.product?.storeId === userStoreId
          )) ||
        room.customerId === session.user.id
      if (!isStoreRoom) {
        return NextResponse.json(
          { error: 'Akses percakapan toko lain ditolak' },
          { status: 403 }
        )
      }
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

    // Mark unread messages from customer as read
    await prisma.adminChatMessage.updateMany({
      where: {
        roomId,
        senderId: { not: session.user.id },
        isRead: false,
      },
      data: { isRead: true },
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

    // Check if user is admin or staff
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, storeId: true },
    })

    if (!user || !isAdminStaffRole(user.role)) {
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

    let userStoreId = user.storeId
    if (user.role === 'STORE_ADMIN' || user.role === 'STORE_SALES') {
      if (!userStoreId) {
        const s = await prisma.store.findFirst({
          where: { email: session.user.email || undefined },
          select: { id: true },
        })
        userStoreId = s?.id || null
      }
      const isStoreRoom =
        (userStoreId && room.storeId === userStoreId) ||
        room.customerId === session.user.id
      if (!isStoreRoom) {
        return NextResponse.json(
          { error: 'Akses percakapan toko lain ditolak' },
          { status: 403 }
        )
      }
    }

    // Auto-claim room if not claimed yet
    const isRoomCustomer = room.customerId === session.user.id
    const isSuperAdmin = user.role === 'SUPER_ADMIN'

    if (!room.claimedById) {
      // Hanya auto-claim jika pengirim BUKAN pemohon/customer (misal Superadmin/staff yang membalas)
      if (!isRoomCustomer) {
        await prisma.adminChatRoom.update({
          where: { id: roomId },
          data: {
            claimedById: session.user.id,
            claimedAt: new Date(),
            ...(userStoreId && !room.storeId ? { storeId: userStoreId } : {}),
          },
        })
      }
    } else if (room.claimedById !== session.user.id) {
      // Cegah pengiriman KECUALI pengirim adalah SUPER_ADMIN atau pemilik inquiry (admin toko yang meminta bantuan)
      if (!isSuperAdmin && !isRoomCustomer) {
        return NextResponse.json(
          { error: 'This chat is already claimed by another admin' },
          { status: 403 }
        )
      }
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
