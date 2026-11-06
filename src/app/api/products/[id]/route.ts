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
    const session = await auth()
    const role = session?.user?.role
    const isStoreStaff = role === 'STORE_ADMIN' || role === 'STORE_SALES'

    let product: any = null

    if (isStoreStaff) {
      let userStoreId = session?.user?.storeId
      if (!userStoreId && session?.user?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { storeId: true },
        })
        userStoreId = dbUser?.storeId || null
      }

      if (!userStoreId) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }

      // IDOR Protection: Store Admin only views products belonging to their store
      product = await prisma.product.findFirst({
        where: { id, storeId: userStoreId },
        include: {
          variants: true,
          store: true,
        },
      })
    } else if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
      product = await prisma.product.findUnique({
        where: { id },
        include: {
          variants: true,
          store: true,
        },
      })
    } else {
      // Public / Customer: Only fetch active products, fallback by name/slug
      product = await prisma.product.findFirst({
        where: { id, isActive: true },
        include: {
          variants: true,
          store: true,
        },
      })

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

      // Sembunyikan field rahasia HPP toko (costPrice) untuk publik
      if (product) {
        product.costPrice = undefined
        if (Array.isArray(product.variants)) {
          product.variants = product.variants.map((v: any) => ({
            ...v,
            costPrice: undefined,
          }))
        }
      }
    }

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(product, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
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
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(session.user.id ? [{ id: session.user.id }] : []),
          ...(session.user.email ? [{ email: session.user.email }] : []),
        ],
      },
      select: { id: true, role: true, storeId: true },
    })

    if (
      !user ||
      (user.role !== 'SUPER_ADMIN' &&
        user.role !== 'ADMIN' &&
        user.role !== 'STORE_ADMIN' &&
        user.role !== 'STORE_SALES')
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const isStoreStaff =
      user.role === 'STORE_ADMIN' || user.role === 'STORE_SALES'
    const userStoreId = user.storeId || session.user.storeId

    // IDOR Protection: Store Admin can only edit products belonging to their store
    const existing = await prisma.product.findFirst({
      where: isStoreStaff ? { id, storeId: userStoreId || '' } : { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const {
      name,
      description,
      category,
      brand,
      model,
      condition,
      price,
      costPrice,
      originalPrice,
      stock,
      weightGram,
      pricePerKg,
      images,
      specs,
      warrantyDays,
      includesCharger,
      includesScreenProtector,
      includesCase,
      isTaxable,
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
              image: v.image || null,
              price: parseFloat(
                String(v.price || price || existing.price).replace(/\./g, '')
              ),
              costPrice:
                v.costPrice !== undefined && v.costPrice !== null
                  ? parseFloat(String(v.costPrice).replace(/\./g, '')) || 0
                  : costPrice !== undefined && costPrice !== null
                    ? parseFloat(String(costPrice).replace(/\./g, '')) || 0
                    : (existing as any).costPrice || 0,
              stock: parseInt(String(v.stock || stock || existing.stock)) || 0,
              sku: v.sku
                ? String(v.sku).trim()
                : body.sku
                  ? String(body.sku).trim()
                  : null,
            })),
          })
        }
      }

      return await tx.product.update({
        where: { id },
        data: {
          ...(body.storeId &&
            (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') && {
              storeId: body.storeId,
            }),
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(category !== undefined && { category }),
          ...(brand !== undefined && { brand }),
          ...(model !== undefined && { model }),
          ...(condition !== undefined && { condition }),
          ...(price !== undefined && {
            price: parseFloat(String(price).replace(/\./g, '')),
          }),
          ...(costPrice !== undefined && {
            costPrice: parseFloat(String(costPrice).replace(/\./g, '')) || 0,
          }),
          ...(originalPrice !== undefined && {
            originalPrice: originalPrice
              ? parseFloat(String(originalPrice).replace(/\./g, ''))
              : null,
          }),
          ...(stock !== undefined && { stock: parseInt(String(stock)) || 0 }),
          ...(weightGram !== undefined && {
            weightGram: parseInt(String(weightGram)) || 500,
          }),
          ...(pricePerKg !== undefined && {
            pricePerKg:
              parseFloat(String(pricePerKg).replace(/\./g, '')) || 20000,
          }),
          ...(images !== undefined && { images }),
          ...(specs !== undefined && { specs }),
          ...(warrantyDays !== undefined && {
            warrantyDays: parseInt(String(warrantyDays)) || 30,
          }),
          ...(includesCharger !== undefined && {
            includesCharger: Boolean(includesCharger),
          }),
          ...(includesScreenProtector !== undefined && {
            includesScreenProtector: Boolean(includesScreenProtector),
          }),
          ...(includesCase !== undefined && {
            includesCase: Boolean(includesCase),
          }),
          ...(isTaxable !== undefined && { isTaxable: Boolean(isTaxable) }),
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
      {
        error:
          error instanceof Error ? error.message : 'Gagal memperbarui produk',
      },
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
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(session.user.id ? [{ id: session.user.id }] : []),
          ...(session.user.email ? [{ email: session.user.email }] : []),
        ],
      },
      select: { id: true, role: true, storeId: true },
    })

    if (
      !user ||
      (user.role !== 'SUPER_ADMIN' &&
        user.role !== 'ADMIN' &&
        user.role !== 'STORE_ADMIN' &&
        user.role !== 'STORE_SALES')
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const isStoreStaff =
      user.role === 'STORE_ADMIN' || user.role === 'STORE_SALES'
    const userStoreId = user.storeId || session.user.storeId

    // IDOR Protection: Store Admin can only delete products belonging to their store
    const existing = await prisma.product.findFirst({
      where: isStoreStaff ? { id, storeId: userStoreId || '' } : { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
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
      {
        error:
          error instanceof Error ? error.message : 'Gagal menghapus produk',
      },
      { status: 500 }
    )
  }
}
