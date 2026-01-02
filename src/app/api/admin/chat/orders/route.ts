import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// GET - Search orders for sharing in chat
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const customerId = searchParams.get('customerId')
    const limit = parseInt(searchParams.get('limit') || '10')

    const orders = await prisma.order.findMany({
      where: {
        ...(customerId && { userId: customerId }),
        ...(search && {
          OR: [{ orderNumber: { contains: search, mode: 'insensitive' } }],
        }),
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            rentalDays: true,
            product: {
              select: { name: true, images: true },
            },
            rentalItem: {
              select: { name: true, images: true },
            },
            service: {
              select: { name: true },
            },
          },
        },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Error searching orders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
