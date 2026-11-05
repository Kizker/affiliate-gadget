import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// GET - Search and list customer's orders strictly scoped to active store/group context
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const storeId = searchParams.get('storeId')
    const isAfterSales = searchParams.get('isAfterSales') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20')

    let allowedStoreIds: string[] = []

    if (storeId) {
      if (isAfterSales) {
        // Jika purna jual: cari grup toko dari toko ini
        const storeWithGroup = await prisma.store.findUnique({
          where: { id: storeId },
          include: {
            group: {
              include: {
                stores: { select: { id: true } },
              },
            },
          },
        })

        if (
          storeWithGroup?.group?.stores &&
          storeWithGroup.group.stores.length > 0
        ) {
          allowedStoreIds = storeWithGroup.group.stores.map((s) => s.id)
        } else {
          allowedStoreIds = [storeId]
        }
      } else {
        // Jika Admin Toko biasa: STRICT SCOPING murni HANYA 1 TOKO CABANG INI!
        allowedStoreIds = [storeId]
      }
    }

    // Status filter:
    // Purna Jual = Pesanan Selesai / Retur (COMPLETED, RETURNED)
    // Admin Toko = Pesanan Berlangsung (PAID, IN_PROGRESS, SHIPPED, PENDING_PAYMENT)
    const statusCondition = isAfterSales
      ? { in: ['COMPLETED', 'RETURNED'] }
      : { in: ['PAID', 'IN_PROGRESS', 'SHIPPED', 'PENDING_PAYMENT'] }

    const whereClause: any = {
      userId: session.user.id,
      status: statusCondition,
      ...(allowedStoreIds.length > 0 && {
        storeId: { in: allowedStoreIds },
      }),
      ...(search && {
        OR: [
          { orderNumber: { contains: search, mode: 'insensitive' } },
          {
            items: {
              some: {
                product: { name: { contains: search, mode: 'insensitive' } },
              },
            },
          },
        ],
      }),
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
        updatedAt: true,
        store: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
        items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            variantName: true,
            product: {
              select: {
                id: true,
                name: true,
                images: true,
                brand: true,
              },
            },
          },
        },
        returnRequests: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            type: true,
            reason: true,
          },
        },
      },
      take: limit,
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Error fetching customer scoped orders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
