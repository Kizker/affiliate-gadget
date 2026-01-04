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

    const { technicianId } = await request.json()

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

    // Create new room
    const room = await prisma.chatRoom.create({
      data: {
        customerId,
        technicianId,
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

    return NextResponse.json({ room }, { status: 201 })
  } catch (error) {
    console.error('Error creating chat room:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
