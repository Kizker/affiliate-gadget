import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/../auth'
import prisma from '@/lib/db'

interface CartItem {
  type: 'PRODUCT' | 'RENTAL' | 'SERVICE'
  productId?: string
  rentalItemId?: string
  serviceId?: string
  quantity: number
  rentalDays?: number
  name?: string
}

interface ProductItem extends CartItem {
  product: {
    id: string
    name: string
    price: number
    stock: number
    isActive: boolean
  }
}

interface RentalItem extends CartItem {
  rentalItem: {
    id: string
    name: string
    pricePerDay: number
    depositAmount?: number
    stock: number
    isActive: boolean
  }
}

interface ServiceItem extends CartItem {
  service: {
    id: string
    name: string
    price: number
    isActive: boolean
    technicianId: string | null
    technician?: {
      id: string
    }
  }
}

type OrderItem = ProductItem | RentalItem | ServiceItem

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
    const { items } = body

    // 3. Validate items
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    // 4. Group items by type and validate
    const productItems: ProductItem[] = []
    const rentalItems: RentalItem[] = []
    const serviceItems: ServiceItem[] = []
    const validationErrors: string[] = []

    for (const item of items as CartItem[]) {
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
        productItems.push({ ...item, product })
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
        rentalItems.push({ ...item, rentalItem })
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
        serviceItems.push({ ...item, service })
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      )
    }

    // 5. Create separate orders for each type
    interface CreatedOrder {
      order: {
        id: string
        orderNumber: string
        status: string
        total: number
        items: unknown[]
        user: {
          name: string | null
          email: string
        }
      }
      type: 'PRODUCT' | 'RENTAL' | 'SERVICE'
    }
    const createdOrders: CreatedOrder[] = []

    // Helper function to create order
    const createOrder = async (
      orderItems: OrderItem[],
      orderType: 'PRODUCT' | 'RENTAL' | 'SERVICE',
      prefix: string
    ) => {
      if (orderItems.length === 0) return null

      // Calculate subtotal for this order
      let subtotal = 0
      for (const item of orderItems) {
        let itemPrice = 0

        if (item.type === 'PRODUCT' && item.product) {
          itemPrice = item.product.price * item.quantity
        } else if (item.type === 'RENTAL' && item.rentalItem) {
          const days = item.rentalDays || 1
          const rentalFee = item.rentalItem.pricePerDay * days * item.quantity
          const deposit = item.rentalItem.depositAmount || 0
          itemPrice = rentalFee + deposit
        } else if (item.type === 'SERVICE' && item.service) {
          itemPrice = item.service.price
        }

        subtotal += itemPrice
      }

      const total = subtotal // No tax

      // Generate order number with type prefix
      const orderNumber = `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

      // Create order in transaction
      const order = await prisma.$transaction(async (tx) => {
        const newOrder = await tx.order.create({
          data: {
            orderNumber,
            userId: session.user.id,
            technicianId:
              orderType === 'SERVICE'
                ? orderItems[0]?.service?.technicianId
                : null,
            status: 'PENDING_PAYMENT',
            subtotal,
            tax: 0,
            total,
            notes: null,
          },
        })

        // Create order items
        for (const item of orderItems) {
          let itemPrice = 0
          let itemSubtotal = 0

          if (item.type === 'PRODUCT' && item.product) {
            itemPrice = item.product.price
            itemSubtotal = itemPrice * item.quantity
          } else if (item.type === 'RENTAL' && item.rentalItem) {
            const days = item.rentalDays || 1
            const rentalFee = item.rentalItem.pricePerDay * days
            const deposit = item.rentalItem.depositAmount || 0
            itemPrice = rentalFee + deposit
            itemSubtotal = itemPrice * item.quantity
          } else if (item.type === 'SERVICE' && item.service) {
            itemPrice = item.service.price
            itemSubtotal = itemPrice
          }

          await tx.orderItem.create({
            data: {
              orderId: newOrder.id,
              type: item.type,
              serviceId: item.serviceId || null,
              productId: item.productId || null,
              rentalItemId: item.rentalItemId || null,
              quantity: item.quantity,
              rentalDays: item.rentalDays || null,
              price: itemPrice,
              subtotal: itemSubtotal,
              notes: item.notes || null,
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

      // Fetch complete order with items
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
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      })

      return { order: completeOrder, type: orderType }
    }

    // Create orders for each type
    const productOrder = await createOrder(productItems, 'PRODUCT', 'SPR')
    const rentalOrder = await createOrder(rentalItems, 'RENTAL', 'RNT')
    const serviceOrder = await createOrder(serviceItems, 'SERVICE', 'SVC')

    if (productOrder) createdOrders.push(productOrder)
    if (rentalOrder) createdOrders.push(rentalOrder)
    if (serviceOrder) createdOrders.push(serviceOrder)

    // 6. Fetch relevant bank accounts
    const categories: string[] = []
    if (productItems.length > 0) categories.push('SPAREPART')
    if (rentalItems.length > 0) categories.push('SEWA')
    if (serviceItems.length > 0) categories.push('JASA')

    const bankAccounts = await prisma.bankAccount.findMany({
      where: {
        category: {
          in: categories,
        },
        isActive: true,
      },
      orderBy: {
        category: 'asc',
      },
    })

    return NextResponse.json({
      success: true,
      orders: createdOrders,
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
