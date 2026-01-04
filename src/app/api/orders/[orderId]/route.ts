import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await params

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        items: {
          select: {
            id: true,
            type: true,
            quantity: true,
            price: true,
            subtotal: true,
            finalPrice: true,
            rentalDays: true,
            service: {
              select: {
                name: true,
                category: true,
                minPrice: true,
                maxPrice: true,
              },
            },
            product: {
              select: {
                id: true,
                name: true,
                images: true,
                price: true,
              },
            },
            rentalItem: {
              select: {
                id: true,
                name: true,
                images: true,
                pricePerDay: true,
                depositAmount: true,
              },
            },
          },
        },
        technician: {
          include: {
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check if user owns this order OR is the assigned technician
    const isOwner = order.userId === session.user.id
    const isAssignedTechnician = order.technician?.userId === session.user.id // assuming technician relation includes user

    // Note: We need to ensure we selected technician.userId in the query above
    // The previous query included technician: { include: { user: { select: ... } } }
    // We should probably explicitly select technician.userId or rely on Prisma relation if it was fetched.
    // Actually, let's simplify. We can check if the session user is a technician and if this order has their ID.
    // Better yet, just check if the relation matches.

    // Let's rely on technician.userId if available.
    // Wait, the include above `technician: { include: { user: ... } }` assumes `technician` object exists.
    // `technician` model usually has `userId`.

    // Re-checking the include:
    // technician: { include: { user: { select: { name: true, phone: true } } } }
    // This returns the technician object. We can access `order.technician?.userId`.

    // However, Prisma `include` doesn't automatically exclude scalars unless `select` is used.
    // `include` was used for `technician`, so scalars like `userId` on `technician` should be present.
    // Let's verify `order.technician` scalar fields are returned.
    // Yes, `include` adds to default selection.

    // Wait, `order.technician` is a relation. `order.technicianId` is on `Order`.
    // We can also check `order.technician?.userId`.

    if (
      !isOwner &&
      !isAssignedTechnician &&
      session.user.role !== 'ADMIN' &&
      session.user.role !== 'SUPER_ADMIN'
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Cache for 30 seconds - order data is personal but can be cached briefly
    return NextResponse.json(
      { order },
      {
        headers: {
          'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
