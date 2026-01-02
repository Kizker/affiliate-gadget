import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// GET - Search products for catalog recommendations
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
    const type = searchParams.get('type') || 'all' // all, product, rental
    const limit = parseInt(searchParams.get('limit') || '10')

    type ProductResult = {
      id: string
      name: string
      price: number
      stock: number
      images: string[]
      category: string
      brand: string | null
    }
    type RentalItemResult = {
      id: string
      name: string
      pricePerDay: number
      stock: number
      images: string[]
    }
    let products: ProductResult[] = []
    let rentalItems: RentalItemResult[] = []

    if (type === 'all' || type === 'product') {
      products = await prisma.product.findMany({
        where: {
          isActive: true,
          ...(search && {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { category: { contains: search, mode: 'insensitive' } },
              { brand: { contains: search, mode: 'insensitive' } },
            ],
          }),
        },
        select: {
          id: true,
          name: true,
          price: true,
          stock: true,
          images: true,
          category: true,
          brand: true,
        },
        take: limit,
        orderBy: { name: 'asc' },
      })
    }

    if (type === 'all' || type === 'rental') {
      rentalItems = await prisma.rentalItem.findMany({
        where: {
          isActive: true,
          ...(search && {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }),
        },
        select: {
          id: true,
          name: true,
          pricePerDay: true,
          stock: true,
          images: true,
        },
        take: limit,
        orderBy: { name: 'asc' },
      })
    }

    return NextResponse.json({
      products: products.map((p) => ({ ...p, type: 'product' })),
      rentalItems: rentalItems.map((r) => ({ ...r, type: 'rental' })),
    })
  } catch (error) {
    console.error('Error searching products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
