import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { auth } from '@/auth'

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

    const where: any = {
      isActive: true,
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ]
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
      orderBy: [{ promotionPriority: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json(
      {
        success: true,
        data: products,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
        },
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
