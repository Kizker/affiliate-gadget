import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const brand = searchParams.get('brand') || ''
    const minPrice = searchParams.get('minPrice')
      ? parseFloat(searchParams.get('minPrice')!)
      : undefined
    const maxPrice = searchParams.get('maxPrice')
      ? parseFloat(searchParams.get('maxPrice')!)
      : undefined
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = {
      isActive: true, // Only show active products to public
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (category) {
      where.category = { contains: category, mode: 'insensitive' }
    }

    if (brand) {
      where.brand = { contains: brand, mode: 'insensitive' }
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {}
      if (minPrice !== undefined) where.price.gte = minPrice
      if (maxPrice !== undefined) where.price.lte = maxPrice
    }

    // Build orderBy clause
    const orderBy: Record<string, 'asc' | 'desc'> = {}
    orderBy[sortBy] = sortOrder as 'asc' | 'desc'

    // Fetch products
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    // Get categories for filter
    const categories = await prisma.product.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: true,
    })

    // Get brands for filter
    const brands = await prisma.product.groupBy({
      by: ['brand'],
      where: { isActive: true, brand: { not: null } },
      _count: true,
    })

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      filters: {
        categories: categories.map((c) => ({
          value: c.category,
          label: c.category,
          count: c._count,
        })),
        brands: brands.map((b) => ({
          value: b.brand,
          label: b.brand,
          count: b._count,
        })),
      },
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}
