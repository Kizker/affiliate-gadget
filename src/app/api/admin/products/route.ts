import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

import { isAdminStaffRole } from '@/lib/dashboard-utils'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    // Only staff and admin roles can access
    if (!session?.user || !isAdminStaffRole(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || 'ALL'
    const stockStatus = searchParams.get('stockStatus') || 'ALL'
    const isActive = searchParams.get('isActive')

    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = {}

    if (category !== 'ALL') {
      where.category = category
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true'
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Stock status filter
    if (stockStatus === 'out_of_stock') {
      where.stock = { lte: 0 }
    } else if (stockStatus === 'low_stock') {
      where.stock = { gt: 0, lte: 5 }
    } else if (stockStatus === 'in_stock') {
      where.stock = { gt: 5 }
    }

    // Store Admin (Akun Toko) strictly manages products for their own store
    if (session.user.role === 'STORE_ADMIN' && session.user.storeId) {
      where.storeId = session.user.storeId
    }

    // Get products with pagination
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    // Get stats
    const [totalProducts, lowStockCount, outOfStockCount, categoryStats] =
      await Promise.all([
        prisma.product.count(),
        prisma.product.count({ where: { stock: { gt: 0, lte: 5 } } }),
        prisma.product.count({ where: { stock: { lte: 0 } } }),
        prisma.product.groupBy({
          by: ['category'],
          _count: true,
        }),
      ])

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        total: totalProducts,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
        byCategory: categoryStats.reduce(
          (acc: Record<string, number>, stat) => {
            acc[stat.category] = stat._count
            return acc
          },
          {}
        ),
      },
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    // Only staff and admin roles can create products
    if (!session?.user || !isAdminStaffRole(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      description,
      category,
      brand,
      model,
      price,
      stock,
      images,
      isActive,
    } = body

    // Validation
    if (!name || !category || price === undefined || stock === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (price < 0 || stock < 0) {
      return NextResponse.json(
        { error: 'Price and stock must be positive numbers' },
        { status: 400 }
      )
    }

    // Create product
    const storeIdToAssign = body.storeId || (session.user.role === 'STORE_ADMIN' ? session.user.storeId : undefined)

    const product = await prisma.product.create({
      data: {
        name,
        description,
        category,
        brand,
        model,
        price: parseFloat(price),
        stock: parseInt(stock),
        images: images || [],
        isActive: isActive !== undefined ? isActive : true,
        ...(storeIdToAssign ? { storeId: storeIdToAssign } : {}),
      },
    })

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
