import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// POST - Create sparepart order
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { productId, quantity, notes } = body

    // Validation
    if (!productId || !quantity) {
      return NextResponse.json(
        { error: 'Product ID and quantity are required' },
        { status: 400 }
      )
    }

    if (quantity < 1) {
      return NextResponse.json(
        { error: 'Quantity must be at least 1' },
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

    // Get product
    const product = await prisma.product.findUnique({
      where: { id: productId, isActive: true },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check stock
    if (product.stock < quantity) {
      return NextResponse.json(
        { error: `Insufficient stock. Available: ${product.stock}` },
        { status: 400 }
      )
    }

    // Calculate total
    const totalPrice = product.price * quantity

    // Generate order number (SP-YYYYMMDD-XXXX)
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const randomNum = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0')
    const orderNumber = `SP-${dateStr}-${randomNum}`

    // Create order with transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: user.id,
          storeId: product.storeId || null,
          subtotal: totalPrice,
          tax: 0,
          total: totalPrice,
          status: 'PENDING_PAYMENT',
          notes: notes || null,
          items: {
            create: {
              type: 'PRODUCT',
              productId: product.id,
              quantity,
              price: product.price,
              subtotal: product.price * quantity,
            },
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      })

      // Reduce product stock
      await tx.product.update({
        where: { id: productId },
        data: {
          stock: {
            decrement: quantity,
          },
        },
      })

      // Create admin chat room for this order
      await tx.adminChatRoom.create({
        data: {
          customerId: user.id,
          orderId: newOrder.id,
        },
      })

      return newOrder
    })

    return NextResponse.json({
      message: 'Order created successfully',
      orderId: order.id,
      orderNumber: order.orderNumber,
    })
  } catch (error) {
    console.error('Error creating sparepart order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
