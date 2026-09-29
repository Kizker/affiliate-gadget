import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { auth } from '@/auth'
import { analyzeSmartQuery } from '@/lib/smart-search'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const brand = searchParams.get('brand') || ''
    let storeId = searchParams.get('storeId') || ''
    const scoped = searchParams.get('scoped') === 'true'
    const minPrice = searchParams.get('minPrice')
      ? parseFloat(searchParams.get('minPrice')!)
      : undefined
    const maxPrice = searchParams.get('maxPrice')
      ? parseFloat(searchParams.get('maxPrice')!)
      : undefined

    if (scoped && !storeId) {
      const session = await auth()
      if (session?.user?.role === 'STORE_ADMIN') {
        let effectiveStoreId = session.user.storeId
        if (!effectiveStoreId && session.user.id) {
          const u = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { storeId: true },
          })
          effectiveStoreId = u?.storeId || null
        }
        if (effectiveStoreId) {
          storeId = effectiveStoreId
        }
      }
    }

    const sort = searchParams.get('sort') || ''
    const statusParam = searchParams.get('status') || ''

    const where: any = {}

    // Public view only sees active products, while admin/scoped can see both unless specified
    if (!scoped && statusParam !== 'all') {
      where.isActive = true
    } else if (statusParam === 'active') {
      where.isActive = true
    } else if (statusParam === 'inactive') {
      where.isActive = false
    }

    if (search) {
      const smart = analyzeSmartQuery(search)
      const searchTerms = [search]
      if (smart.hasCorrection && !searchTerms.includes(smart.effectiveQuery)) {
        searchTerms.push(smart.effectiveQuery)
      }

      where.OR = searchTerms.flatMap((term) => [
        { name: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { brand: { contains: term, mode: 'insensitive' } },
        { model: { contains: term, mode: 'insensitive' } },
      ])
    }

    if (brand && brand !== 'ALL') {
      where.brand = { equals: brand, mode: 'insensitive' }
    }

    if (storeId) {
      where.storeId = storeId
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {}
      if (minPrice !== undefined) where.price.gte = minPrice
      if (maxPrice !== undefined) where.price.lte = maxPrice
    }

    // Determine ordering
    let orderBy: any = [{ promotionPriority: 'desc' }, { createdAt: 'desc' }]
    if (scoped || sort === 'latest') {
      orderBy = [{ createdAt: 'desc' }]
    } else if (sort === 'oldest') {
      orderBy = [{ createdAt: 'asc' }]
    } else if (sort === 'price_desc') {
      orderBy = [{ price: 'desc' }, { createdAt: 'desc' }]
    } else if (sort === 'price_asc') {
      orderBy = [{ price: 'asc' }, { createdAt: 'desc' }]
    } else if (sort === 'stock_desc') {
      orderBy = [{ stock: 'desc' }, { createdAt: 'desc' }]
    } else if (sort === 'priority') {
      orderBy = [{ promotionPriority: 'desc' }, { createdAt: 'desc' }]
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            companyName: true,
            city: true,
            rating: true,
          },
        },
        variants: true,
      },
      orderBy,
    })

    // Agregasi jumlah penjualan riil dari OrderItem (order valid / tidak dibatalkan)
    const productIds = products.map((p) => p.id)
    const salesMap = new Map<string, number>()
    if (productIds.length > 0) {
      const salesGroup = await prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          productId: { in: productIds },
          order: {
            status: { not: 'CANCELLED' },
          },
        },
        _sum: {
          quantity: true,
        },
      })

      salesGroup.forEach((s) => {
        if (s.productId) {
          salesMap.set(s.productId, s._sum.quantity || 0)
        }
      })
    }

    const enrichedProducts = products.map((p) => ({
      ...p,
      soldCount: salesMap.get(p.id) || 0,
      store: p.store
        ? {
            ...p.store,
            isPkp: (p.store as any).isPkp ?? true,
            vatRate: (p.store as any).vatRate ?? 11.0,
            taxType: (p.store as any).taxType ?? 'INCLUSIVE',
          }
        : null,
    }))

    const cacheHeaders = scoped
      ? { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
      : { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' }

    return NextResponse.json(
      {
        success: true,
        data: enrichedProducts,
      },
      {
        headers: cacheHeaders,
      }
    )
  } catch (error) {
    console.error('Error fetching gadgets:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal memuat katalog gadget' },
      { status: 500 }
    )
  }
}
