import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// GET - List return requests
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const orderId = searchParams.get('orderId')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}

    // Role-based access control
    if (session.user.role === 'CUSTOMER') {
      where.userId = session.user.id
    } else if (session.user.role === 'STORE_ADMIN') {
      if (session.user.storeId) {
        where.OR = [
          { storeId: session.user.storeId },
          { order: { storeId: session.user.storeId } }
        ]
      }
    } else if (session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN') {
      // Platform Admin and Superadmin see all requests
    }

    if (status) {
      where.status = status
    }

    if (orderId) {
      where.orderId = orderId
    }

    const returns = await prisma.returnRequest.findMany({
      where,
      include: {
        order: {
          select: {
            orderNumber: true,
            status: true,
            total: true,
            courierCode: true,
            courierService: true,
            items: {
              include: {
                product: { select: { id: true, name: true, brand: true, images: true } },
                service: { select: { id: true, name: true } },
              },
            },
            store: {
              select: { id: true, name: true, companyName: true, city: true, phone: true },
            },
          },
        },
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: returns })
  } catch (error) {
    console.error('Error fetching return requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch return requests' },
      { status: 500 }
    )
  }
}

// POST - Create new return/refund request
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      orderId,
      type = 'REFUND', // 'REFUND' | 'REPLACEMENT'
      reason,
      reasonLabel,
      description,
      images = [],
      videoUrl,
      bankName,
      bankAccountNumber,
      bankAccountName,
    } = body

    if (!orderId || !reason || !description) {
      return NextResponse.json(
        { error: 'Order ID, alasan, dan rincian kendala wajib diisi' },
        { status: 400 }
      )
    }

    if (type === 'REFUND' && (!bankName || !bankAccountNumber || !bankAccountName)) {
      return NextResponse.json(
        { error: 'Informasi rekening bank (Nama Bank, Nomor Rekening, Atas Nama) wajib diisi untuk pengembalian dana.' },
        { status: 400 }
      )
    }

    // Verify order exists and belongs to user
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        store: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 })
    }

    if (order.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Anda hanya dapat mengajukan pengembalian untuk pesanan Anda sendiri' },
        { status: 403 }
      )
    }

    // Check if order is completed
    if (order.status !== 'COMPLETED' && order.status !== 'COMPLAINED') {
      return NextResponse.json(
        { error: 'Pengajuan pengembalian hanya dapat dilakukan untuk pesanan yang telah selesai diterima' },
        { status: 400 }
      )
    }

    // Check 30-day window
    const completedDate = order.completedAt || order.customerConfirmedAt || order.updatedAt
    const daysSinceCompleted = Math.floor(
      (Date.now() - new Date(completedDate).getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysSinceCompleted > 30) {
      return NextResponse.json(
        { error: 'Batas waktu pengajuan pengembalian (30 hari sejak penerimaan pesanan) telah berakhir.' },
        { status: 400 }
      )
    }

    // Check if there is already an active return request
    const activeReturn = await prisma.returnRequest.findFirst({
      where: {
        orderId,
        status: { in: ['PENDING', 'IN_REVIEW', 'APPROVED'] },
      },
    })

    if (activeReturn) {
      return NextResponse.json(
        {
          error:
            'Sudah ada pengajuan pengembalian aktif untuk pesanan ini. Harap tunggu verifikasi toko terlebih dahulu.',
        },
        { status: 400 }
      )
    }

    // Create the ReturnRequest in a transaction
    const [returnRequest] = await prisma.$transaction([
      prisma.returnRequest.create({
        data: {
          orderId,
          userId: session.user.id,
          storeId: order.storeId,
          type: type === 'REPLACEMENT' ? 'REPLACEMENT' : 'REFUND',
          reason,
          reasonLabel: reasonLabel || reason,
          description,
          images: Array.isArray(images) ? images : [],
          videoUrl: videoUrl || null,
          bankName: type === 'REFUND' ? bankName : null,
          bankAccountNumber: type === 'REFUND' ? bankAccountNumber : null,
          bankAccountName: type === 'REFUND' ? bankAccountName : null,
          refundAmount: type === 'REFUND' ? order.total : null,
          status: 'PENDING',
        },
        include: {
          order: {
            select: {
              orderNumber: true,
              total: true,
            },
          },
        },
      }),
      // Create notification for customer
      prisma.notification.create({
        data: {
          userId: session.user.id,
          type: 'NEW_COMPLAINT',
          title: 'Pengajuan Pengembalian Berhasil Dikirim',
          message: `Pengajuan pengembalian untuk pesanan #${order.orderNumber} berhasil dikirim dan sedang menunggu verifikasi cabang toko.`,
          link: `/dashboard/customer/orders/${order.id}`,
        },
      }),
    ])

    return NextResponse.json(
      {
        success: true,
        message: 'Pengajuan pengembalian berhasil dikirim.',
        data: returnRequest,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating return request:', error)
    return NextResponse.json(
      { error: error.message || 'Gagal mengajukan pengembalian' },
      { status: 500 }
    )
  }
}
