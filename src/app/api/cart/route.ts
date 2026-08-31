import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// GET /api/cart - Fetch user's cart
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find or create cart for user
    let cart = await prisma.cart.findFirst({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                images: true,
                stock: true,
                variants: true,
              },
            },
            rentalItem: {
              select: {
                id: true,
                name: true,
                pricePerDay: true,
                images: true,
                stock: true,
              },
            },
            service: {
              select: {
                id: true,
                name: true,
                minPrice: true,
                maxPrice: true,
                category: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!cart) {
      // Create empty cart if not exists
      cart = await prisma.cart.create({
        data: { userId: session.user.id },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  images: true,
                  stock: true,
                  variants: true,
                },
              },
              rentalItem: {
                select: {
                  id: true,
                  name: true,
                  pricePerDay: true,
                  images: true,
                  stock: true,
                },
              },
              service: {
                select: {
                  id: true,
                  name: true,
                  minPrice: true,
                  maxPrice: true,
                  category: true,
                },
              },
            },
          },
        },
      })
    }

    // Transform items to match client-side CartItem format with variant awareness
    const items = cart.items.map((item) => {
      const variant =
        item.variantId && item.product?.variants
          ? item.product.variants.find((v) => v.id === item.variantId)
          : null

      const name = variant
        ? `${item.product?.name} (${variant.name})`
        : item.product?.name ||
          item.rentalItem?.name ||
          item.service?.name ||
          'Unknown'

      const price = variant
        ? variant.price
        : item.product?.price ||
          item.rentalItem?.pricePerDay ||
          item.service?.minPrice ||
          0

      const stock = variant
        ? variant.stock
        : item.product?.stock || item.rentalItem?.stock || null

      return {
        id: item.id,
        type: item.type,
        productId: item.productId,
        variantId: item.variantId || undefined,
        variantName: variant?.name || undefined,
        rentalItemId: item.rentalItemId,
        serviceId: item.serviceId,
        quantity: item.quantity,
        rentalDays: item.rentalDays,
        name,
        price,
        image: item.product?.images?.[0] || item.rentalItem?.images?.[0] || null,
        stock,
      }
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error fetching cart:', error)
    return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 })
  }
}

// POST /api/cart - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      type,
      productId,
      variantId,
      rentalItemId,
      serviceId,
      quantity = 1,
      rentalDays,
    } = body

    if (!type || (!productId && !rentalItemId && !serviceId)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Find or create cart
    let cart = await prisma.cart.findFirst({
      where: { userId: session.user.id },
    })

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: session.user.id },
      })
    }

    // Check if item with same variant already exists
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        type,
        productId: productId || null,
        variantId: variantId || null,
        rentalItemId: rentalItemId || null,
        serviceId: serviceId || null,
      },
    })

    if (existingItem) {
      // Update quantity
      const updatedItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      })
      return NextResponse.json({ item: updatedItem, action: 'updated' })
    } else {
      // Create new item
      const newItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          type,
          productId: productId || null,
          variantId: variantId || null,
          rentalItemId: rentalItemId || null,
          serviceId: serviceId || null,
          quantity,
          rentalDays: rentalDays || null,
        },
      })
      return NextResponse.json({ item: newItem, action: 'added' })
    }
  } catch (error) {
    console.error('Error adding to cart:', error)
    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 }
    )
  }
}

// DELETE /api/cart - Clear entire cart
export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cart = await prisma.cart.findFirst({
      where: { userId: session.user.id },
    })

    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error clearing cart:', error)
    return NextResponse.json({ error: 'Failed to clear cart' }, { status: 500 })
  }
}
