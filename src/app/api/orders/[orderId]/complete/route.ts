import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// POST - Customer manually completes order (releasing escrow funds to store and relinquishing 30-day warranty)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await params

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        userId: true,
        status: true,
        customerConfirmedAt: true,
        completedAt: true,
        warrantyExpiryDate: true,
        storeId: true,
        returnRequests: {
          where: {
            status: { in: ['PENDING', 'IN_REVIEW', 'APPROVED'] },
          },
          select: { id: true },
        },
      },
    })

    if (!order || order.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Pesanan tidak ditemukan' },
        { status: 404 }
      )
    }

    if (order.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Pesanan yang telah dibatalkan tidak dapat diselesaikan' },
        { status: 400 }
      )
    }

    if (!order.customerConfirmedAt) {
      return NextResponse.json(
        {
          error:
            'Pesanan harus dikonfirmasi diterima terlebih dahulu sebelum dapat diselesaikan',
        },
        { status: 400 }
      )
    }

    if (order.completedAt || order.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Pesanan sudah diselesaikan sebelumnya' },
        { status: 400 }
      )
    }

    if (order.returnRequests && order.returnRequests.length > 0) {
      return NextResponse.json(
        {
          error:
            'Pesanan sedang dalam proses pengajuan retur/komplain aktif dan tidak dapat diselesaikan langsung',
        },
        { status: 400 }
      )
    }

    const now = new Date()

    // Selesaikan pesanan secara manual:
    // 1. Status menjadi COMPLETED dan completedAt dicatat
    // 2. Garansi otomatis berakhir (warrantyExpiryDate diset ke waktu sekarang)
    // 3. Dana otomatis cair dari Escrow ke Saldo Siap Cair Toko
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'COMPLETED',
        completedAt: now,
        warrantyExpiryDate: now,
      },
    })

    return NextResponse.json({
      success: true,
      message:
        'Pesanan berhasil diselesaikan secara manual. Dana telah dicairkan ke toko dan garansi telah dituntaskan.',
      order: updatedOrder,
    })
  } catch (error) {
    console.error('Error manually completing order:', error)
    return NextResponse.json(
      { error: 'Gagal menyelesaikan pesanan' },
      { status: 500 }
    )
  }
}
