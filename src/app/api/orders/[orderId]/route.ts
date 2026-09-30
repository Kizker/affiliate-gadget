import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import { cancelExpiredOrderIfDue } from '@/lib/order-expiration'

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
    const { role, id: userId, storeId } = session.user

    // Scoped query filter by role to prevent IDOR & ID enumeration at database level
    let whereClause: any = { id: orderId }

    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      whereClause = { id: orderId }
    } else if (role === 'STORE_ADMIN' && storeId) {
      whereClause = { id: orderId, storeId }
    } else {
      whereClause = {
        id: orderId,
        OR: [{ userId }, { technician: { userId } }],
      }
    }

    const order = await prisma.order.findFirst({
      where: whereClause,
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
        payment: true,
        store: {
          select: {
            id: true,
            name: true,
            city: true,
            bankAccounts: {
              select: {
                bankName: true,
                accountNumber: true,
                accountName: true,
                isPrimary: true,
              },
            },
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Auto-cancel jika pesanan PENDING_PAYMENT sudah melebihi batas 24 jam
    if (order.status === 'PENDING_PAYMENT') {
      const cancelCheck = await cancelExpiredOrderIfDue(order.id)
      if (cancelCheck.wasCancelled && cancelCheck.order) {
        return NextResponse.json(
          {
            order: {
              ...order,
              status: 'CANCELLED',
              notes: cancelCheck.order.notes,
              payment: order.payment
                ? { ...order.payment, status: 'EXPIRED' }
                : null,
            },
          },
          {
            headers: {
              'Cache-Control': 'no-store, must-revalidate',
            },
          }
        )
      }
    }

    // No cache for order data to ensure price updates are reflected immediately
    return NextResponse.json(
      { order },
      {
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
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
