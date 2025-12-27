import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/../auth'
import prisma from '@/lib/db'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    // Only ADMIN and SUPER_ADMIN can access
    if (
      !session?.user ||
      (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    const rentalItem = await prisma.rentalItem.findUnique({
      where: { id },
    })

    if (!rentalItem) {
      return NextResponse.json(
        { error: 'Rental item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ rentalItem })
  } catch (error) {
    console.error('Error fetching rental item:', error)
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

    // Only ADMIN and SUPER_ADMIN can update rental items
    if (
      !session?.user ||
      (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json()

    // Check if rental item exists
    const existingItem = await prisma.rentalItem.findUnique({
      where: { id },
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Rental item not found' },
        { status: 404 }
      )
    }

    // Validate numbers
    if (body.pricePerDay !== undefined && body.pricePerDay < 0) {
      return NextResponse.json(
        { error: 'Price must be a positive number' },
        { status: 400 }
      )
    }

    if (body.stock !== undefined && body.stock < 0) {
      return NextResponse.json(
        { error: 'Stock must be a positive number' },
        { status: 400 }
      )
    }

    // Update rental item
    const updatedItem = await prisma.rentalItem.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.description !== undefined && {
          description: body.description,
        }),
        ...(body.pricePerDay !== undefined && {
          pricePerDay: parseFloat(body.pricePerDay),
        }),
        ...(body.weeklyDiscountPct !== undefined && {
          weeklyDiscountPct: parseFloat(body.weeklyDiscountPct),
        }),
        ...(body.monthlyDiscountPct !== undefined && {
          monthlyDiscountPct: parseFloat(body.monthlyDiscountPct),
        }),
        ...(body.depositAmount !== undefined && {
          depositAmount: body.depositAmount
            ? parseFloat(body.depositAmount)
            : null,
        }),
        ...(body.terms !== undefined && { terms: body.terms }),
        ...(body.stock !== undefined && { stock: parseInt(body.stock) }),
        ...(body.images && { images: body.images }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    })

    return NextResponse.json({ rentalItem: updatedItem })
  } catch (error) {
    console.error('Error updating rental item:', error)
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

    // Only SUPER_ADMIN can delete rental items
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    // Check if rental item exists
    const existingItem = await prisma.rentalItem.findUnique({
      where: { id },
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Rental item not found' },
        { status: 404 }
      )
    }

    // Delete rental item
    await prisma.rentalItem.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Rental item deleted successfully' })
  } catch (error) {
    console.error('Error deleting rental item:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
