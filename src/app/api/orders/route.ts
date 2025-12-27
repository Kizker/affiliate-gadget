import { NextResponse } from 'next/server'
import { auth } from '@/../auth'
import prisma from '@/lib/db'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all orders for this user
    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
