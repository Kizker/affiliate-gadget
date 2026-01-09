import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all orders for this user with reviews included (fixes N+1 problem)
    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      include: {
        items: {
          select: {
            id: true,
            type: true,
            notes: true,
            service: {
              select: {
                name: true,
                category: true,
              },
            },
            product: {
              select: {
                name: true,
                images: true,
              },
            },
            rentalItem: {
              select: {
                name: true,
                images: true,
              },
            },
          },
        },
        technician: {
          include: {
            user: {
              select: {
                name: true,
                phone: true,
                image: true,
              },
            },
          },
        },
        // Include reviews directly - fixes N+1 query problem
        reviews: {
          where: {
            type: 'TECHNICIAN',
          },
          take: 1,
          select: {
            id: true,
            rating: true,
            comment: true,
          },
        },
        // Include complaints with details for customer view
        complaints: {
          select: {
            id: true,
            status: true,
            subject: true,
            description: true,
            images: true,
            resolution: true,
            rejectionNote: true,
            createdAt: true,
            resolvedAt: true,
            assignedTo: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Cache for 15 seconds - order list can change frequently but benefit from short cache
    return NextResponse.json(
      { orders },
      {
        headers: {
          'Cache-Control': 'private, max-age=15, stale-while-revalidate=30',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
