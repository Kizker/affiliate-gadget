import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// GET - Get single product details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Try to find by ID first (CUID format)
    let product = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: true,
        store: true,
      },
    })

    // If not found by ID, try finding by converting slug-like ID back to name
    if (!product) {
      let searchName = id
      if (searchName.startsWith('product-')) {
        searchName = searchName.substring(8)
      }
      if (searchName.endsWith('-')) {
        searchName = searchName.slice(0, -1)
      }
      searchName = searchName.replace(/-/g, ' ')

      product = await prisma.product.findFirst({
        where: {
          name: { contains: searchName, mode: 'insensitive' },
          isActive: true,
        },
        include: {
          variants: true,
          store: true,
        },
      })
    }

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(product, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

// PATCH - Edit/Update product details
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN' && user.role !== 'STORE_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    // Find existing product
    const existing = await prisma.product.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Store Admin can only edit products belonging to their store
    if (user.role === 'STORE_ADMIN' && user.storeId && existing.storeId !== user.storeId) {
      return NextResponse.json({ error: 'Forbidden: Cannot edit product of another store' }, { status: 403 })
    }

    const {
      name,
      description,
      category,
      brand,
      model,
      condition,
      price,
      originalPrice,
      stock,
      weightGram,
      images,
      specs,
      warrantyDays,
      includesCharger,
      includesScreenProtector,
      includesCase,
      variants,
      isActive,
    } = body

    const updated = await prisma.$transaction(async (tx) => {
      // If variants are provided, replace them
      if (Array.isArray(variants)) {
        await tx.productVariant.deleteMany({
          where: { productId: id },
        })

        if (variants.length > 0) {
          await tx.productVariant.createMany({
            data: variants.map((v: any) => ({
              productId: id,
              name: v.name,
              ram: v.ram,
              storage: v.storage,
              color: v.color,
              price: parseFloat(String(v.price || price || existing.price)),
              stock: parseInt(String(v.stock || stock || existing.stock)) || 0,
              sku: v.sku || null,
            })),
          })
        }
      }

      return await tx.product.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(category !== undefined && { category }),
          ...(brand !== undefined && { brand }),
          ...(model !== undefined && { model }),
          ...(condition !== undefined && { condition }),
          ...(price !== undefined && { price: parseFloat(String(price)) }),
          ...(originalPrice !== undefined && {
            originalPrice: originalPrice ? parseFloat(String(originalPrice)) : null,
          }),
          ...(stock !== undefined && { stock: parseInt(String(stock)) || 0 }),
          ...(weightGram !== undefined && { weightGram: parseInt(String(weightGram)) || 500 }),
          ...(images !== undefined && { images }),
          ...(specs !== undefined && { specs }),
          ...(warrantyDays !== undefined && { warrantyDays: parseInt(String(warrantyDays)) || 30 }),
          ...(includesCharger !== undefined && { includesCharger: Boolean(includesCharger) }),
          ...(includesScreenProtector !== undefined && {
            includesScreenProtector: Boolean(includesScreenProtector),
          }),
          ...(includesCase !== undefined && { includesCase: Boolean(includesCase) }),
          ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        },
        include: {
          variants: true,
          store: true,
        },
      })
    })

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Produk berhasil diperbarui',
    })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal memperbarui produk' },
      { status: 500 }
    )
  }
}

// DELETE - Delete product (or soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN' && user.role !== 'STORE_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const existing = await prisma.product.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Store Admin can only delete products belonging to their store
    if (user.role === 'STORE_ADMIN' && user.storeId && existing.storeId !== user.storeId) {
      return NextResponse.json({ error: 'Forbidden: Cannot delete product of another store' }, { status: 403 })
    }

    // Perform deletion
    await prisma.$transaction(async (tx) => {
      // Delete variants first
      await tx.productVariant.deleteMany({
        where: { productId: id },
      })
      // Delete product
      await tx.product.delete({
        where: { id },
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Produk berhasil dihapus',
    })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal menghapus produk' },
      { status: 500 }
    )
  }
}
