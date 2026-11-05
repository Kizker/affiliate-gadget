import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

import { isAdminStaffRole } from '@/lib/dashboard-utils'

// GET - Get all admin chat rooms
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin or staff
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, storeId: true },
    })

    if (!user || !isAdminStaffRole(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Clean up abandoned empty rooms in background without blocking response
    prisma.adminChatRoom
      .deleteMany({
        where: {
          messages: { none: {} },
          createdAt: { lt: new Date(Date.now() - 30 * 1000) },
        },
      })
      .catch(() => {})

    // Build where clause
    // Only return rooms that actually have messages (non-empty rooms)
    let whereClause: Record<string, unknown>

    if (user.role === 'STORE_ADMIN' || user.role === 'STORE_SALES') {
      let effectiveStoreId = user.storeId
      if (!effectiveStoreId) {
        const storeByEmail = await prisma.store.findFirst({
          where: { email: session.user.email || undefined },
          select: { id: true },
        })
        if (storeByEmail) {
          effectiveStoreId = storeByEmail.id
          await prisma.user
            .update({
              where: { id: session.user.id },
              data: { storeId: storeByEmail.id },
            })
            .catch(() => {})
        }
      }

      if (effectiveStoreId) {
        whereClause = {
          messages: { some: {} },
          OR: [
            // Rooms direct chat dengan toko cabang ini
            { storeId: effectiveStoreId },
            // Rooms terkait order di toko ini
            { order: { storeId: effectiveStoreId } },
            // Rooms terkait order dengan item produk dari toko ini
            {
              order: {
                items: { some: { product: { storeId: effectiveStoreId } } },
              },
            },
            // Rooms yang di-claim admin ini untuk tokonya
            { claimedById: session.user.id, storeId: effectiveStoreId },
            // Rooms bantuan admin toko ini langsung ke Superadmin
            { customerId: session.user.id, storeId: null },
          ],
          NOT: [
            // Isolasi Purna Jual: Percakapan retur, komplain, dan pertukaran barang TIDAK masuk ke Admin Toko
            { order: { returnRequests: { some: {} } } },
            { order: { complaints: { some: {} } } },
            { messages: { some: { messageType: 'return_reference' } } },
            {
              messages: { some: { content: { contains: 'return_reference' } } },
            },
            { claimedBy: { role: 'AFTER_SALES' } },
          ],
        }
      } else {
        // Toko admin belum terhubung ke cabang fisik: HANYA lihat bantuan langsung ke Superadmin
        whereClause = {
          messages: { some: {} },
          customerId: session.user.id,
          storeId: null,
          NOT: [
            {
              order: {
                returnRequests: {
                  some: {
                    status: { in: ['PENDING', 'IN_REVIEW', 'APPROVED'] },
                  },
                },
              },
            },
            {
              order: {
                complaints: {
                  some: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
                },
              },
            },
            { messages: { some: { messageType: 'return_reference' } } },
          ],
        }
      }
    } else if (user.role === 'AFTER_SALES') {
      // Find the group managed by this After Sales user
      const group = await prisma.storeGroup.findFirst({
        where: { afterSalesUserId: session.user.id },
        include: { stores: { select: { id: true } } },
      })
      const storeIds = group?.stores.map((s) => s.id) || []

      const storeScope =
        storeIds.length > 0
          ? {
              OR: [
                { storeId: { in: storeIds } },
                { order: { storeId: { in: storeIds } } },
                {
                  order: {
                    items: {
                      some: { product: { storeId: { in: storeIds } } },
                    },
                  },
                },
              ],
            }
          : {}

      whereClause = {
        messages: { some: {} },
        OR: [
          // 1. Seluruh percakapan yang memiliki permohonan retur / penukaran barang
          {
            order: {
              returnRequests: { some: {} },
            },
            ...storeScope,
          },
          // 2. Percakapan dengan pesan kartu referensi retur
          {
            messages: {
              some: {
                OR: [
                  { messageType: 'return_reference' },
                  { content: { contains: 'return_reference' } },
                ],
              },
            },
            ...storeScope,
          },
          // 3. Percakapan dengan aduan komplain purna jual
          {
            order: {
              complaints: { some: {} },
            },
            ...storeScope,
          },
          // 4. Percakapan pesanan selesai (COMPLETED) untuk toko dalam grup
          ...(storeIds.length > 0
            ? [
                {
                  order: {
                    status: 'COMPLETED',
                    OR: [
                      { storeId: { in: storeIds } },
                      {
                        items: {
                          some: { product: { storeId: { in: storeIds } } },
                        },
                      },
                    ],
                  },
                },
              ]
            : []),
          // 5. Percakapan yang di-claim oleh user After Sales ini
          { claimedById: session.user.id },
          // 6. Percakapan yang di-claim oleh role AFTER_SALES
          { claimedBy: { role: 'AFTER_SALES' }, ...storeScope },
        ],
      }
    } else if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
      // Superadmin / Platform Admin dapat melihat seluruh chat platform termasuk CS { storeId: null }
      whereClause = {
        messages: { some: {} },
      }
    } else {
      whereClause = {
        messages: { some: {} },
        claimedById: session.user.id,
      }
    }

    // Fetch admin chat rooms with customer info, order info, and store info
    const rooms = await prisma.adminChatRoom.findMany({
      where: whereClause,
      include: {
        store: {
          select: {
            id: true,
            name: true,
            companyName: true,
            phone: true,
            city: true,
            logo: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            phone: true,
            role: true,
            store: {
              select: {
                id: true,
                name: true,
                city: true,
              },
            },
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            createdAt: true,
            store: {
              select: {
                id: true,
                name: true,
                companyName: true,
                city: true,
                phone: true,
              },
            },
            items: {
              include: {
                product: {
                  select: { name: true, images: true },
                },
                rentalItem: {
                  select: { name: true, images: true },
                },
                service: {
                  select: { name: true },
                },
              },
            },
            returnRequests: {
              select: {
                id: true,
                status: true,
                reason: true,
                reasonLabel: true,
                type: true,
              },
            },
          },
        },
        claimedBy: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            content: true,
            createdAt: true,
            senderId: true,
            messageType: true,
          },
        },
        _count: {
          select: {
            messages: {
              where: {
                isRead: false,
                senderId: { not: session.user.id },
              },
            },
          },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    })

    const enrichedRooms = rooms.map((room) => {
      const isStoreHelpToSuperAdmin =
        room.customerId === session.user.id && room.storeId === null

      const isCompletedHandover = room.order?.status === 'COMPLETED'
      const isStoreAdminUser =
        room.customer.role === 'STORE_ADMIN' ||
        room.customer.role === 'STORE_SALES'

      return {
        ...room,
        isStoreHelpToSuperAdmin,
        isStoreAdminUser,
      }
    })

    // Deduplikasi defensif: 1 Pelanggan + 1 Toko/CS = 1 Unified Chat Room di antarmuka
    const seenRoomKeys = new Set<string>()
    const deduplicatedRooms: typeof enrichedRooms = []

    for (const room of enrichedRooms) {
      const key = `${room.customerId}_${room.storeId || 'CS'}`
      if (!seenRoomKeys.has(key)) {
        seenRoomKeys.add(key)
        deduplicatedRooms.push(room)
      }
    }

    // Get stats
    const totalRooms = deduplicatedRooms.length
    const unreadRooms = deduplicatedRooms.filter(
      (r) => r._count.messages > 0
    ).length

    return NextResponse.json({
      rooms: deduplicatedRooms,
      stats: { totalRooms, unreadRooms },
    })
  } catch (error) {
    console.error('Error fetching admin chat rooms:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new admin chat room
export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin or staff
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, storeId: true },
    })

    if (!user || !isAdminStaffRole(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const {
      customerId,
      orderId,
      returnId,
      returnReason,
      returnStatus,
      returnType,
    } = await request.json()

    let effectiveCustomerId = customerId
    let orderStoreId: string | null = null
    let fullOrder: any = null

    if (orderId) {
      fullOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  brand: true,
                  images: true,
                  storeId: true,
                },
              },
            },
          },
          returnRequests: {
            orderBy: { createdAt: 'desc' },
          },
          store: {
            select: {
              id: true,
              name: true,
              companyName: true,
              phone: true,
              city: true,
              logo: true,
            },
          },
        },
      })

      if (fullOrder) {
        if (!effectiveCustomerId) {
          effectiveCustomerId = fullOrder.userId
        }
        orderStoreId =
          fullOrder.storeId ||
          fullOrder.items.find((i: any) => i.product?.storeId)?.product
            ?.storeId ||
          null

        // STORE_ADMIN: validasi bahwa order yang di-chat adalah milik tokonya
        if (user.role === 'STORE_ADMIN' && user.storeId) {
          const belongsToThisStore =
            fullOrder.storeId === user.storeId ||
            fullOrder.items.some(
              (i: any) => i.product?.storeId === user.storeId
            )

          if (!belongsToThisStore) {
            return NextResponse.json(
              { error: 'Pesanan ini bukan milik toko Anda' },
              { status: 403 }
            )
          }
        }
      }
    }

    if (!effectiveCustomerId) {
      return NextResponse.json(
        { error: 'Customer ID required' },
        { status: 400 }
      )
    }

    const targetStoreId = user.storeId || orderStoreId || null

    // 1. Unified Room: Cek apakah room sudah pernah dibuat untuk customer ini di toko terkait
    let room = await prisma.adminChatRoom.findFirst({
      where: {
        customerId: effectiveCustomerId,
        ...(targetStoreId
          ? {
              OR: [
                { storeId: targetStoreId },
                { order: { storeId: targetStoreId } },
                ...(orderId ? [{ orderId: orderId }] : []),
              ],
            }
          : orderId
            ? { orderId: orderId }
            : { storeId: null }),
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            companyName: true,
            phone: true,
            city: true,
            logo: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            items: {
              include: {
                product: {
                  select: { name: true, images: true, brand: true },
                },
              },
            },
          },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    })

    // Fallback khusus role AFTER_SALES: jika belum menemukan room, cari di toko-toko dalam grup After Sales
    if (!room && user.role === 'AFTER_SALES') {
      const group = await prisma.storeGroup.findFirst({
        where: { afterSalesUserId: session.user.id },
        include: { stores: { select: { id: true } } },
      })
      const groupStoreIds = group?.stores.map((s) => s.id) || []
      if (groupStoreIds.length > 0) {
        room = await prisma.adminChatRoom.findFirst({
          where: {
            customerId: effectiveCustomerId,
            OR: [
              { storeId: { in: groupStoreIds } },
              { order: { storeId: { in: groupStoreIds } } },
              { claimedById: session.user.id },
            ],
          },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            store: {
              select: {
                id: true,
                name: true,
                companyName: true,
                phone: true,
                city: true,
                logo: true,
              },
            },
            order: {
              select: {
                id: true,
                orderNumber: true,
                status: true,
                total: true,
                items: {
                  include: {
                    product: {
                      select: { name: true, images: true, brand: true },
                    },
                  },
                },
              },
            },
          },
          orderBy: { lastMessageAt: 'desc' },
        })
      }
    }

    if (room) {
      // Update context if changing order or claiming room
      const updates: any = {}
      if (orderId && room.orderId !== orderId) {
        updates.orderId = orderId
      }
      if (targetStoreId && !room.storeId) {
        updates.storeId = targetStoreId
      }
      if (!room.claimedById || user.role === 'AFTER_SALES') {
        updates.claimedById = session.user.id
        updates.claimedAt = new Date()
      }

      if (Object.keys(updates).length > 0) {
        try {
          room = await prisma.adminChatRoom.update({
            where: { id: room.id },
            data: updates,
            include: {
              customer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
              store: {
                select: {
                  id: true,
                  name: true,
                  companyName: true,
                  phone: true,
                  city: true,
                  logo: true,
                },
              },
              order: {
                select: {
                  id: true,
                  orderNumber: true,
                  status: true,
                  total: true,
                  items: {
                    include: {
                      product: {
                        select: { name: true, images: true, brand: true },
                      },
                    },
                  },
                },
              },
            },
          })
        } catch (updateErr) {
          console.warn(
            'Non-fatal error updating admin chat room context:',
            updateErr
          )
        }
      }
    } else {
      // 2. No room exists -> create new room
      room = await prisma.adminChatRoom.create({
        data: {
          customerId: effectiveCustomerId,
          storeId: targetStoreId,
          orderId: orderId || null,
          claimedById: session.user.id,
          claimedAt: new Date(),
          lastMessageAt: new Date(),
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          store: {
            select: {
              id: true,
              name: true,
              companyName: true,
              phone: true,
              city: true,
              logo: true,
            },
          },
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              total: true,
              items: {
                include: {
                  product: {
                    select: { name: true, images: true, brand: true },
                  },
                },
              },
            },
          },
        },
      })
    }

    // 3. Bidirectional Return Inquiry: Pastikan bubble kartu retur (return_reference) terbuat di room jika belum ada
    const isReturnInquiry = Boolean(
      returnId ||
      returnReason ||
      (fullOrder?.returnRequests && fullOrder.returnRequests.length > 0)
    )

    if (isReturnInquiry && fullOrder && room) {
      const retReq = returnId
        ? await prisma.returnRequest.findUnique({ where: { id: returnId } })
        : fullOrder.returnRequests?.[0]

      const hasReturnMsg = await prisma.adminChatMessage.findFirst({
        where: {
          roomId: room.id,
          messageType: 'return_reference',
          OR: [
            { content: { contains: fullOrder.orderNumber } },
            ...(retReq?.id ? [{ content: { contains: retReq.id } }] : []),
            ...(returnId ? [{ content: { contains: returnId } }] : []),
          ],
        },
      })

      if (!hasReturnMsg) {
        const firstItem = fullOrder.items?.[0]
        const prod = firstItem?.product
        const refProductName = prod?.name || 'Produk Pesanan'
        const refProductPrice = firstItem?.price || fullOrder.total
        const refProductImage =
          (Array.isArray(prod?.images) && prod.images[0]) || null
        const refBrand = prod?.brand || null
        const effectiveReason =
          returnReason ||
          retReq?.reasonLabel ||
          retReq?.reason ||
          'Klaim Garansi / Retur'
        const effectiveStatus = returnStatus || retReq?.status || 'PENDING'
        const effectiveType = returnType || retReq?.type || 'REFUND'

        const payload = {
          type: 'return_reference',
          orderId: fullOrder.id,
          orderNumber: fullOrder.orderNumber,
          productId: prod?.id || null,
          productName: refProductName,
          productPrice: refProductPrice,
          productImage: refProductImage,
          brand: refBrand,
          orderTotal: fullOrder.total,
          returnId: retReq?.id || returnId || null,
          returnReason: effectiveReason,
          returnStatus: effectiveStatus,
          returnType: effectiveType,
          note:
            retReq?.description ||
            'Pengajuan komplain / retur barang dari pembeli.',
        }

        await prisma.adminChatMessage.create({
          data: {
            roomId: room.id,
            senderId: effectiveCustomerId, // Dikirim atas nama inkuiri retur pembeli (bubble kiri di admin)
            content: JSON.stringify(payload),
            messageType: 'return_reference',
            isRead: false,
          },
        })

        await prisma.adminChatRoom.update({
          where: { id: room.id },
          data: {
            lastMessageAt: new Date(),
            claimedById: session.user.id,
            claimedAt: new Date(),
          },
        })
      }
    }

    return NextResponse.json({ room, roomId: room.id }, { status: 200 })
  } catch (error) {
    console.error('Error creating admin chat room:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
