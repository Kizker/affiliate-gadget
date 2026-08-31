import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import { isAdminStaffRole } from '@/lib/dashboard-utils'

// GET - Search & list products for store catalog recommendations
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin or staff and get user's store
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        role: true,
        storeId: true,
        store: {
          select: {
            id: true,
            name: true,
            companyName: true,
            city: true,
          },
        },
      },
    })

    if (!user || !isAdminStaffRole(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const paramStoreId = searchParams.get('storeId') || ''
    const limit = parseInt(searchParams.get('limit') || '100')

    // Determine target store
    const targetStoreId = paramStoreId || user.storeId || undefined

    // Build Product Where Clause
    const productWhere: any = {
      isActive: true,
    }

    if (targetStoreId) {
      productWhere.storeId = targetStoreId
    }

    if (search.trim()) {
      productWhere.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { category: { contains: search.trim(), mode: 'insensitive' } },
        { brand: { contains: search.trim(), mode: 'insensitive' } },
        { model: { contains: search.trim(), mode: 'insensitive' } },
      ]
    }

    let products = await prisma.product.findMany({
      where: productWhere,
      select: {
        id: true,
        name: true,
        price: true,
        originalPrice: true,
        stock: true,
        images: true,
        category: true,
        brand: true,
        model: true,
        condition: true,
        storeId: true,
        store: {
          select: {
            id: true,
            name: true,
            companyName: true,
            city: true,
          },
        },
        variants: {
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            ram: true,
            storage: true,
            color: true,
          },
        },
      },
      take: limit,
      orderBy: [
        { stock: 'desc' },
        { name: 'asc' },
      ],
    })

    // If store specifically requested had no products yet, fallback to all active products
    if (products.length === 0 && targetStoreId) {
      const fallbackWhere: any = {
        isActive: true,
      }
      if (search.trim()) {
        fallbackWhere.OR = [
          { name: { contains: search.trim(), mode: 'insensitive' } },
          { category: { contains: search.trim(), mode: 'insensitive' } },
          { brand: { contains: search.trim(), mode: 'insensitive' } },
        ]
      }

      products = await prisma.product.findMany({
        where: fallbackWhere,
        select: {
          id: true,
          name: true,
          price: true,
          originalPrice: true,
          stock: true,
          images: true,
          category: true,
          brand: true,
          model: true,
          condition: true,
          storeId: true,
          store: {
            select: {
              id: true,
              name: true,
              companyName: true,
              city: true,
            },
          },
          variants: {
            select: {
              id: true,
              name: true,
              price: true,
              stock: true,
              ram: true,
              storage: true,
              color: true,
            },
          },
        },
        take: limit,
        orderBy: [
          { stock: 'desc' },
          { name: 'asc' },
        ],
      })
    }

    const formattedItems = products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      originalPrice: p.originalPrice,
      stock: p.stock,
      images: p.images,
      category: p.category,
      brand: p.brand,
      model: p.model,
      condition: p.condition,
      type: 'product' as const,
      storeName: p.store?.name || user.store?.name || 'Cabang Resmi',
      storeCity: p.store?.city || user.store?.city || '',
      variants: p.variants,
    }))

    return NextResponse.json({
      success: true,
      items: formattedItems,
      products: formattedItems,
      total: formattedItems.length,
      store: user.store || null,
    })
  } catch (error) {
    console.error('Error searching products for chat catalog:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
