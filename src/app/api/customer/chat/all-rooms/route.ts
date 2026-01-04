import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// GET - Get all admin chat rooms for current customer
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all admin chat rooms for this customer
    const rooms = await prisma.adminChatRoom.findMany({
      where: {
        customerId: session.user.id,
      },
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
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            content: true,
            sender: {
              select: {
                id: true,
                name: true,
                image: true,
                role: true,
              },
            },
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

    return NextResponse.json({ rooms })
  } catch (error) {
    console.error('Error fetching customer admin chat rooms:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
