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
      orderNumber,
      returnId,
      returnReason,
      returnStatus,
      returnType,
      storeId: reqStoreId,
      productId,
      productName,
      productPrice,
      variantName,
      productImage,
      isCs: reqIsCs,
      type: reqType,
    } = body
    let storeId = reqStoreId
    const isCs =
      reqIsCs === true ||
      reqType === 'cs' ||
      reqStoreId === 'superadmin' ||
      reqStoreId === 'cs'

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
          returnRequests: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      })

      if (resolvedOrder?.storeId && !storeId) {
        storeId = resolvedOrder.storeId
      }
    }

    // Direct CS Chat to Superadmin (Platform Level Support)
    if (isCs) {
      const superAdmin = await prisma.user.findFirst({
        where: {
          role: 'SUPER_ADMIN',
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      })

      let room = await prisma.adminChatRoom.findFirst({
        where: {
          customerId: session.user.id,
          storeId: null,
        },
        orderBy: { lastMessageAt: 'desc' },
      })

      const isNew = !room

      if (!room) {
        room = await prisma.adminChatRoom.create({
          data: {
            customerId: session.user.id,
            storeId: null,
            orderId: orderId || null,
            claimedById: superAdmin?.id || null,
            claimedAt: superAdmin ? new Date() : null,
            lastMessageAt: new Date(),
          } as any,
        })
      } else if (orderId && room.orderId !== orderId) {
        room = await prisma.adminChatRoom.update({
          where: { id: room.id },
          data: {
            orderId,
            lastMessageAt: new Date(),
          },
        })
      }

      const messages = await prisma.adminChatMessage.findMany({
        where: { roomId: room.id },
        select: {
          id: true,
          content: true,
          messageType: true,
          mediaUrl: true,
          mediaType: true,
          isRead: true,
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

      const csStore = {
        id: 'superadmin',
        name: 'Customer Service (Superadmin)',
        companyName: 'Pusat Bantuan CS Platform',
        phone: '0812-3456-7890',
        city: 'Kantor Pusat',
        logo: null,
        isActive: true,
        isCs: true,
        schedules: [
          {
            day: 'Senin - Minggu',
            openTime: '08:00',
            closeTime: '22:00',
            isClosed: false,
          },
        ],
      }

      return NextResponse.json({
        roomId: room.id,
        store: csStore,
        claimedBy: superAdmin
          ? {
              id: superAdmin.id,
              name: superAdmin.name,
              email: superAdmin.email,
              image: superAdmin.image,
            }
          : null,
        orderId: room.orderId || (resolvedOrder ? resolvedOrder.id : null),
        order: resolvedOrder
          ? {
              id: resolvedOrder.id,
              orderNumber: resolvedOrder.orderNumber,
              status: resolvedOrder.status,
              total: resolvedOrder.total,
              items: resolvedOrder.items,
              returnRequests: resolvedOrder.returnRequests || [],
            }
          : null,
        isNew,
        messages,
      })
    }

    if (!storeId || typeof storeId !== 'string') {
      return NextResponse.json(
        { error: 'Store ID or valid Order ID required' },
        { status: 400 }
      )
    }

    // Verify store exists (support ID or Slug)
    const store =
      (resolvedOrder?.storeId === storeId ? resolvedOrder.store : null) ||
      (await prisma.store.findFirst({
        where: {
          OR: [{ id: storeId }, { slug: storeId }],
        },
        select: {
          id: true,
          name: true,
          companyName: true,
          phone: true,
          city: true,
          logo: true,
          isActive: true,
          schedules: {
            select: {
              day: true,
              openTime: true,
              closeTime: true,
              isClosed: true,
            },
          },
        },
      }))

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }
    storeId = store.id

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

    // Prepare order / return reference payload if order context is active
    const effectiveOrderNumber =
      resolvedOrder?.orderNumber || orderNumber || null
    const latestReturn = resolvedOrder?.returnRequests?.[0] || null
    const effectiveReturnReason =
      latestReturn?.reasonLabel || latestReturn?.reason || returnReason || null
    const effectiveReturnStatus =
      latestReturn?.status || returnStatus || 'PENDING'
    const effectiveReturnType = latestReturn?.type || returnType || 'REFUND'
    const effectiveReturnId = latestReturn?.id || returnId || null
    const isReturnInquiry = Boolean(
      effectiveReturnId || effectiveReturnReason || returnReason
    )
    const isOrderInquiry = Boolean(orderId || effectiveOrderNumber)

    const firstItem = resolvedOrder?.items?.[0]
    const firstProduct = firstItem?.product
    const refProductName =
      firstProduct?.name || resolvedProductName || 'Produk Gadget'
    const refProductPrice = firstItem?.price || resolvedProductPrice || 0
    const refProductImage =
      (Array.isArray(firstProduct?.images) && firstProduct.images[0]) ||
      resolvedProductImage ||
      null
    const refBrand = firstProduct?.brand || resolvedBrand || null
    const refMessageType = isReturnInquiry
      ? 'return_reference'
      : 'order_reference'

    const orderReferencePayload = isOrderInquiry
      ? {
          type: refMessageType,
          orderId: resolvedOrder?.id || orderId,
          orderNumber: effectiveOrderNumber,
          productId: firstProduct?.id || productId || dbProduct?.id || null,
          productName: refProductName,
          productPrice: refProductPrice,
          productImage: refProductImage,
          brand: refBrand,
          variantName: variantName || null,
          orderTotal: resolvedOrder?.total || null,
          ...(isReturnInquiry
            ? {
                returnId: effectiveReturnId,
                returnReason: effectiveReturnReason,
                returnStatus: effectiveReturnStatus,
                returnType: effectiveReturnType,
              }
            : {
                orderStatus: resolvedOrder?.status || null,
              }),
        }
      : null

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

    // Customer + Store = SINGLE CHAT ROOM
    // Find existing chat room between this customer and this store
    let room = await prisma.adminChatRoom.findFirst({
      where: {
        customerId: session.user.id,
        storeId: store.id,
      },
      orderBy: { lastMessageAt: 'desc' },
    })

    const isNew = !room

    if (!room) {
      // Create new direct room connected with store admin
      room = await prisma.adminChatRoom.create({
        data: {
          customerId: session.user.id,
          storeId: store.id,
          orderId: orderId || null,
          claimedById: storeAdmin?.id || null,
          claimedAt: storeAdmin ? new Date() : null,
          lastMessageAt: new Date(),
        } as any,
      })
    } else {
      // If customer asks about another order from the same store, update orderId to the latest order context
      const updates: any = {}
      if (orderId && room.orderId !== orderId) {
        updates.orderId = orderId
        updates.lastMessageAt = new Date()
      }
      if (!room.claimedById && storeAdmin) {
        updates.claimedById = storeAdmin.id
        updates.claimedAt = new Date()
      }

      if (Object.keys(updates).length > 0) {
        room = await prisma.adminChatRoom.update({
          where: { id: room.id },
          data: updates,
        })
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
        isRead: true,
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
      order: resolvedOrder
        ? {
            id: resolvedOrder.id,
            orderNumber: resolvedOrder.orderNumber,
            status: resolvedOrder.status,
            total: resolvedOrder.total,
            items: resolvedOrder.items,
            returnRequests: resolvedOrder.returnRequests || [],
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
