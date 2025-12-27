import { NextResponse } from 'next/server'
import { auth } from '@/../auth'
import prisma from '@/lib/db'

// GET - Get all orders for admin with pagination and search
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''
    const status = searchParams.get('status') || ''

    const skip = (page - 1) * limit

    // Build where clause
    const where: {
      OR?: Array<{
        orderNumber?: { contains: string; mode: 'insensitive' }
        user?: {
          name?: { contains: string; mode: 'insensitive' }
          email?: { contains: string; mode: 'insensitive' }
        }
      }>
      status?: string
    } = {}

    // Search filter (order number, user name, user email)
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ]
    }

    // Status filter
    if (status && status !== 'all') {
      where.status = status
    }

    // Type filter (requires checking order items)
    let typeFilter: {
      items?: {
        some: {
          serviceId?: { not: null } | { not: null }
          productId?: { not: null } | { not: null }
          rentalItemId?: { not: null } | { not: null }
        }
      }
    } = {}
    if (type && type !== 'all') {
      if (type === 'service') {
        typeFilter = { items: { some: { serviceId: { not: null } } } }
      } else if (type === 'sparepart') {
        typeFilter = { items: { some: { productId: { not: null } } } }
      } else if (type === 'rental') {
        typeFilter = { items: { some: { rentalItemId: { not: null } } } }
      }
    }

    const finalWhere = { ...where, ...typeFilter }

    // Get total count for pagination
    const total = await prisma.order.count({ where: finalWhere })
    const totalPages = Math.ceil(total / limit)

    // Get orders with pagination
    const orders = await prisma.order.findMany({
      where: finalWhere,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                images: true,
              },
            },
            service: {
              select: {
                name: true,
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
      },
    })

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
