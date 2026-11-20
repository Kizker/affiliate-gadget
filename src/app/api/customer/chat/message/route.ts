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
    const {
      roomId,
      content,
      messageType = 'text',
      mediaUrl,
      orderId: reqOrderId,
      storeId: reqStoreId,
    } = body

    if (!roomId || (!content?.trim() && !mediaUrl)) {
      return NextResponse.json(
        { error: 'Room ID and content/media required' },
        { status: 400 }
      )
    }

    // Verify room belongs to this customer
    let room = await prisma.adminChatRoom.findFirst({
      where: {
        id: roomId,
        customerId: session.user.id,
      },
    })

    // Self-healing fallback: jika room tidak ditemukan (misal terhapus oleh cleanup lama)
    if (!room) {
      // Prioritaskan order yang dikirim dari client jika ada
      const targetOrder = reqOrderId
        ? await prisma.order.findFirst({
            where: { id: reqOrderId, userId: session.user.id },
            include: {
              store: {
                include: {
                  group: {
                    include: {
                      afterSalesUser: true,
                    },
                  },
                },
              },
            },
          })
        : await prisma.order.findFirst({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
            include: {
              store: {
                include: {
                  group: {
                    include: {
                      afterSalesUser: true,
                    },
                  },
                },
              },
            },
          })

      const targetStoreId = reqStoreId || targetOrder?.storeId || null
      const afterSalesUser = targetOrder?.store?.group?.afterSalesUser
      const storeAdmin = targetStoreId
        ? await prisma.user.findFirst({
            where: { storeId: targetStoreId, role: 'STORE_ADMIN' },
          })
        : null

      let assignedAdmin = afterSalesUser || storeAdmin
      if (!assignedAdmin) {
        const superAdmin = await prisma.user.findFirst({
          where: { role: 'SUPER_ADMIN', isActive: true },
          select: { id: true },
        })
        if (superAdmin) assignedAdmin = superAdmin as any
      }

      try {
        room = await prisma.adminChatRoom.create({
          data: {
            id: roomId,
            customerId: session.user.id,
            storeId: targetStoreId,
            orderId: targetOrder?.id || null,
            claimedById: assignedAdmin?.id || null,
            claimedAt: assignedAdmin ? new Date() : null,
            lastMessageAt: new Date(),
          },
        })
      } catch (createErr) {
        console.warn(
          'Failed to auto-heal room with specific ID, creating with new ID:',
          createErr
        )
        room = await prisma.adminChatRoom.create({
          data: {
            customerId: session.user.id,
            storeId: targetStoreId,
            orderId: targetOrder?.id || null,
            claimedById: assignedAdmin?.id || null,
            claimedAt: assignedAdmin ? new Date() : null,
            lastMessageAt: new Date(),
          },
        })
      }
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
