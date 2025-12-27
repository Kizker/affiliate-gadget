import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/../auth'
import prisma from '@/lib/db'

// POST - Create rental order
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { rentalItemId, duration, durationType, notes } = body

    // Validation
    if (!rentalItemId || !duration) {
      return NextResponse.json(
        { error: 'Rental item ID and duration are required' },
        { status: 400 }
      )
    }

    if (duration < 1 || duration > 365) {
      return NextResponse.json(
        { error: 'Duration must be between 1 and 365 days' },
        { status: 400 }
      )
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get rental item
    const rentalItem = await prisma.rentalItem.findUnique({
      where: { id: rentalItemId, isActive: true },
    })

    if (!rentalItem) {
      return NextResponse.json(
        { error: 'Rental item not found' },
        { status: 404 }
      )
    }

    // Check stock
    if (rentalItem.stock < 1) {
      return NextResponse.json(
        { error: 'Rental item out of stock' },
        { status: 400 }
      )
    }

    // Calculate pricing based on duration type
    const actualDays = duration
    let discount = 0
    const basePrice = rentalItem.pricePerDay * actualDays

    if (durationType === 'weekly') {
      discount = Math.round(basePrice * 0.1) // 10% discount
    } else if (durationType === 'monthly') {
      discount = Math.round(basePrice * 0.2) // 20% discount
    }

    const subtotal = basePrice - discount
    const deposit = rentalItem.pricePerDay * 10
    const totalPrice = subtotal + deposit

    // Generate order number (RNT-YYYYMMDD-XXXX)
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const randomNum = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0')
    const orderNumber = `RNT-${dateStr}-${randomNum}`

    // Create order with transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: user.id,
          subtotal: subtotal,
          tax: 0,
          total: totalPrice,
          status: 'PENDING_PAYMENT',
          notes: notes || null,
          items: {
            create: {
              type: 'RENTAL',
              rentalItemId: rentalItem.id,
              quantity: 1,
              rentalDays: actualDays,
              price: rentalItem.pricePerDay,
              subtotal: subtotal,
            },
          },
        },
        include: {
          items: {
            include: {
              rentalItem: true,
            },
          },
        },
      })

      // Reduce rental item stock
      await tx.rentalItem.update({
        where: { id: rentalItemId },
        data: {
          stock: {
            decrement: 1,
          },
        },
      })

      return newOrder
    })

    return NextResponse.json({
      message: 'Rental order created successfully',
      orderId: order.id,
      orderNumber: order.orderNumber,
    })
  } catch (error) {
    console.error('Error creating rental order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
