import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    // Only ADMIN and SUPER_ADMIN can access
    if (
      !session?.user ||
      (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const stockStatus = searchParams.get('stockStatus') || 'ALL'
    const isActive = searchParams.get('isActive')

    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = {}

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true'
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Stock status filter
    if (stockStatus === 'unavailable') {
      where.stock = { lte: 0 }
    } else if (stockStatus === 'available') {
      where.stock = { gt: 0 }
    }

    // Get rental items with pagination
    const [rentalItems, total] = await Promise.all([
      prisma.rentalItem.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.rentalItem.count({ where }),
    ])

    // Get stats
    const [totalItems, availableCount, unavailableCount] = await Promise.all([
      prisma.rentalItem.count(),
      prisma.rentalItem.count({ where: { stock: { gt: 0 } } }),
      prisma.rentalItem.count({ where: { stock: { lte: 0 } } }),
    ])

    return NextResponse.json({
      rentalItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        total: totalItems,
        available: availableCount,
        unavailable: unavailableCount,
      },
    })
  } catch (error) {
    console.error('Error fetching rental items:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    // Only ADMIN and SUPER_ADMIN can create rental items
    if (
      !session?.user ||
      (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      description,
      pricePerDay,
      weeklyDiscountPct,
      monthlyDiscountPct,
      depositAmount,
      terms,
      stock,
      images,
      isActive,
    } = body

    // Validation
    if (!name || pricePerDay === undefined || stock === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (pricePerDay < 0 || stock < 0) {
      return NextResponse.json(
        { error: 'Price and stock must be positive numbers' },
        { status: 400 }
      )
    }

    // Create rental item
    const rentalItem = await prisma.rentalItem.create({
      data: {
        name,
        description,
        pricePerDay: parseFloat(pricePerDay),
        weeklyDiscountPct:
          weeklyDiscountPct !== undefined ? parseFloat(weeklyDiscountPct) : 10,
        monthlyDiscountPct:
          monthlyDiscountPct !== undefined
            ? parseFloat(monthlyDiscountPct)
            : 20,
        depositAmount: depositAmount ? parseFloat(depositAmount) : null,
        terms: terms || [],
        stock: parseInt(stock),
        images: images || [],
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    return NextResponse.json({ rentalItem }, { status: 201 })
  } catch (error) {
    console.error('Error creating rental item:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
