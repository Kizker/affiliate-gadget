import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// POST - Create or get a direct chat room between a customer and a mitra
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { mitraId, serviceContext } = body

    if (!mitraId || typeof mitraId !== 'string') {
      return NextResponse.json(
        { error: 'mitraId is required' },
        { status: 400 }
      )
    }

    // Find the mitra and its owner user
    const mitra = await prisma.mitra.findFirst({
      where: {
        id: mitraId,
        isApproved: true,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
        images: {
          where: { isBanner: true },
          take: 1,
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
    })

    if (!mitra || !mitra.user) {
      return NextResponse.json({ error: 'Mitra not found' }, { status: 404 })
    }

    const mitraUser = mitra.user
    const mitraBanner = mitra.banner || mitra.images[0]?.url || null

    // Find existing room: customer <-> this mitra user (storeId = null, orderId = null)
    let room = await prisma.adminChatRoom.findFirst({
      where: {
        customerId: session.user.id,
        claimedById: mitraUser.id,
        storeId: null,
        orderId: null,
      } as any,
    })

    const isNew = !room

    if (!room) {
      // Create new direct room between customer and mitra
      room = await prisma.adminChatRoom.create({
        data: {
          customerId: session.user.id,
          storeId: null,
          claimedById: mitraUser.id,
          claimedAt: new Date(),
          lastMessageAt: new Date(),
        } as any,
      })

      // Increment mitra inquiry counter
      await prisma.mitra
        .update({
          where: { id: mitra.id },
          data: { totalInquiries: { increment: 1 } },
        })
        .catch(() => {})
    }

    if (!room) {
      return NextResponse.json(
        { error: 'Failed to create chat room' },
        { status: 500 }
      )
    }

    // Auto-send greeting serviceContext message if provided and room is new
    let messages: any[] = []

    if (isNew && serviceContext && typeof serviceContext === 'string') {
      const greeting = await prisma.adminChatMessage.create({
        data: {
          roomId: room.id,
          senderId: session.user.id,
          content: serviceContext,
          messageType: 'text',
        },
        include: {
          sender: {
            select: { id: true, name: true, image: true, role: true },
          },
        },
      })

      // Update lastMessageAt
      await prisma.adminChatRoom.update({
        where: { id: room.id },
        data: { lastMessageAt: new Date() },
      })

      messages = [greeting]
    } else {
      // Fetch existing messages
      messages = await prisma.adminChatMessage.findMany({
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
            select: { id: true, name: true, image: true, role: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      })
    }

    // Return mitra data shaped like a "store" so the chat page UI is compatible
    return NextResponse.json({
      roomId: room.id,
      store: {
        id: mitra.id,
        name: mitra.businessName,
        companyName: mitra.businessName,
        phone: mitra.phone,
        city: mitra.city,
        logo: mitraBanner,
        isActive: mitra.isActive,
        schedules: mitra.schedules || [],
      },
      claimedBy: {
        id: mitraUser.id,
        name: mitraUser.name,
        email: mitraUser.email,
        image: mitraUser.image,
      },
      orderId: null,
      order: null,
      isNew,
      messages,
    })
  } catch (error) {
    console.error('Error opening mitra chat room:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
