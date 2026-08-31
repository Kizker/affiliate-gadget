import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// GET - Single return request details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: true,
                service: true,
              },
            },
            store: true,
          },
        },
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    })

    if (!returnRequest) {
      return NextResponse.json(
        { error: 'Pengajuan pengembalian tidak ditemukan' },
        { status: 404 }
      )
    }

    // Access check: Customer can only view own, Store Admin can view store's, Admin/Superadmin can view all
    if (
      session.user.role === 'CUSTOMER' &&
      returnRequest.userId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ success: true, data: returnRequest })
  } catch (error) {
    console.error('Error fetching return request:', error)
    return NextResponse.json(
      { error: 'Failed to fetch return request' },
      { status: 500 }
    )
  }
}

// PUT - Update return request status or add tracking number
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const {
      status,
      storeResponse,
      returnCourier,
      returnTrackingNumber,
    } = body

    const existing = await prisma.returnRequest.findUnique({
      where: { id },
      include: {
        order: true,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Pengajuan pengembalian tidak ditemukan' },
        { status: 404 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {}

    // Customer can update return tracking number
    if (session.user.role === 'CUSTOMER') {
      if (existing.userId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      if (returnCourier !== undefined) updateData.returnCourier = returnCourier
      if (returnTrackingNumber !== undefined) updateData.returnTrackingNumber = returnTrackingNumber
    } else {
      // Admins & Store Admins can update status, response, etc.
      if (status) updateData.status = status
      if (storeResponse !== undefined) updateData.storeResponse = storeResponse
      if (returnCourier !== undefined) updateData.returnCourier = returnCourier
      if (returnTrackingNumber !== undefined) updateData.returnTrackingNumber = returnTrackingNumber
      if (status === 'COMPLETED' || status === 'APPROVED' || status === 'REJECTED') {
        updateData.resolvedAt = new Date()
      }
    }

    const updated = await prisma.returnRequest.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      message: 'Pengajuan pengembalian berhasil diperbarui',
      data: updated,
    })
  } catch (error) {
    console.error('Error updating return request:', error)
    return NextResponse.json(
      { error: 'Gagal memperbarui pengajuan pengembalian' },
      { status: 500 }
    )
  }
}
