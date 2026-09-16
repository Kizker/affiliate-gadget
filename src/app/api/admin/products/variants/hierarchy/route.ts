import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import { buildCatalogHierarchy } from '@/lib/catalog-hierarchy'

export async function GET(request: Request) {
  try {
    const session = await auth()
    const role = session?.user?.role

    if (!role || (role !== 'SUPER_ADMIN' && role !== 'STORE_ADMIN')) {
      return NextResponse.json(
        {
          error:
            'Akses ditolak: Hanya Superadmin atau Admin Toko yang dapat mengakses hierarki katalog.',
        },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const brand = searchParams.get('brand')
    const query = searchParams.get('q')

    const statusParam = searchParams.get('status')
    const whereClause: any = {}

    if (statusParam === 'AKTIF') {
      whereClause.isActive = true
    } else if (statusParam === 'NONAKTIF') {
      whereClause.isActive = false
    }

    // Role-based store isolation
    if (role === 'STORE_ADMIN' && session?.user?.storeId) {
      whereClause.storeId = session.user.storeId
    }

    if (brand && brand !== 'ALL') {
      whereClause.brand = {
        equals: brand,
        mode: 'insensitive',
      }
    }

    if (query && query.trim()) {
      const q = query.trim()
      whereClause.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
        { model: { contains: q, mode: 'insensitive' } },
        {
          variants: {
            some: {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { color: { contains: q, mode: 'insensitive' } },
                { sku: { contains: q, mode: 'insensitive' } },
              ],
            },
          },
        },
      ]
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        store: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
        variants: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: [{ brand: 'asc' }, { name: 'asc' }],
    })

    const hierarchy = buildCatalogHierarchy(products)

    const totalBrands = hierarchy.length
    const totalSeries = hierarchy.reduce((acc, b) => acc + b.totalSeries, 0)
    const totalVariants = hierarchy.reduce((acc, b) => acc + b.totalVariants, 0)

    return NextResponse.json({
      success: true,
      data: hierarchy,
      meta: {
        totalBrands,
        totalSeries,
        totalVariants,
        totalProducts: products.length,
      },
    })
  } catch (error: any) {
    console.error('Error fetching catalog hierarchy:', error)
    return NextResponse.json(
      {
        error:
          'Terjadi kesalahan saat memuat hierarki katalog: ' +
          (error?.message || 'Internal Server Error'),
      },
      { status: 500 }
    )
  }
}
