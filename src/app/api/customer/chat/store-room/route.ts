import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// POST - Create or get direct chat room with a store
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      orderId,
      storeId: reqStoreId,
      productId,
      productName,
      productPrice,
      variantName,
      productImage,
    } = body
    let storeId = reqStoreId

    // If orderId is provided, look up the order and its store
    let resolvedOrder: any = null
    if (orderId && typeof orderId === 'string') {
      resolvedOrder = await prisma.order.findFirst({
        where: {
          id: orderId,
          userId: session.user.id,
        },
        include: {
          store: {
            select: {
              id: true,
              name: true,
              companyName: true,
              phone: true,
              city: true,
              logo: true,
              isActive: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  brand: true,
                  images: true,
                },
              },
            },
          },
        },
      })

      if (resolvedOrder?.storeId && !storeId) {
        storeId = resolvedOrder.storeId
      }
    }

    if (!storeId || typeof storeId !== 'string') {
      return NextResponse.json(
        { error: 'Store ID or valid Order ID required' },
        { status: 400 }
      )
    }

    // Verify store exists
    const store =
      (resolvedOrder?.storeId === storeId ? resolvedOrder.store : null) ||
      (await prisma.store.findUnique({
        where: { id: storeId },
        select: {
          id: true,
          name: true,
          companyName: true,
          phone: true,
          city: true,
          logo: true,
          isActive: true,
        },
      }))

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Look up product from DB if productId is provided for richest data
    let dbProduct: {
      id: string
      name: string
      price: number
      brand: string | null
      images: string[]
    } | null = null
    if (productId && typeof productId === 'string') {
      dbProduct = await prisma.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          name: true,
          price: true,
          brand: true,
          images: true,
        },
      })
    }

    const resolvedProductName = productName || dbProduct?.name || ''
    const resolvedProductPrice = Number(productPrice) || dbProduct?.price || 0
    const resolvedProductImage =
      (typeof productImage === 'string' && productImage.trim() !== ''
        ? productImage
        : null) ||
      (Array.isArray(dbProduct?.images) && dbProduct.images.length > 0
        ? dbProduct.images[0]
        : null)
    const resolvedBrand = dbProduct?.brand || null

    // Find active store admin for this store to automatically connect the chat room
    const storeAdmin = await prisma.user.findFirst({
      where: {
        storeId: store.id,
        role: 'STORE_ADMIN',
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    })

    // Find existing chat room: first check if a room exists for this specific order
    let room = orderId
      ? await prisma.adminChatRoom.findFirst({
          where: {
            customerId: session.user.id,
            orderId: orderId,
          } as any,
        })
      : null

    // If no order-specific room, check direct chat room between this customer and this store (orderId = null)
    if (!room) {
      room = await prisma.adminChatRoom.findFirst({
        where: {
          customerId: session.user.id,
          storeId: store.id,
          orderId: null,
        } as any,
      })
    }

    const isNew = !room

    if (!room) {
      // Create new direct room with product reference as first message if provided
      room = await prisma.$transaction(async (tx) => {
        const createdRoom = await tx.adminChatRoom.create({
          data: {
            customerId: session.user.id,
            storeId: store.id,
            claimedById: storeAdmin?.id || null,
            claimedAt: storeAdmin ? new Date() : null,
            lastMessageAt: new Date(),
          } as any,
        })

        if (productId || resolvedProductName) {
          await tx.adminChatMessage.create({
            data: {
              roomId: createdRoom.id,
              senderId: session.user.id,
              content: JSON.stringify({
                type: 'product_reference',
                productId: productId || dbProduct?.id || null,
                productName: resolvedProductName || 'Produk Gadget',
                productPrice: resolvedProductPrice,
                productImage: resolvedProductImage,
                brand: resolvedBrand,
                variantName: variantName || null,
              }),
              messageType: 'product_reference',
            },
          })
        }

        return createdRoom
      })
    } else {
      // If room exists but not yet assigned to store admin, auto-connect
      if (!room.claimedById && storeAdmin) {
        room = await prisma.adminChatRoom.update({
          where: { id: room.id },
          data: {
            claimedById: storeAdmin.id,
            claimedAt: new Date(),
          },
        })
      }
      // Existing room: check if we should post a new product reference message
      if (productId || resolvedProductName) {
        const lastMessage = await prisma.adminChatMessage.findFirst({
          where: { roomId: room.id },
          orderBy: { createdAt: 'desc' },
        })

        let isDuplicate = false
        if (lastMessage && lastMessage.messageType === 'product_reference') {
          try {
            const parsed = JSON.parse(lastMessage.content)
            const sameProduct = productId
              ? parsed.productId === productId
              : Boolean(
                  resolvedProductName &&
                  parsed.productName === resolvedProductName
                )
            const sameVariant =
              (parsed.variantName || null) === (variantName || null)
            if (sameProduct && sameVariant) {
              isDuplicate = true
            }
          } catch {
            isDuplicate = false
          }
        }

        if (!isDuplicate) {
          await prisma.$transaction([
            prisma.adminChatMessage.create({
              data: {
                roomId: room.id,
                senderId: session.user.id,
                content: JSON.stringify({
                  type: 'product_reference',
                  productId: productId || dbProduct?.id || null,
                  productName: resolvedProductName || 'Produk Gadget',
                  productPrice: resolvedProductPrice,
                  productImage: resolvedProductImage,
                  brand: resolvedBrand,
                  variantName: variantName || null,
                }),
                messageType: 'product_reference',
              },
            }),
            prisma.adminChatRoom.update({
              where: { id: room.id },
              data: { lastMessageAt: new Date() },
            }),
          ])
        }
      }
    }

    // Fetch all messages for this room to return directly (avoiding extra client roundtrip)
    const messages = await prisma.adminChatMessage.findMany({
      where: { roomId: room.id },
      select: {
        id: true,
        content: true,
        messageType: true,
        mediaUrl: true,
        mediaType: true,
        createdAt: true,
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({
      roomId: room.id,
      store: {
        id: store.id,
        name: store.name,
        companyName: store.companyName,
        phone: store.phone,
        city: store.city,
        logo: store.logo,
      },
      claimedBy: storeAdmin
        ? {
            id: storeAdmin.id,
            name: storeAdmin.name,
            email: storeAdmin.email,
            image: storeAdmin.image,
          }
        : null,
      orderId: room.orderId || (resolvedOrder ? resolvedOrder.id : null),
      order:
        room.orderId && resolvedOrder
          ? {
              id: resolvedOrder.id,
              orderNumber: resolvedOrder.orderNumber,
              status: resolvedOrder.status,
              total: resolvedOrder.total,
              items: resolvedOrder.items,
            }
          : null,
      isNew,
      messages,
    })
  } catch (error) {
    console.error('Error opening store chat room:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
