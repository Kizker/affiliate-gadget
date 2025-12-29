import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/../auth'
import prisma from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    // 1. Validate user session
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Check if user is a customer
    if (session.user.role !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Only customers can checkout' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { items, notes, paymentMethod = 'MANUAL_TRANSFER' } = body

    // 3. Validate items
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    // 4. Validate cart items and fetch full data
    const validationErrors: string[] = []
    const categories = new Set<string>()
    const fullItems: any[] = []

    for (const item of items) {
      // Fetch product data
      if (item.type === 'PRODUCT' && item.productId) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        })

        if (!product || !product.isActive) {
          validationErrors.push(`Product "${item.name}" is no longer available`)
          continue
        }
        if (product.stock < item.quantity) {
          validationErrors.push(
            `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`
          )
          continue
        }
        categories.add('SPAREPART')
        fullItems.push({ ...item, product })
      }

      // Fetch rental data
      if (item.type === 'RENTAL' && item.rentalItemId) {
        const rentalItem = await prisma.rentalItem.findUnique({
          where: { id: item.rentalItemId },
        })

        if (!rentalItem || !rentalItem.isActive) {
          validationErrors.push(
            `Rental item "${item.name}" is no longer available`
          )
          continue
        }
        if (rentalItem.stock < item.quantity) {
          validationErrors.push(
            `Insufficient stock for "${rentalItem.name}". Available: ${rentalItem.stock}, Requested: ${item.quantity}`
          )
          continue
        }
        categories.add('SEWA')
        fullItems.push({ ...item, rentalItem })
      }

      // Fetch service data
      if (item.type === 'SERVICE' && item.serviceId) {
        const service = await prisma.service.findUnique({
          where: { id: item.serviceId },
          include: {
            technician: true,
          },
        })

        if (!service || !service.isActive) {
          validationErrors.push(`Service "${item.name}" is no longer available`)
          continue
        }
        categories.add('JASA')
        fullItems.push({ ...item, service })
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      )
    }

    // 5. Calculate pricing
    let subtotal = 0
    for (const item of fullItems) {
      let itemPrice = 0

      if (item.type === 'PRODUCT' && item.product) {
        itemPrice = item.product.price * item.quantity
      } else if (item.type === 'RENTAL' && item.rentalItem) {
        const days = item.rentalDays || 1
        itemPrice = item.rentalItem.pricePerDay * days * item.quantity
      } else if (item.type === 'SERVICE' && item.service) {
        itemPrice = item.service.price
      }

      subtotal += itemPrice
    }

    const tax = subtotal * 0.11 // 11% PPN
    const total = subtotal + tax

    // 6. Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // 7. Create order with items in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: session.user.id,
          technicianId: fullItems.find((item) => item.type === 'SERVICE')
            ?.service?.technicianId,
          status: 'PENDING_PAYMENT',
          subtotal,
          tax,
          total,
          notes: notes || null,
        },
      })

      // Create order items
      for (const item of fullItems) {
        let itemPrice = 0
        let itemSubtotal = 0

        if (item.type === 'PRODUCT' && item.product) {
          itemPrice = item.product.price
          itemSubtotal = itemPrice * item.quantity
        } else if (item.type === 'RENTAL' && item.rentalItem) {
          const days = item.rentalDays || 1
          itemPrice = item.rentalItem.pricePerDay * days
          itemSubtotal = itemPrice * item.quantity
        } else if (item.type === 'SERVICE' && item.service) {
          itemPrice = item.service.price
          itemSubtotal = itemPrice
        }

        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            type: item.type,
            serviceId: item.serviceId,
            productId: item.productId,
            rentalItemId: item.rentalItemId,
            quantity: item.quantity,
            rentalDays: item.rentalDays,
            price: itemPrice,
            subtotal: itemSubtotal,
          },
        })

        // Reduce stock for products
        if (item.type === 'PRODUCT' && item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          })
        }

        // Reduce stock for rentals
        if (item.type === 'RENTAL' && item.rentalItemId) {
          await tx.rentalItem.update({
            where: { id: item.rentalItemId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          })
        }
      }

      return newOrder
    })

    // 8. Fetch relevant bank accounts
    const bankAccounts = await prisma.bankAccount.findMany({
      where: {
        category: {
          in: Array.from(categories),
        },
        isActive: true,
      },
      orderBy: {
        category: 'asc',
      },
    })

    // 9. Fetch complete order with items
    const completeOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: {
            service: {
              select: {
                name: true,
                category: true,
              },
            },
            product: {
              select: {
                name: true,
                images: true,
              },
            },
            rentalItem: {
              select: {
                name: true,
                images: true,
              },
            },
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      order: completeOrder,
      bankAccounts,
    })
  } catch (error) {
    console.error('Error processing checkout:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
