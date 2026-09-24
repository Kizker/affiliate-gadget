import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

import { isAdminStaffRole } from '@/lib/dashboard-utils'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    // Only staff and admin roles can access
    if (!session?.user || !isAdminStaffRole(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: {
          orderBy: { price: 'asc' },
        },
        store: {
          select: {
            id: true,
            name: true,
            city: true,
            isPkp: true,
            vatRate: true,
            taxType: true,
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    // Only staff and admin roles can update products
    if (!session?.user || !isAdminStaffRole(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json()

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Validate numbers
    if (body.price !== undefined && body.price < 0) {
      return NextResponse.json(
        { error: 'Price must be a positive number' },
        { status: 400 }
      )
    }

    if (
      body.costPrice !== undefined &&
      body.costPrice !== null &&
      body.costPrice !== ''
    ) {
      if (Number(body.costPrice) < 0) {
        return NextResponse.json(
          { error: 'Harga modal (costPrice) tidak boleh negatif' },
          { status: 400 }
        )
      }
    }

    if (body.stock !== undefined && body.stock < 0) {
      return NextResponse.json(
        { error: 'Stock must be a positive number' },
        { status: 400 }
      )
    }

    // Update variants if provided
    if (Array.isArray(body.variants)) {
      for (const v of body.variants) {
        if (v.id) {
          await prisma.productVariant.update({
            where: { id: v.id },
            data: {
              ...(v.price !== undefined && { price: parseFloat(v.price) }),
              ...(v.stock !== undefined && { stock: parseInt(v.stock) }),
              ...(v.costPrice !== undefined && {
                costPrice:
                  v.costPrice !== null && v.costPrice !== ''
                    ? parseFloat(v.costPrice)
                    : null,
              }),
            },
          })
        }
      }
    }

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.description !== undefined && {
          description: body.description,
        }),
        ...(body.category && { category: body.category }),
        ...(body.brand !== undefined && { brand: body.brand }),
        ...(body.model !== undefined && { model: body.model }),
        ...(body.price !== undefined && { price: parseFloat(body.price) }),
        ...(body.costPrice !== undefined && {
          costPrice:
            body.costPrice !== null && body.costPrice !== ''
              ? parseFloat(body.costPrice)
              : 0,
        }),
        ...(body.stock !== undefined && { stock: parseInt(body.stock) }),
        ...(body.images && { images: body.images }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.isTaxable !== undefined && {
          isTaxable: Boolean(body.isTaxable),
        }),
      },
      include: {
        variants: {
          orderBy: { price: 'asc' },
        },
      },
    })

    return NextResponse.json({ product: updatedProduct })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    // Only SUPER_ADMIN can delete products
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Delete product
    await prisma.product.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
