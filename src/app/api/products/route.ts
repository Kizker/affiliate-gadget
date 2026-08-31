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

    // Build where clause - only show items with stock > 0
    const where: Record<string, unknown> = {
      isActive: true,
      stock: { gt: 0 },
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where.price = {} as any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (minPrice !== undefined) (where.price as any).gte = minPrice
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (maxPrice !== undefined) (where.price as any).lte = maxPrice
    }

    const total = await prisma.product.count({ where })

    // Fetch ALL products with their order items
    const allProducts = await prisma.product.findMany({
      where,
      include: {
        orderItems: {
          select: {
            quantity: true,
            orderId: true,
          },
        },
      },
    })

    // Get product IDs
    const productIds = allProducts.map((p) => p.id)

    // Fetch all reviews for these products
    const allReviews = await prisma.review.findMany({
      where: {
        type: 'PRODUCT',
        order: {
          items: {
            some: {
              productId: { in: productIds },
            },
          },
        },
      },
      select: {
        rating: true,
        order: {
          select: {
            items: {
              select: {
                productId: true,
              },
            },
          },
        },
      },
    })

    // Group reviews by product ID
    const reviewsByProduct = new Map<
      string,
      { totalRating: number; count: number }
    >()
    allReviews.forEach((review) => {
      review.order?.items.forEach((item) => {
        if (item.productId) {
          const existing = reviewsByProduct.get(item.productId) || {
            totalRating: 0,
            count: 0,
          }
          reviewsByProduct.set(item.productId, {
            totalRating: existing.totalRating + review.rating,
            count: existing.count + 1,
          })
        }
      })
    })

    // Calculate sales and ratings for each product
    const productsWithStats = allProducts.map((product) => {
      const totalSold = product.orderItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      )
      const reviewData = reviewsByProduct.get(product.id) || {
        totalRating: 0,
        count: 0,
      }
      const rating =
        reviewData.count > 0 ? reviewData.totalRating / reviewData.count : 0

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { orderItems, ...productWithoutItems } = product
      return {
        ...productWithoutItems,
        totalSold,
        rating: Math.round(rating * 10) / 10, // Round to 1 decimal
        reviewCount: reviewData.count,
      }
    })

    // Sort based on sortBy parameter
    let sortedProducts = productsWithStats
    if (sortBy === 'popular' || sortBy === 'sold') {
      // Sort by sales count descending (most sold first)
      sortedProducts = [...productsWithStats].sort(
        (a, b) => b.totalSold - a.totalSold
      )
    } else if (sortBy === 'rating') {
      // Sort by rating value descending (highest rating first)
      sortedProducts = [...productsWithStats].sort(
        (a, b) => b.rating - a.rating
      )
    } else if (sortBy === 'price') {
      sortedProducts = [...productsWithStats].sort((a, b) =>
        sortOrder === 'asc' ? a.price - b.price : b.price - a.price
      )
    } else {
      // Default: createdAt desc
      sortedProducts = [...productsWithStats].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    }

    // Apply pagination
    const paginatedProducts = sortedProducts.slice(
      (page - 1) * limit,
      page * limit
    )

    // Get categories and brands for filter
    const [categories, brands] = await Promise.all([
      prisma.product.groupBy({
        by: ['category'],
        where: { isActive: true },
        _count: true,
      }),
      prisma.product.groupBy({
        by: ['brand'],
        where: { isActive: true, brand: { not: null } },
        _count: true,
      }),
    ])

    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    }

    return NextResponse.json(
      {
        products: paginatedProducts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
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
      },
      { headers }
    )
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      category,
      brand,
      model,
      condition = 'BARU',
      price,
      originalPrice,
      stock = 1,
      weightGram = 500,
      images = [],
      specs = {},
      storeId,
      warrantyDays = 30,
      includesCharger = true,
      includesScreenProtector = true,
      includesCase = true,
      variants = [],
    } = body

    if (!name || !price) {
      return NextResponse.json(
        { error: 'Nama produk dan harga wajib diisi' },
        { status: 400 }
      )
    }

    // Default to the first store if storeId not provided
    let finalStoreId = storeId
    if (!finalStoreId) {
      const firstStore = await prisma.store.findFirst()
      finalStoreId = firstStore?.id
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        description,
        category: category || 'Smartphone',
        brand,
        model,
        condition,
        price: parseFloat(String(price)),
        originalPrice: originalPrice ? parseFloat(String(originalPrice)) : null,
        stock: parseInt(String(stock)) || 0,
        weightGram: parseInt(String(weightGram)) || 500,
        images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80'],
        specs: specs || {},
        storeId: finalStoreId,
        warrantyDays: parseInt(String(warrantyDays)) || 30,
        includesCharger: Boolean(includesCharger),
        includesScreenProtector: Boolean(includesScreenProtector),
        includesCase: Boolean(includesCase),
        variants: {
          create: (variants || []).map((v: any) => ({
            name: v.name,
            ram: v.ram,
            storage: v.storage,
            color: v.color,
            price: parseFloat(String(v.price || price)),
            stock: parseInt(String(v.stock || stock)) || 0,
            sku: v.sku,
          })),
        },
      },
      include: {
        variants: true,
        store: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: newProduct,
      message: 'Produk berhasil ditambahkan',
    })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal menambahkan produk' },
      { status: 500 }
    )
  }
}

