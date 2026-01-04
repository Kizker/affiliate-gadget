import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// GET - Get all chat rooms for current user
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Check if user is a technician
    const technician = await prisma.technician.findUnique({
      where: { userId },
    })

    let rooms

    if (technician) {
      // Get rooms where user is the technician
      rooms = await prisma.chatRoom.findMany({
        where: { technicianId: technician.id },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              image: true,
              email: true,
            },
          },
          technician: {
            select: {
              id: true,
              isAvailable: true,
              user: {
                select: {
                  name: true,
                  image: true,
                },
              },
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
              id: true,
              content: true,
              createdAt: true,
              senderId: true,
              isRead: true,
              mediaUrl: true,
              mediaType: true,
            },
          },
          _count: {
            select: {
              messages: {
                where: {
                  isRead: false,
                  senderId: { not: userId },
                },
              },
            },
          },
        },
        orderBy: { lastMessageAt: 'desc' },
      })
    } else {
      // Get rooms where user is the customer
      rooms = await prisma.chatRoom.findMany({
        where: { customerId: userId },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              image: true,
              email: true,
            },
          },
          technician: {
            select: {
              id: true,
              isAvailable: true,
              rating: true,
              totalReview: true,
              experience: true,
              specialties: true,
              user: {
                select: {
                  name: true,
                  image: true,
                  email: true,
                  phone: true,
                },
              },
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
              id: true,
              content: true,
              createdAt: true,
              senderId: true,
              isRead: true,
              mediaUrl: true,
              mediaType: true,
            },
          },
          _count: {
            select: {
              messages: {
                where: {
                  isRead: false,
                  senderId: { not: userId },
                },
              },
            },
          },
        },
        orderBy: { lastMessageAt: 'desc' },
      })
    }

    // Short cache for chat rooms list - frequently polled but doesn't need to be real-time
    return NextResponse.json(
      { rooms },
      {
        headers: {
          'Cache-Control': 'private, max-age=5, stale-while-revalidate=10',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching chat rooms:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new chat room with technician
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { technicianId, orderId } = await request.json()

    if (!technicianId) {
      return NextResponse.json(
        { error: 'Technician ID required' },
        { status: 400 }
      )
    }

    const customerId = session.user.id

    // Check if room already exists
    const existingRoom = await prisma.chatRoom.findUnique({
      where: {
        customerId_technicianId: {
          customerId,
          technicianId,
        },
      },
    })

    if (existingRoom) {
      return NextResponse.json({ room: existingRoom })
    }

    // Create new room with order reference message in transaction
    let room
    let orderReferenceMessage = null

    if (orderId) {
      // Use transaction to ensure message is created with room
      const result = await prisma.$transaction(async (tx) => {
        // Create room
        const newRoom = await tx.chatRoom.create({
          data: {
            customerId,
            technicianId,
            orderId,
          },
          include: {
            technician: {
              include: {
                user: {
                  select: {
                    name: true,
                    image: true,
                  },
                },
              },
            },
          },
        })

        // Get order details
        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: {
            items: {
              include: {
                product: { select: { name: true } },
                service: { select: { name: true } },
                rentalItem: { select: { name: true } },
              },
            },
          },
        })

        if (!order) {
          throw new Error('Order not found')
        }

        // Create order reference message
        const message = await tx.chatMessage.create({
          data: {
            roomId: newRoom.id,
            senderId: customerId,
            content: JSON.stringify({
              type: 'order_reference',
              orderId: order.id,
              orderNumber: order.orderNumber,
              status: order.status,
              total: order.total,
              createdAt: order.createdAt.toISOString(),
              items: order.items.map((item) => ({
                type: item.type,
                quantity: item.quantity,
                product: item.product,
                service: item.service,
                rentalItem: item.rentalItem,
              })),
            }),
            mediaType: 'order_reference',
          },
          select: {
            id: true,
            content: true,
            mediaType: true,
            createdAt: true,
            senderId: true,
            sender: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        })

        return { room: newRoom, message }
      })

      room = result.room
      orderReferenceMessage = result.message
    } else {
      // Create room without order reference
      room = await prisma.chatRoom.create({
        data: {
          customerId,
          technicianId,
          orderId: null,
        },
        include: {
          technician: {
            include: {
              user: {
                select: {
                  name: true,
                  image: true,
                },
              },
            },
          },
        },
      })
    }

    // Return room with messages if order reference was created
    const response = {
      room,
      messages: orderReferenceMessage ? [orderReferenceMessage] : [],
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error creating chat room:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
